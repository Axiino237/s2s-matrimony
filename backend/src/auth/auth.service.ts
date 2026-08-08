import { Injectable, BadRequestException, UnauthorizedException, ConflictException, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
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
import { devStore } from '../common/dev-store';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly otpService: OtpService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) { }

  private get isProduction() {
    return this.configService.get<string>('NODE_ENV') === 'production';
  }

  private get allowDevAuth() {
    return !this.isProduction && this.configService.get<string>('ALLOW_DEV_AUTH', 'true') === 'true';
  }

  async register(dto: RegisterDto) {
    try {
      const existingUser = await this.prisma.user.findFirst({
        where: {
          OR: [{ email: dto.email }, { phone: dto.phone }],
        },
      });

      if (existingUser) {
        throw new ConflictException('User with this email or phone already exists');
      }

      const hashedPassword = await bcrypt.hash(dto.password, 10);

      // Lookup or create community, religion & subCaste records by name
      let communityRow = dto.community
        ? await this.prisma.community.findFirst({ where: { name: { contains: dto.community, mode: 'insensitive' } } }).catch(() => null)
        : null;
      if (!communityRow && dto.community) {
        communityRow = await this.prisma.community.create({
          data: { name: dto.community, slug: dto.community.toLowerCase().replace(/[^a-z0-9]/g, '-') }
        }).catch(() => null);
      }

      let religionRow = dto.religion
        ? await this.prisma.religion.findFirst({ where: { name: { contains: dto.religion, mode: 'insensitive' } } }).catch(() => null)
        : null;
      if (!religionRow && dto.religion) {
        religionRow = await this.prisma.religion.create({
          data: { name: dto.religion }
        }).catch(() => null);
      }

      const subCasteRow = dto.subCaste
        ? await this.prisma.subCaste.findFirst({ where: { name: { contains: dto.subCaste, mode: 'insensitive' } } }).catch(() => null)
        : null;

      // Create user and full profile in transaction
      const user = await this.prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            email: dto.email,
            phone: dto.phone,
            passwordHash: hashedPassword,
            isPhoneVerified: false,
          },
        });

        // Calculate age from DOB
        const dob = dto.dateOfBirth ? new Date(dto.dateOfBirth) : new Date(2000, 0, 1);
        const age = new Date().getFullYear() - dob.getFullYear();

        // Validate marital status enum
        const validMarital = ['NEVER_MARRIED', 'DIVORCED', 'WIDOWED', 'SEPARATED'];
        const maritalStatus = dto.maritalStatus && validMarital.includes(dto.maritalStatus.toUpperCase())
          ? (dto.maritalStatus.toUpperCase() as any)
          : 'NEVER_MARRIED';

        // Calculate profile completion percent based on filled fields
        const filledFields = [
          dto.firstName, dto.lastName, dto.gender, dto.dateOfBirth,
          dto.maritalStatus, dto.motherTongue, dto.heightCm,
          dto.religion, dto.community, dto.about,
        ].filter(Boolean).length;
        const totalFields = 10; // these 10 fields from registration
        const profileCompletionPercent = Math.round((filledFields / totalFields) * 40); // max 40% from registration alone

        // Build the JSON snapshot of all registration data
        const registrationSnapshot = JSON.stringify({
          profileFor: dto.profileFor || 'SELF',
          gender: dto.gender,
          firstName: dto.firstName,
          lastName: dto.lastName,
          dateOfBirth: dto.dateOfBirth,
          maritalStatus: dto.maritalStatus,
          motherTongue: dto.motherTongue,
          heightCm: dto.heightCm,
          religion: dto.religion,
          community: dto.community,
          subCaste: dto.subCaste,
          about: dto.about,
          registeredAt: new Date().toISOString(),
        });

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

        // Assign MEMBER role
        const memberRole = await tx.role.findUnique({ where: { name: 'MEMBER' } });
        if (memberRole) {
          await tx.userRole.create({
            data: { userId: newUser.id, roleId: memberRole.id },
          });
        }

        // Log registration snapshot to audit (full JSON of what was collected)
        await tx.auditLog.create({
          data: {
            userId: newUser.id,
            action: 'USER_REGISTERED',
            entity: 'User',
            entityId: newUser.id,
            newValue: JSON.parse(registrationSnapshot),
          },
        }).catch(() => null);

        return newUser;
      });

      try {
        await this.otpService.sendOtp(user.phone);
      } catch {
        // Ignore background OTP dispatch error if phone invalid or test mode
      }

      return this.generateAuthResponse(user.id, user.email, user.phone, [Role.MEMBER], 'FREE');
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
      user = await this.prisma.user.findUnique({
        where: { email: dto.email },
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

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastActive: new Date() },
    });

    return this.generateAuthResponse(user.id, user.email, user.phone, roles, membershipTier);
  }

  async verifyOtpAndLogin(dto: VerifyOtpDto) {
    await this.otpService.verifyOtp(dto.phone, dto.otp);

    try {
      let user = await this.prisma.user.findUnique({
        where: { phone: dto.phone },
        include: { userRoles: { include: { role: true } } },
      });

      if (!user) {
        // Auto-register via OTP with profile
        user = await this.prisma.user.create({
          data: {
            phone: dto.phone,
            email: `${dto.phone.replace(/\D/g, '')}@temp.s2s.com`,
            isPhoneVerified: true,
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
          include: { userRoles: { include: { role: true } } },
        });
      } else if (!user.isPhoneVerified) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { isPhoneVerified: true },
        });
      }

      const roles = user.userRoles?.length > 0 ? user.userRoles.map((ur) => ur.role.name) : [Role.MEMBER];
      return this.generateAuthResponse(user.id, user.email, user.phone, roles, 'FREE');
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
    try {
      const user = await this.prisma.user.findUnique({ where: { email } });
      // Always return success (don't reveal if email exists)
      if (!user) return { success: true, message: 'If that email is registered, an OTP has been sent.' };

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

      // Upsert — one OTP per email at a time
      await this.prisma.passwordResetToken.upsert({
        where: { email },
        update: { token: otp, expiresAt, used: false },
        create: { email, token: otp, expiresAt },
      });

      // Get profile name for personalised email
      const profile = await this.prisma.profile.findFirst({ where: { userId: user.id } });
      await this.mailService.sendForgotPasswordOtp(email, otp, profile?.firstName);

      return { success: true, message: 'If that email is registered, an OTP has been sent.' };
    } catch {
      if (!this.allowDevAuth) {
        throw new ServiceUnavailableException('Password reset is temporarily unavailable');
      }

      // In dev mode with DB offline, simulate success
      return { success: true, message: 'If that email is registered, an OTP has been sent (Dev OTP: 123456).' };
    }
  }

  /** Step 2: User enters OTP — validates it, returns a short-lived resetToken */
  async verifyForgotOtp(email: string, otp: string) {
    const record = await this.prisma.passwordResetToken.findUnique({ where: { email } });

    if (!record || record.token !== otp)
      throw new BadRequestException('Invalid OTP. Please check and try again.');
    if (record.used)
      throw new BadRequestException('This OTP has already been used. Please request a new one.');
    if (record.expiresAt < new Date())
      throw new BadRequestException('OTP has expired. Please request a new one.');

    // Replace OTP with a secure uuid reset-token for the final step
    const resetToken = randomUUID();
    const resetExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min to set password

    await this.prisma.passwordResetToken.update({
      where: { email },
      data: { token: resetToken, expiresAt: resetExpiresAt },
    });

    return { success: true, resetToken };
  }

  /** Step 3: User enters new password with the resetToken from step 2 */
  async resetPassword(resetToken: string, newPassword: string) {
    const record = await this.prisma.passwordResetToken.findUnique({ where: { token: resetToken } });

    if (!record) throw new BadRequestException('Invalid or expired session. Please start over.');
    if (record.used) throw new BadRequestException('This session has already been used.');
    if (record.expiresAt < new Date()) throw new BadRequestException('Session expired. Please request a new OTP.');

    const user = await this.prisma.user.findUnique({ where: { email: record.email } });
    if (!user) throw new NotFoundException('User not found.');

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
      this.prisma.passwordResetToken.update({ where: { token: resetToken }, data: { used: true } }),
    ]);

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

      dbUserRoles.forEach((ur) => {
        ur.role?.rolePermissions?.forEach((rp) => {
          if (rp.permission?.name) {
            permissionsSet.add(rp.permission.name);
          }
        });
      });
    } catch {
      // Fallback
    }

    if (permissionsSet.size === 0) {
      roles.forEach((r) => {
        const perms = ROLE_PERMISSIONS[r as Role] || [];
        perms.forEach((p) => permissionsSet.add(p));
      });
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

    const payload = {
      sub: userId,
      email,
      phone,
      role: mainRole,
      roles,
      permissions,
      membershipTier,
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
        membershipTier,
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
    let roles = currentUser?.roles;
    if (!Array.isArray(roles) || roles.length === 0) {
      if (email === 'superadmin@s2smatrimony.com') roles = ['SUPER_ADMIN'];
      else if (email === 'admin@s2smatrimony.com') roles = ['ADMIN'];
      else roles = ['MEMBER'];
    }
    const mainRole = roles[0] || 'MEMBER';

    return {
      ...currentUser,
      role: mainRole,
      roles,
      firstName,
      lastName,
      displayName,
      profileCompletionPercent,
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

    if (dto.email === 'superadmin@s2smatrimony.com' && dto.password === 'admin123') {
      return this.generateAuthResponse('super-admin-001', dto.email, '+919999999999', ['SUPER_ADMIN'], 'ELITE');
    }
    if (dto.email === 'admin@s2smatrimony.com' && dto.password === 'admin123') {
      return this.generateAuthResponse('admin-001', dto.email, '+918888888888', ['ADMIN'], 'GOLD');
    }
    if (dto.email === 'kavitha@s2smatrimony.com' && dto.password === 'admin123') {
      return this.generateAuthResponse('user-001', dto.email, '+919876543210', ['MEMBER'], 'FREE');
    }
    if (dto.email === 'karthik@s2smatrimony.com' && (dto.password === 'admin123' || dto.password === 'Password@123')) {
      return this.generateAuthResponse('user-male-001', dto.email, '+919876543211', ['MEMBER'], 'GOLD');
    }

    return null;
  }
}
