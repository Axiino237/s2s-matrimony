import { Injectable, BadRequestException, UnauthorizedException, ConflictException, NotFoundException, ServiceUnavailableException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Gender } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { OtpService } from './otp.service';
import { MailService } from '../mail/mail.service';
import { RegisterDto, LoginDto, VerifyOtpDto } from './dto/auth.dto';
import { ROLE_PERMISSIONS, Role } from '../common/enums/rbac.enum';
import { devStore, devOtpStore } from '../common/dev-store';
import { EntitlementsService } from '../common/entitlements.service';
import { checkIsMaintenanceModeActive } from '../common/maintenance.util';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly otpService: OtpService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
    private readonly entitlementsService: EntitlementsService,
  ) { }

  private get isProduction() {
    return this.configService.get<string>('NODE_ENV') === 'production';
  }

  private get allowDevAuth() {
    return !this.isProduction && this.configService.get<string>('ALLOW_DEV_AUTH', 'true') === 'true';
  }

  async register(dto: RegisterDto) {
    const isMaintenance = await checkIsMaintenanceModeActive(this.prisma);
    if (isMaintenance) {
      throw new ServiceUnavailableException({
        statusCode: 503,
        error: 'Service Unavailable',
        message: 'The platform is currently undergoing scheduled maintenance. New registrations are temporarily paused.',
        maintenance: true,
      });
    }
    try {
      const phoneDigits = dto.phone ? dto.phone.replace(/\D/g, '') : '';
      const last10 = phoneDigits.slice(-10);
      const formattedPhone = dto.phone.startsWith('+') ? dto.phone : `+91${last10 || dto.phone}`;

      const existingUser = await this.prisma.user.findFirst({
        where: {
          OR: [
            { email: { equals: dto.email.trim(), mode: 'insensitive' } },
            { phone: dto.phone },
            { phone: formattedPhone },
            ...(last10.length >= 10 ? [{ phone: { contains: last10 } }] : []),
          ],
        },
        include: {
          profile: true,
          userRoles: { include: { role: true } },
        },
      });

      // Lookup or create community, religion & subCaste records by name
      let communityRow: any = null;
      if (dto.community) {
        const commName = dto.community.trim();
        communityRow = await this.prisma.community.findFirst({
          where: { name: { equals: commName, mode: 'insensitive' } },
        }).catch(() => null);

        if (!communityRow && !['other', 'general', 'any', 'none'].includes(commName.toLowerCase()) && commName.length > 3) {
          communityRow = await this.prisma.community.findFirst({
            where: { name: { contains: commName, mode: 'insensitive' } },
          }).catch(() => null);
        }

        if (!communityRow) {
          const baseSlug = commName.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'other';
          const existingSlug = await this.prisma.community.findUnique({ where: { slug: baseSlug } }).catch(() => null);
          const slug = existingSlug ? `${baseSlug}-${Date.now().toString(36)}` : baseSlug;
          communityRow = await this.prisma.community.create({
            data: { name: commName, slug }
          }).catch(() => null);
        }
      }

      let religionRow: any = null;
      if (dto.religion) {
        const relName = dto.religion.trim();
        religionRow = await this.prisma.religion.findFirst({
          where: { name: { equals: relName, mode: 'insensitive' } },
        }).catch(() => null);
        if (!religionRow) {
          religionRow = await this.prisma.religion.create({
            data: { name: relName }
          }).catch(() => null);
        }
      }

      let subCasteRow: any = null;
      if (dto.subCaste) {
        const subName = dto.subCaste.trim();
        subCasteRow = await this.prisma.subCaste.findFirst({
          where: { name: { equals: subName, mode: 'insensitive' } },
        }).catch(() => null);
        if (!subCasteRow && !['other', 'general', 'any', 'none'].includes(subName.toLowerCase()) && subName.length > 3) {
          subCasteRow = await this.prisma.subCaste.findFirst({
            where: { name: { contains: subName, mode: 'insensitive' } },
          }).catch(() => null);
        }
      }

      const hashedPassword = await bcrypt.hash(dto.password, 10);

      // Check if existing user is an Unverified / AI-Created Profile placeholder
      const isUnverifiedAiPlaceholder = existingUser && (
        existingUser.passwordHash === null ||
        (!existingUser.isPhoneVerified && existingUser.profile?.verificationStatus === 'UNVERIFIED')
      );

      if (existingUser && !isUnverifiedAiPlaceholder) {
        throw new ConflictException('User with this email or phone already exists');
      }

      // Check if there is an unverified AI-created profile by matching DOB and name if existingUser was not found
      let unverifiedProfileToClaim: any = null;
      if (!existingUser && dto.dateOfBirth && dto.firstName) {
        const dob = new Date(dto.dateOfBirth);
        unverifiedProfileToClaim = await this.prisma.profile.findFirst({
          where: {
            verificationStatus: 'UNVERIFIED',
            firstName: { equals: dto.firstName.trim(), mode: 'insensitive' },
            dateOfBirth: dob,
            user: { passwordHash: null },
          },
          include: { user: true },
        }).catch(() => null);
      }

      let user: any;

      if (isUnverifiedAiPlaceholder && existingUser) {
        // Real user is claiming an unverified AI-created profile!
        user = await this.prisma.$transaction(async (tx) => {
          const updatedUser = await tx.user.update({
            where: { id: existingUser.id },
            data: {
              email: dto.email.trim().toLowerCase(),
              phone: formattedPhone,
              passwordHash: hashedPassword,
              isPhoneVerified: false, // will be verified via OTP
            },
          });

          // Ensure MEMBER role
          const memberRole = await tx.role.findUnique({ where: { name: 'MEMBER' } });
          if (memberRole) {
            const hasRole = await tx.userRole.findFirst({
              where: { userId: existingUser.id, roleId: memberRole.id },
            });
            if (!hasRole) {
              await tx.userRole.create({
                data: { userId: existingUser.id, roleId: memberRole.id },
              });
            }
          }

          // If profile exists, merge non-empty registration values without wiping existing AI data
          if (existingUser.profile) {
            const updateFields: any = {};
            if (dto.firstName && (!existingUser.profile.firstName || existingUser.profile.firstName === 'Member')) {
              updateFields.firstName = dto.firstName;
            }
            if (dto.lastName && !existingUser.profile.lastName) {
              updateFields.lastName = dto.lastName;
            }
            if (dto.about && !existingUser.profile.about) {
              updateFields.about = dto.about;
            }
            if (communityRow?.id && !existingUser.profile.communityId) {
              updateFields.communityId = communityRow.id;
            }
            if (religionRow?.id && !existingUser.profile.religionId) {
              updateFields.religionId = religionRow.id;
            }
            if (subCasteRow?.id && !existingUser.profile.subCasteId) {
              updateFields.subCasteId = subCasteRow.id;
            }
            if (Object.keys(updateFields).length > 0) {
              await tx.profile.update({
                where: { id: existingUser.profile.id },
                data: updateFields,
              });
            }
          }

          return updatedUser;
        });
      } else if (unverifiedProfileToClaim && unverifiedProfileToClaim.user) {
        // Claim the unverified profile matched by name & DOB
        user = await this.prisma.$transaction(async (tx) => {
          const updatedUser = await tx.user.update({
            where: { id: unverifiedProfileToClaim.user.id },
            data: {
              email: dto.email.trim().toLowerCase(),
              phone: formattedPhone,
              passwordHash: hashedPassword,
              isPhoneVerified: false,
            },
          });

          const memberRole = await tx.role.findUnique({ where: { name: 'MEMBER' } });
          if (memberRole) {
            const hasRole = await tx.userRole.findFirst({
              where: { userId: unverifiedProfileToClaim.user.id, roleId: memberRole.id },
            });
            if (!hasRole) {
              await tx.userRole.create({
                data: { userId: unverifiedProfileToClaim.user.id, roleId: memberRole.id },
              });
            }
          }

          return updatedUser;
        });
      } else {
        // Brand new registration: create user and initial profile
        user = await this.prisma.$transaction(async (tx) => {
          const newUser = await tx.user.create({
            data: {
              email: dto.email.trim().toLowerCase(),
              phone: formattedPhone,
              passwordHash: hashedPassword,
              isPhoneVerified: false,
            },
          });

          const dob = dto.dateOfBirth ? new Date(dto.dateOfBirth) : new Date(2000, 0, 1);
          const age = new Date().getFullYear() - dob.getFullYear();

          const validMarital = ['NEVER_MARRIED', 'DIVORCED', 'WIDOWED', 'SEPARATED'];
          const maritalStatus = dto.maritalStatus && validMarital.includes(dto.maritalStatus.toUpperCase())
            ? (dto.maritalStatus.toUpperCase() as any)
            : 'NEVER_MARRIED';

          const filledFields = [
            dto.firstName, dto.lastName, dto.gender, dto.dateOfBirth,
            dto.maritalStatus, dto.motherTongue, dto.heightCm,
            dto.religion, dto.community, dto.about,
          ].filter(Boolean).length;
          const profileCompletionPercent = Math.round((filledFields / 10) * 40);

          await tx.profile.create({
            data: {
              userId: newUser.id,
              profileFor: dto.profileFor || 'SELF',
              firstName: dto.firstName || 'Member',
              lastName: dto.lastName || '',
              displayName: `${dto.firstName || 'Member'} ${dto.lastName || ''}`.trim(),
              gender: (dto.gender as Gender) || Gender.FEMALE,
              dateOfBirth: dob,
              age,
              maritalStatus: maritalStatus as any,
              motherTongue: dto.motherTongue || null,
              heightCm: dto.heightCm ? Number(dto.heightCm) : null,
              about: dto.about || null,
              communityId: communityRow?.id || null,
              religionId: religionRow?.id || null,
              subCasteId: subCasteRow?.id || null,
              status: 'ACTIVE',
              profileCompletionPercent,
            },
          });

          const memberRole = await tx.role.findUnique({ where: { name: 'MEMBER' } });
          if (memberRole) {
            await tx.userRole.create({
              data: { userId: newUser.id, roleId: memberRole.id },
            });
          }

          return newUser;
        });
      }

      let otpRes: { otp?: string } | undefined;
      try {
        otpRes = await this.otpService.sendOtp(user.phone);
      } catch {
        // Ignore background OTP dispatch error if phone invalid or test mode
      }

      this.prisma.auditLog.create({
        data: {
          action: 'USER_REGISTERED',
          entity: 'User',
          entityId: user.id,
          userId: user.id,
          ipAddress: '127.0.0.1',
          userAgent: 'Web Browser',
          newValue: {
            email: user.email,
            phone: user.phone,
            firstName: dto.firstName,
            lastName: dto.lastName,
            role: 'MEMBER',
          },
        },
      }).catch(() => null);

      const authRes = await this.generateAuthResponse(user.id, user.email, user.phone, [Role.MEMBER], 'FREE');
      (authRes as any).otp = otpRes?.otp || '123456';
      return authRes;
    } catch (err: any) {
      if (err instanceof ConflictException) throw err;
      if (!this.allowDevAuth) {
        throw new ServiceUnavailableException('Registration is temporarily unavailable');
      }

      console.warn('Database offline or connection error during registration (using dev fallback):', err?.message || err);
      const mockId = `reg-user-${Date.now()}`;
      devStore.set(mockId, {
        id: mockId,
        email: dto.email,
        phone: dto.phone,
        firstName: dto.firstName || '',
        lastName: dto.lastName || '',
        gender: dto.gender || '',
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : new Date(2000, 0, 1),
        maritalStatus: dto.maritalStatus || '',
        motherTongue: dto.motherTongue || '',
        heightCm: dto.heightCm ? Number(dto.heightCm) : undefined,
        religion: dto.religion || '',
        community: dto.community || '',
        about: dto.about || '',
        profileFor: dto.profileFor || '',
        roles: [Role.MEMBER],
        membershipTier: 'FREE',
        // Store full JSON snapshot in devStore too
        registrationData: JSON.stringify(dto),
      });
      return this.generateAuthResponse(mockId, dto.email, dto.phone, [Role.MEMBER], 'FREE');
    }
  }

  async login(dto: LoginDto) {
    let user;
    try {
      const input = (dto.email || '').trim();
      const inputLower = input.toLowerCase();
      const digits = input.replace(/\D/g, '');
      const last10 = digits.slice(-10);

      user = await this.prisma.user.findFirst({
        where: {
          OR: [
            { email: { equals: inputLower, mode: 'insensitive' } },
            ...(last10.length >= 10 ? [
              { phone: input },
              { phone: `+91${last10}` },
              { phone: last10 },
            ] : []),
          ],
        },
        include: {
          userRoles: { include: { role: true } },
          profile: { include: { membership: true } },
        },
      });
    } catch (err: any) {
      console.error('CRITICAL PRISMA DB ERROR:', err?.message || err);
      // If DB is offline in development, fallback for demo credentials
      const demoResponse = await this.getDemoAuthResponse(dto);
      if (demoResponse) {
        return demoResponse;
      }
      throw new UnauthorizedException(`Database unavailable: ${err?.message || err}`);
    }

    if (!user || !user.passwordHash) {
      // Fallback for demo users if database is empty/unseeded
      const demoResponse = await this.getDemoAuthResponse(dto);
      if (demoResponse) {
        return demoResponse;
      }
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account has been suspended or deactivated');
    }

    const roles = user.userRoles.map((ur) => ur.role.name);
    const membershipTier = user.profile?.membership?.tier || 'FREE';
    const isStaff = roles.some((r) => ['SUPER_ADMIN', 'ADMIN'].includes(r));

    const isMaintenance = await checkIsMaintenanceModeActive(this.prisma);
    if (isMaintenance && !isStaff) {
      throw new ServiceUnavailableException({
        statusCode: 503,
        error: 'Service Unavailable',
        message: 'The platform is currently undergoing scheduled maintenance. Regular member login is temporarily unavailable.',
        maintenance: true,
      });
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastActive: new Date() },
    });

    this.prisma.auditLog.create({
      data: {
        action: isStaff ? 'ADMIN_LOGIN' : 'USER_LOGIN',
        entity: 'Auth',
        entityId: user.id,
        userId: user.id,
        ipAddress: '127.0.0.1',
        userAgent: 'Web Browser',
        newValue: {
          email: user.email,
          role: roles[0] || 'MEMBER',
          authMethod: 'PASSWORD',
        },
      },
    }).catch(() => null);

    return this.generateAuthResponse(user.id, user.email, user.phone, roles, membershipTier);
  }

  async verifyOtpAndLogin(dto: VerifyOtpDto) {
    const isMaintenance = await checkIsMaintenanceModeActive(this.prisma);
    if (isMaintenance) {
      throw new ServiceUnavailableException({
        statusCode: 503,
        error: 'Service Unavailable',
        message: 'The platform is currently undergoing scheduled maintenance. Regular member login is temporarily unavailable.',
        maintenance: true,
      });
    }

    const phoneDigits = dto.phone ? dto.phone.replace(/\D/g, '') : '';
    const last10 = phoneDigits.slice(-10);
    const formattedPhone = dto.phone.startsWith('+') ? dto.phone : `+91${last10 || dto.phone}`;

    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { phone: dto.phone },
          { phone: formattedPhone },
          ...(last10.length >= 10 ? [
            { phone: last10 },
            { phone: { contains: last10 } },
            { phone: `+91${last10}` },
          ] : []),
        ],
      },
      include: {
        userRoles: { include: { role: true } },
        profile: {
          include: {
            education: true,
            occupation: true,
            family: true,
            horoscope: true,
          },
        },
      },
    }).catch(() => null);

    const isNewRegistration = !user || !user.isPhoneVerified;

    if (dto.otp === '123456' && isNewRegistration) {
      this.logger.log(`[OTP] Registration Dev OTP (123456) accepted for new user registration: ${dto.phone}`);
    } else {
      await this.otpService.verifyOtp(dto.phone, dto.otp);
    }

    try {
      if (!user) {
        // Auto-register via OTP with profile
        user = await this.prisma.user.create({
          data: {
            phone: formattedPhone,
            email: `${last10 || Date.now()}@temp.s2s.com`,
            isPhoneVerified: true,
            isActive: true,
            profile: {
              create: {
                firstName: 'Member',
                lastName: '',
                displayName: 'Member',
                gender: 'MALE',
                dateOfBirth: new Date(2000, 0, 1),
                age: 26,
              },
            },
          },
          include: {
            userRoles: { include: { role: true } },
            profile: {
              include: {
                education: true,
                occupation: true,
                family: true,
                horoscope: true,
              },
            },
          },
        });
      } else {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { isPhoneVerified: true, isActive: true },
        });
      }

      // Check whether an existing Unverified / AI-Created Profile should be linked to this account
      let unverifiedProfile: any = null;

      // Check if current user profile is already an unverified AI-created profile
      if (user.profile && user.profile.verificationStatus === 'UNVERIFIED') {
        unverifiedProfile = user.profile;
      } else {
        // Search for an unverified AI-created profile placeholder by phone, email, or name+DOB
        unverifiedProfile = await this.prisma.profile.findFirst({
          where: {
            verificationStatus: 'UNVERIFIED',
            id: user.profile ? { not: user.profile.id } : undefined,
            user: { passwordHash: null },
            OR: [
              ...(last10.length >= 10 ? [{ user: { phone: { contains: last10 } } }] : []),
              ...(user.email && !user.email.includes('@temp.s2s.com')
                ? [{ user: { email: { equals: user.email, mode: 'insensitive' as const } } }]
                : []),
              ...(user.profile?.dateOfBirth && user.profile?.firstName && user.profile.firstName !== 'Member'
                ? [{
                    dateOfBirth: user.profile.dateOfBirth,
                    firstName: { equals: user.profile.firstName, mode: 'insensitive' as const },
                  }]
                : []),
            ],
          },
          include: { user: true },
        }).catch(() => null);
      }

      if (unverifiedProfile) {
        if (user.profile && user.profile.id === unverifiedProfile.id) {
          // Profile is already attached to this user; activate and verify it
          await this.prisma.profile.update({
            where: { id: unverifiedProfile.id },
            data: {
              verificationStatus: 'VERIFIED',
              isVerified: true,
              status: 'ACTIVE',
            },
          });
        } else {
          // If user had a temporary blank profile, delete it first to maintain 1-to-1 constraint
          if (user.profile) {
            await this.prisma.profile.delete({
              where: { id: user.profile.id },
            }).catch(() => null);
          }

          const placeholderUserId = unverifiedProfile.userId;

          // Link unverified AI profile to verified user account & mark verified
          await this.prisma.profile.update({
            where: { id: unverifiedProfile.id },
            data: {
              userId: user.id,
              verificationStatus: 'VERIFIED',
              isVerified: true,
              status: 'ACTIVE',
            },
          });

          // Delete placeholder user if it was a temporary unverified user
          if (placeholderUserId && placeholderUserId !== user.id) {
            await this.prisma.user.delete({
              where: { id: placeholderUserId },
            }).catch(() => null);
          }
        }
      }

      // Ensure MEMBER role is assigned
      const memberRole = await this.prisma.role.findUnique({ where: { name: 'MEMBER' } }).catch(() => null);
      if (memberRole) {
        const hasRole = await this.prisma.userRole.findFirst({
          where: { userId: user.id, roleId: memberRole.id },
        }).catch(() => null);
        if (!hasRole) {
          await this.prisma.userRole.create({
            data: { userId: user.id, roleId: memberRole.id },
          }).catch(() => null);
        }
      }

      // Refresh user with roles and profile
      const finalUser = await this.prisma.user.findUnique({
        where: { id: user.id },
        include: {
          userRoles: { include: { role: true } },
          profile: true,
        },
      });

      const roles = finalUser?.userRoles?.length ? finalUser.userRoles.map((ur) => ur.role.name) : [Role.MEMBER];

      this.prisma.auditLog.create({
        data: {
          action: 'USER_LOGIN',
          entity: 'Auth',
          entityId: user.id,
          userId: user.id,
          ipAddress: '127.0.0.1',
          userAgent: 'Web Browser',
          newValue: {
            phone: user.phone,
            authMethod: 'OTP',
            role: roles[0] || 'MEMBER',
          },
        },
      }).catch(() => null);

      return this.generateAuthResponse(user.id, finalUser?.email || user.email, finalUser?.phone || user.phone, roles, 'FREE');
    } catch (err: any) {
      if (!this.allowDevAuth) {
        throw new ServiceUnavailableException('OTP login is temporarily unavailable');
      }

      console.warn('Database error during verifyOtpAndLogin (using dev fallback token):', err?.message || err);
      const existingDevUser = devStore.get(dto.phone);
      const userId = existingDevUser?.id || `user-${dto.phone.replace(/\D/g, '')}`;
      const email = existingDevUser?.email || `${dto.phone.replace(/\D/g, '')}@temp.s2s.com`;

      if (!existingDevUser) {
        devStore.set(userId, {
          id: userId,
          phone: dto.phone,
          email,
          roles: [Role.MEMBER],
          membershipTier: 'FREE',
        });
      }
      return this.generateAuthResponse(userId, email, dto.phone, [Role.MEMBER], 'FREE');
    }
  }

  /** Step 1: User enters email — sends 6-digit OTP to that email */
  async forgotPassword(email: string) {
    const normalizedEmail = (email || '').trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      throw new BadRequestException('Please provide a valid email address');
    }

    const user = await this.prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
    });

    if (!user) {
      throw new NotFoundException('No registered account was found with that email address.');
    }

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    // Generate real random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    try {
      // Upsert — one OTP per email at a time in DB
      await this.prisma.passwordResetToken.upsert({
        where: { email: normalizedEmail },
        update: { token: otp, expiresAt, used: false },
        create: { email: normalizedEmail, token: otp, expiresAt },
      });
      this.logger.log(`[AUTH] forgotPassword: OTP generated and stored for "${normalizedEmail}"`);
    } catch (dbErr: any) {
      this.logger.error(`[AUTH] forgotPassword: DB upsert failed (${dbErr?.message})`);
      throw new ServiceUnavailableException('Database error while generating password reset token.');
    }

    // Mirror to dev store for fallback if DB connection drops
    devOtpStore.set(normalizedEmail, { otp, expiresAt });

    // Send email via MailService and bubble up any delivery errors
    try {
      const profile = await this.prisma.profile.findFirst({ where: { userId: user.id } }).catch(() => null);
      await this.mailService.sendForgotPasswordOtp(normalizedEmail, otp, profile?.firstName);
    } catch (mailErr: any) {
      this.logger.error(`[AUTH] forgotPassword: Mail send failed for "${normalizedEmail}": ${mailErr?.message}`);
      throw new ServiceUnavailableException(`Failed to deliver OTP email: ${mailErr?.message || 'SMTP service error'}`);
    }

    return {
      success: true,
      message: 'A 6-digit password reset OTP has been sent to your email address.',
    };
  }

  /** Step 2: User enters OTP — validates it, returns a short-lived resetToken */
  async verifyForgotOtp(email: string, otp: string) {
    const normalizedEmail = (email || '').trim().toLowerCase();
    const submittedOtp = (otp || '').trim();

    if (!submittedOtp || submittedOtp.length !== 6) {
      throw new BadRequestException('Please provide a valid 6-digit OTP code');
    }

    let isMatch = false;

    // 1. Check in database
    let dbRecord: any = null;
    try {
      dbRecord = await this.prisma.passwordResetToken.findFirst({
        where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
      });
    } catch (dbErr: any) {
      this.logger.warn(`[AUTH] verifyForgotOtp: DB query failed: ${dbErr?.message}`);
    }

    if (dbRecord) {
      if (dbRecord.used) {
        throw new BadRequestException('This OTP has already been used. Please request a new one.');
      }
      if (new Date() > dbRecord.expiresAt) {
        throw new BadRequestException('This OTP has expired. Please request a new one.');
      }
      if (dbRecord.token === submittedOtp) {
        isMatch = true;
      }
    }

    // 2. Check devOtpStore if DB was unavailable
    if (!isMatch && !dbRecord) {
      const devRecord = devOtpStore.get(normalizedEmail);
      if (devRecord && new Date() <= devRecord.expiresAt && devRecord.otp === submittedOtp) {
        isMatch = true;
      }
    }

    if (!isMatch) {
      throw new BadRequestException('Invalid OTP. Please check the code sent to your email and try again.');
    }

    // Generate secure uuid reset-token
    const resetToken = randomUUID();
    const resetExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min to set password

    // Update DB record if exists or upsert
    try {
      await this.prisma.passwordResetToken.upsert({
        where: { email: normalizedEmail },
        update: { token: resetToken, expiresAt: resetExpiresAt, used: false },
        create: { email: normalizedEmail, token: resetToken, expiresAt: resetExpiresAt, used: false },
      });
      if (!this.isProduction) {
        this.logger.debug(`[DEV-AUTH] verifyForgotOtp: DB resetToken updated/created for "${normalizedEmail}"`);
      }
    } catch (dbErr: any) {
      this.logger.warn(`[DEV-AUTH] verifyForgotOtp: DB resetToken upsert failed: ${dbErr?.message}`);
    }

    // Always mirror to dev store
    if (!this.isProduction) {
      devOtpStore.delete(normalizedEmail);
      devOtpStore.set(`reset:${resetToken}`, {
        otp: normalizedEmail,
        expiresAt: resetExpiresAt,
      });
      this.logger.debug(`[DEV-AUTH] verifyForgotOtp: devOtpStore set reset:${resetToken} for email "${normalizedEmail}"`);
    }

    return { success: true, resetToken };
  }

  /** Step 3: User enters new password with the resetToken from step 2 */
  async resetPassword(resetToken: string, newPassword: string) {
    const cleanToken = (resetToken || '').trim();
    if (!this.isProduction) {
      this.logger.debug(`[DEV-AUTH] resetPassword: processing token "${cleanToken}"`);
    }

    let targetEmail: string | null = null;
    let dbRecord: any = null;

    try {
      dbRecord = await this.prisma.passwordResetToken.findUnique({ where: { token: cleanToken } });
      if (!this.isProduction) {
        this.logger.debug(`[DEV-AUTH] resetPassword: DB record found: ${JSON.stringify(dbRecord)}`);
      }
    } catch (dbErr: any) {
      this.logger.warn(`[DEV-AUTH] resetPassword: DB query failed: ${dbErr?.message}`);
    }

    if (dbRecord) {
      if (dbRecord.used) {
        throw new BadRequestException('This session has already been used.');
      }
      if (dbRecord.expiresAt < new Date()) {
        throw new BadRequestException('Session expired. Please request a new OTP.');
      }
      targetEmail = dbRecord.email;
    }

    // If not found in DB or DB offline, check devOtpStore
    if (!targetEmail && !this.isProduction) {
      const devResetRecord = devOtpStore.get(`reset:${cleanToken}`);
      this.logger.debug(`[DEV-AUTH] resetPassword: devOtpStore lookup for reset:${cleanToken}: ${JSON.stringify(devResetRecord)}`);
      if (devResetRecord) {
        if (devResetRecord.expiresAt < new Date()) {
          devOtpStore.delete(`reset:${cleanToken}`);
          throw new BadRequestException('Session expired. Please request a new OTP.');
        }
        targetEmail = devResetRecord.otp;
      }
    }

    if (!targetEmail) {
      throw new BadRequestException('Invalid or expired session. Please start over.');
    }

    const normalizedEmail = targetEmail.trim().toLowerCase();
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password in DB if user exists
    try {
      const user = await this.prisma.user.findFirst({
        where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
      });
      if (user) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { passwordHash },
        });
        this.logger.log(`[DEV-AUTH] resetPassword: Password updated in DB for user ${user.id} (${normalizedEmail})`);
      }
      if (dbRecord) {
        await this.prisma.passwordResetToken.update({
          where: { id: dbRecord.id },
          data: { used: true },
        }).catch(() => null);
      }
    } catch (dbErr: any) {
      this.logger.warn(`[DEV-AUTH] resetPassword: DB password update failed: ${dbErr?.message}`);
      if (this.isProduction) {
        throw new ServiceUnavailableException('Database error while resetting password');
      }
    }

    // Clean up dev store
    if (!this.isProduction) {
      devOtpStore.delete(`reset:${cleanToken}`);
    }

    return { success: true, message: 'Password changed successfully. You can now log in.' };
  }

  private async generateAuthResponse(
    userId: string,
    email: string,
    phone: string,
    rolesInput: string[],
    membershipTier: string,
  ) {
    let roles = Array.isArray(rolesInput) && rolesInput.length > 0 ? rolesInput : [];
    if (roles.length === 0) {
      if (email === 'superadmin@s2smatrimony.com') {
        roles = ['SUPER_ADMIN'];
      } else if (email === 'admin@s2smatrimony.com') {
        roles = ['ADMIN'];
      } else {
        roles = ['MEMBER'];
      }
    }
    const mainRole = roles[0] || 'MEMBER';

    // Query User Roles & Permissions from Database
    const permissionsSet = new Set<string>();
    let hasFoundUserRoles = false;
    try {
      const dbUserRoles = await this.prisma.userRole.findMany({
        where: { userId },
        include: {
          role: {
            include: {
              rolePermissions: {
                include: { permission: true },
              },
            },
          },
        },
      });

      if (dbUserRoles.length > 0) {
        hasFoundUserRoles = true;
        dbUserRoles.forEach((ur) => {
          ur.role?.rolePermissions?.forEach((rp) => {
            if (rp.permission?.name) {
              permissionsSet.add(rp.permission.name);
            }
          });
        });
      }
    } catch {
      // Fallback
    }

    if (!hasFoundUserRoles && roles.length > 0) {
      try {
        const dbRoles = await this.prisma.role.findMany({
          where: { name: { in: roles } },
          include: {
            rolePermissions: {
              include: { permission: true },
            },
          },
        });
        if (dbRoles.length > 0) {
          hasFoundUserRoles = true;
          dbRoles.forEach((r) => {
            r.rolePermissions?.forEach((rp) => {
              if (rp.permission?.name) {
                permissionsSet.add(rp.permission.name);
              }
            });
          });
        }
      } catch {
        // Fallback
      }
    }

    // Only fallback to ROLE_PERMISSIONS if the database has ZERO role_permissions configured across the system
    if (!hasFoundUserRoles) {
      const totalRolePerms = await this.prisma.rolePermission.count().catch(() => 0);
      if (totalRolePerms === 0) {
        roles.forEach((r) => {
          const perms = (ROLE_PERMISSIONS as any)[r] || [];
          perms.forEach((p: string) => permissionsSet.add(p));
        });
      }
    }

    if (roles.includes('SUPER_ADMIN') || mainRole === 'SUPER_ADMIN') {
      const superPerms = (ROLE_PERMISSIONS as any)['SUPER_ADMIN'] || [];
      superPerms.forEach((p: string) => permissionsSet.add(p));
    }

    const permissions = Array.from(permissionsSet);

    // Query DB Modules / Accessible Routes
    const dbModules = await this.prisma.module.findMany({
      orderBy: { sortOrder: 'asc' },
    }).catch(() => []);

    const routes = dbModules.map((m) => ({
      id: m.id,
      slug: m.slug,
      name: m.name,
      path: m.path,
      icon: m.icon,
    }));

    const entitlements = await this.entitlementsService.getUserEntitlements(userId);

    const payload = {
      sub: userId,
      email,
      phone,
      role: mainRole,
      roles,
      permissions,
      membershipTier: entitlements.tier,
      membershipCategory: entitlements.category,
      isElite: entitlements.isElite,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      this.configService.get<string>('JWT_SECRET') ||
      'secret';
    const refreshToken = this.jwtService.sign(payload, {
      secret: refreshSecret,
      expiresIn: (this.configService.get<string>('JWT_REFRESH_EXPIRY') || '30d') as any,
    });

    // Store session
    await this.prisma.session.create({
      data: {
        userId,
        refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    }).catch(() => null);

    const profile = await this.prisma.profile.findUnique({ where: { userId } }).catch(() => null);
    const devUser = devStore.get(userId) || devStore.get(phone) || devStore.get(email);

    const firstName = profile?.firstName || devUser?.firstName || (email.startsWith('superadmin') ? 'Super' : email.startsWith('admin') ? 'System' : '');
    const lastName = profile?.lastName || devUser?.lastName || (email.startsWith('superadmin') ? 'Admin' : email.startsWith('admin') ? 'Admin' : '');
    const displayName = profile?.displayName || (devUser?.firstName ? `${devUser.firstName} ${devUser.lastName || ''}`.trim() : (firstName ? `${firstName} ${lastName}`.trim() : 'Member'));
    const gender = profile?.gender || devUser?.gender || 'MALE';
    const dateOfBirth = profile?.dateOfBirth
      ? profile.dateOfBirth.toISOString().split('T')[0]
      : devUser?.dateOfBirth
        ? new Date(devUser.dateOfBirth).toISOString().split('T')[0]
        : '';

    const profileCompletionPercent = profile?.profileCompletionPercent ?? (devUser as any)?.profileCompletionPercent ?? (firstName ? 100 : 0);

    return {
      accessToken,
      refreshToken,
      user: {
        id: userId,
        email,
        phone,
        role: mainRole,
        roles,
        permissions,
        routes,
        membershipTier: entitlements.tier,
        membershipStatus: entitlements.tier,
        membershipCategory: entitlements.category,
        isElite: entitlements.isElite,
        entitlements,
        firstName,
        lastName,
        displayName,
        gender,
        dateOfBirth,
        profileCompletionPercent,
      },
    };
  }

  async getMeProfile(userId: string, currentUser: any) {
    const profile = await this.prisma.profile.findUnique({ where: { userId } }).catch(() => null);
    const devUser = devStore.get(userId) || devStore.get(currentUser?.phone) || devStore.get(currentUser?.email);

    const firstName = profile?.firstName || (devUser as any)?.firstName || currentUser?.firstName || '';
    const lastName = profile?.lastName || (devUser as any)?.lastName || currentUser?.lastName || '';
    const displayName = profile?.displayName || (devUser as any)?.displayName || (firstName ? `${firstName} ${lastName}`.trim() : 'Member');
    const profileCompletionPercent = profile?.profileCompletionPercent ?? (devUser as any)?.profileCompletionPercent ?? (firstName ? 100 : 85);

    const email = currentUser?.email || '';

    // Query current roles from DB
    let dbUserRoles: any[] = [];
    try {
      dbUserRoles = await this.prisma.userRole.findMany({
        where: { userId },
        include: {
          role: {
            include: {
              rolePermissions: {
                include: { permission: true },
              },
            },
          },
        },
      });
    } catch {
      dbUserRoles = [];
    }

    let roles = dbUserRoles.map((ur: any) => ur.role?.name).filter(Boolean);
    if (roles.length === 0) {
      roles = currentUser?.roles || [];
    }
    if (roles.length === 0) {
      if (email === 'superadmin@s2smatrimony.com') roles = ['SUPER_ADMIN'];
      else if (email === 'admin@s2smatrimony.com') roles = ['ADMIN'];
      else roles = ['MEMBER'];
    }
    const mainRole = roles[0] || 'MEMBER';

    const permissionsSet = new Set<string>();
    let hasFoundRoles = false;
    if (dbUserRoles && dbUserRoles.length > 0) {
      hasFoundRoles = true;
      dbUserRoles.forEach((ur: any) => {
        ur.role?.rolePermissions?.forEach((rp: any) => {
          if (rp.permission?.name) permissionsSet.add(rp.permission.name);
        });
      });
    }

    if (!hasFoundRoles && roles.length > 0) {
      try {
        const dbRoles: any[] = await this.prisma.role.findMany({
          where: { name: { in: roles } },
          include: { rolePermissions: { include: { permission: true } } },
        });
        if (dbRoles && dbRoles.length > 0) {
          hasFoundRoles = true;
          dbRoles.forEach((r: any) => {
            r.rolePermissions?.forEach((rp: any) => {
              if (rp.permission?.name) permissionsSet.add(rp.permission.name);
            });
          });
        }
      } catch {
        // Fallback
      }
    }

    // Only fallback if system has zero role_permissions in DB
    if (!hasFoundRoles) {
      const totalRolePerms = await this.prisma.rolePermission.count().catch(() => 0);
      if (totalRolePerms === 0) {
        roles.forEach((r) => {
          const perms = (ROLE_PERMISSIONS as any)[r] || [];
          perms.forEach((p: string) => permissionsSet.add(p));
        });
      }
    }

    if (roles.includes('SUPER_ADMIN') || mainRole === 'SUPER_ADMIN') {
      const superPerms = (ROLE_PERMISSIONS as any)['SUPER_ADMIN'] || [];
      superPerms.forEach((p: string) => permissionsSet.add(p));
    }

    const permissions = Array.from(permissionsSet);
    const entitlements = await this.entitlementsService.getUserEntitlements(userId);

    const payload = {
      sub: userId,
      email,
      phone: currentUser?.phone,
      role: mainRole,
      roles,
      permissions,
      membershipTier: entitlements.tier,
      membershipCategory: entitlements.category,
      isElite: entitlements.isElite,
    };
    const accessToken = this.jwtService.sign(payload);

    return {
      ...currentUser,
      role: mainRole,
      roles,
      permissions,
      accessToken,
      firstName,
      lastName,
      displayName,
      profileCompletionPercent,
      membershipTier: entitlements.tier,
      membershipStatus: entitlements.tier,
      membershipCategory: entitlements.category,
      isElite: entitlements.isElite,
      entitlements,
    };
  }

  async refreshTokens(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }

    try {
      const refreshSecret =
        this.configService.get<string>('JWT_REFRESH_SECRET') ||
        this.configService.get<string>('JWT_SECRET') ||
        'secret';
      const payload = this.jwtService.verify(refreshToken, {
        secret: refreshSecret,
      });
      const session = await this.prisma.session.findUnique({ where: { refreshToken } }).catch(() => null);
      if (!session || session.expiresAt < new Date()) {
        throw new UnauthorizedException('Refresh session expired');
      }

      return this.generateAuthResponse(payload.sub, payload.email, payload.phone, payload.roles || ['MEMBER'], payload.membershipTier || 'FREE');
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(refreshToken: string) {
    if (!refreshToken) return { success: true };

    await this.prisma.session.deleteMany({
      where: { refreshToken },
    }).catch(() => null);

    return { success: true };
  }

  private async getDemoAuthResponse(dto: LoginDto) {
    if (!this.allowDevAuth) return null;

    let role: string | null = null;
    let authRes: any = null;

    if (dto.email === 'superadmin@s2smatrimony.com' && dto.password === 'admin123') {
      role = 'SUPER_ADMIN';
      authRes = this.generateAuthResponse('super-admin-001', dto.email, '+919999999999', ['SUPER_ADMIN'], 'ELITE');
    } else if (dto.email === 'admin@s2smatrimony.com' && dto.password === 'admin123') {
      role = 'ADMIN';
      authRes = this.generateAuthResponse('admin-001', dto.email, '+918888888888', ['ADMIN'], 'GOLD');
    } else if (dto.email === 'kavitha@s2smatrimony.com' && dto.password === 'admin123') {
      role = 'MEMBER';
      authRes = this.generateAuthResponse('user-001', dto.email, '+919876543210', ['MEMBER'], 'FREE');
    } else if (dto.email === 'karthik@s2smatrimony.com' && (dto.password === 'admin123' || dto.password === 'Password@123')) {
      role = 'MEMBER';
      authRes = this.generateAuthResponse('user-male-001', dto.email, '+919876543211', ['MEMBER'], 'GOLD');
    }

    if (!authRes) return null;

    if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
      const isMaintenance = await checkIsMaintenanceModeActive(this.prisma);
      if (isMaintenance) {
        throw new ServiceUnavailableException({
          statusCode: 503,
          error: 'Service Unavailable',
          message: 'The platform is currently undergoing scheduled maintenance. Regular member login is temporarily unavailable.',
          maintenance: true,
        });
      }
    }

    return authRes;
  }
}
