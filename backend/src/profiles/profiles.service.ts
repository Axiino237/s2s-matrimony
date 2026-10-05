import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Gender, MaritalStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';
import { devStore, devOtpStore } from '../common/dev-store';
import { OtpService } from '../auth/otp.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class ProfilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly otpService: OtpService,
    private readonly mailService: MailService,
  ) {}

  async getProfileByUserId(userId: string) {
    try {
      let profile: any = await this.prisma.profile.findUnique({
        where: { userId },
        include: {
          user: true,
          religion: true,
          community: true,
          caste: true,
          subCaste: true,
          photos: true,
          education: true,
          occupation: true,
          family: true,
          horoscope: true,
          country: true,
          state: true,
          city: true,
          partnerPreference: true,
          privacySetting: true,
          membership: { include: { plan: true } },
        },
      });

      if (!profile) {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          include: { userRoles: { include: { role: true } } },
        });
        if (!user) throw new NotFoundException('User not found');

        const roles = user.userRoles?.map((ur) => ur.role.name) || [];
        const isOnlyAdmin = (roles.includes('SUPER_ADMIN') || roles.includes('ADMIN')) && !roles.includes('MEMBER');

        if (isOnlyAdmin) {
          throw new NotFoundException('Admin accounts do not have a matrimony profile.');
        }

        profile = await this.prisma.profile.create({
          data: {
            userId: user.id,
            firstName: '',
            lastName: '',
            displayName: '',
            gender: 'MALE',
            dateOfBirth: new Date(2000, 0, 1),
            age: 26,
          },
          include: {
            user: true,
            religion: true,
            community: true,
            caste: true,
            subCaste: true,
            photos: true,
            education: true,
            occupation: true,
            family: true,
            horoscope: true,
            country: true,
            state: true,
            city: true,
            partnerPreference: true,
            privacySetting: true,
            membership: { include: { plan: true } },
          },
        });
      }

      if (!profile) {
        throw new NotFoundException('Profile could not be found or created');
      }

      const devUser: any = devStore.get(userId) || {};

      const star = profile.horoscope?.star || (profile as any).star || devUser.star || '';
      const rasi = profile.horoscope?.rasi || (profile as any).rasi || devUser.rasi || '';
      const lagnam = profile.horoscope?.lagnam || (profile as any).lagnam || devUser.lagnam || '';
      const gothram = profile.gothram || profile.horoscope?.gothram || (profile as any).gothram || devUser.gothram || '';
      const dosham = profile.horoscope?.dosham || (profile as any).dosham || devUser.dosham || '';

      const religionName =
        (typeof profile.religion === 'object' ? profile.religion?.name : (profile as any).religion) ||
        devUser.religion ||
        'Hindu';
      const communityName =
        (typeof profile.community === 'object' ? profile.community?.name : null) ||
        (typeof profile.caste === 'object' ? profile.caste?.name : null) ||
        (profile as any).community ||
        (profile as any).caste ||
        devUser.community ||
        devUser.caste ||
        '';
      const subCasteName =
        (typeof profile.subCaste === 'object' ? profile.subCaste?.name : null) ||
        (profile as any).subCaste ||
        (profile as any).subcaste ||
        devUser.subCaste ||
        devUser.subcaste ||
        '';

      const educationDegree = profile.education?.degree || (profile as any).educationDegree || devUser.educationDegree || devUser.education || '';
      const college = profile.education?.college || (profile as any).college || devUser.college || '';
      const educationDetail = profile.education?.fieldOfStudy || (profile as any).educationDetail || devUser.educationDetail || '';

      const occupation = profile.occupation?.designation || (profile as any).occupation || devUser.occupation || '';
      const company = profile.occupation?.company || (profile as any).company || devUser.company || '';
      const annualIncome = profile.occupation?.salaryMin ? String(profile.occupation.salaryMin) : (profile as any).annualIncome || devUser.annualIncome || '';
      const workLocation = profile.occupation?.workingLocation || (profile as any).workLocation || devUser.workLocation || '';

      const fatherName = profile.family?.fatherName || (profile as any).fatherName || devUser.fatherName || '';
      const fatherOccupation = profile.family?.fatherOccupation || (profile as any).fatherOccupation || devUser.fatherOccupation || '';
      const motherName = profile.family?.motherName || (profile as any).motherName || devUser.motherName || '';
      const motherOccupation = profile.family?.motherOccupation || (profile as any).motherOccupation || devUser.motherOccupation || '';

      const cityName = (typeof profile.city === 'object' ? profile.city?.name : profile.city) || (devUser as any)?.city || (devUser as any)?.place || '';
      const stateName = (typeof profile.state === 'object' ? profile.state?.name : profile.state) || (devUser as any)?.state || 'Tamil Nadu';
      const countryName = (typeof profile.country === 'object' ? profile.country?.name : profile.country) || (devUser as any)?.country || 'India';
      const nativePlace = profile.family?.nativePlace || (devUser as any)?.nativePlace || '';
      const birthPlace = profile.horoscope?.birthPlace || devUser.birthPlace || (devUser.horoscopeData as any)?.birthPlace || '';
      const place = cityName || workLocation || nativePlace || birthPlace || '';

      return {
        ...profile,
        religion: religionName,
        community: communityName,
        caste: communityName,
        subCaste: subCasteName,
        star,
        rasi,
        lagnam,
        gothram,
        dosham,
        educationDegree,
        college,
        educationDetail,
        company,
        annualIncome,
        workLocation,
        fatherName,
        fatherOccupation,
        motherName,
        motherOccupation,
        rasiChart: (profile as any).rasiChart || (profile.horoscope?.horoscopeData as any)?.rasiChart || devUser.rasiChart || devUser.horoscopeData?.rasiChart || {},
        amsamChart: (profile as any).amsamChart || (profile.horoscope?.horoscopeData as any)?.amsamChart || (profile.horoscope?.horoscopeData as any)?.navamsamChart || devUser.amsamChart || devUser.horoscopeData?.amsamChart || {},
        horoscope: {
          star,
          rasi,
          lagnam,
          gothram,
          dosham,
          kuladeivam: profile.horoscope?.kuladeivam || devUser.kuladeivam || '',
          dasaBalance: profile.horoscope?.dasaBalance || devUser.dasaBalance || '',
          starPadam: profile.horoscope?.starPadam || devUser.starPadam || null,
          birthTime: profile.horoscope?.birthTime || devUser.birthTime || devUser.timeOfBirth || '',
          birthPlace: profile.horoscope?.birthPlace || devUser.birthPlace || devUser.placeOfBirth || '',
          rasiChart: (profile as any).rasiChart || (profile.horoscope?.horoscopeData as any)?.rasiChart || devUser.rasiChart || devUser.horoscopeData?.rasiChart || {},
          amsamChart: (profile as any).amsamChart || (profile.horoscope?.horoscopeData as any)?.amsamChart || (profile.horoscope?.horoscopeData as any)?.navamsamChart || devUser.amsamChart || devUser.horoscopeData?.amsamChart || {},
          horoscopeData: {
            ...((profile.horoscope?.horoscopeData as any) || {}),
            ...(devUser.horoscopeData || {}),
            rasiChart: (profile as any).rasiChart || (profile.horoscope?.horoscopeData as any)?.rasiChart || devUser.rasiChart || devUser.horoscopeData?.rasiChart || {},
            amsamChart: (profile as any).amsamChart || (profile.horoscope?.horoscopeData as any)?.amsamChart || (profile.horoscope?.horoscopeData as any)?.navamsamChart || devUser.amsamChart || devUser.horoscopeData?.amsamChart || {},
          },
        },
        education: {
          degree: educationDegree,
          college,
          fieldOfStudy: educationDetail,
        },
        occupation: {
          designation: occupation,
          company,
          workingLocation: workLocation,
          annualIncome,
        },
        family: {
          fatherName,
          fatherOccupation,
          motherName,
          motherOccupation,
          nativePlace: profile.family?.nativePlace || devUser.nativePlace || '',
          brothers: Math.max(0, Number(profile.family?.brothers ?? devUser.brothers ?? 0)),
          sisters: Math.max(0, Number(profile.family?.sisters ?? devUser.sisters ?? 0)),
          elderBrothers: Math.max(0, Number(profile.family?.elderBrothers ?? devUser.elderBrothers ?? 0)),
          elderBrothersMarried: Math.max(0, Number(profile.family?.elderBrothersMarried ?? devUser.elderBrothersMarried ?? 0)),
          youngerBrothers: Math.max(0, Number(profile.family?.youngerBrothers ?? devUser.youngerBrothers ?? 0)),
          youngerBrothersMarried: Math.max(0, Number(profile.family?.youngerBrothersMarried ?? devUser.youngerBrothersMarried ?? 0)),
          elderSisters: Math.max(0, Number(profile.family?.elderSisters ?? devUser.elderSisters ?? 0)),
          elderSistersMarried: Math.max(0, Number(profile.family?.elderSistersMarried ?? devUser.elderSistersMarried ?? 0)),
          youngerSisters: Math.max(0, Number(profile.family?.youngerSisters ?? devUser.youngerSisters ?? 0)),
          youngerSistersMarried: Math.max(0, Number(profile.family?.youngerSistersMarried ?? devUser.youngerSistersMarried ?? 0)),
          familyType: profile.family?.familyType || devUser.familyType || 'NUCLEAR',
          familyStatus: profile.family?.familyStatus || devUser.familyStatus || 'MIDDLE',
          familyValues: profile.family?.familyValues || devUser.familyValues || 'MODERATE',
        },
        membershipTier: (profile.membership && profile.membership.isActive && new Date(profile.membership.endDate) >= new Date())
          ? profile.membership.tier
          : (devUser?.membershipTier && devUser.membershipTier !== 'FREE' ? devUser.membershipTier : 'FREE'),
        membershipStatus: (profile.membership && profile.membership.isActive && new Date(profile.membership.endDate) >= new Date())
          ? profile.membership.tier
          : (devUser?.membershipTier && devUser.membershipTier !== 'FREE' ? devUser.membershipTier : 'FREE'),
        isPremium: Boolean(
          (profile.membership && profile.membership.isActive && profile.membership.tier !== 'FREE' && new Date(profile.membership.endDate) >= new Date()) ||
          (devUser?.membershipTier && devUser.membershipTier !== 'FREE')
        ),
        membership: profile.membership || null,
        city: cityName || place || 'Chennai',
        state: stateName || 'Tamil Nadu',
        country: countryName || 'India',
        nativePlace: nativePlace || birthPlace || '',
        place: place || cityName || nativePlace || birthPlace || 'Chennai',
        partnerPreference: profile.partnerPreference ? {
          ...profile.partnerPreference,
          maritalStatus: (profile.partnerPreference.maritalStatus && profile.partnerPreference.maritalStatus.length > 0)
            ? profile.partnerPreference.maritalStatus
            : (devUser?.prefMaritalStatus ? [devUser.prefMaritalStatus] : []),
        } : (devUser?.prefMaritalStatus || devUser?.prefGender ? {
          gender: devUser?.prefGender,
          ageMin: devUser?.prefAgeMin,
          ageMax: devUser?.prefAgeMax,
          heightMin: devUser?.prefHeightMin,
          heightMax: devUser?.prefHeightMax,
          maritalStatus: devUser?.prefMaritalStatus ? [devUser.prefMaritalStatus] : [],
          aboutPartner: typeof devUser?.aboutPartner === 'string' ? devUser.aboutPartner : JSON.stringify({
            religion: devUser?.prefReligion || '',
            community: devUser?.prefCommunity || '',
            education: devUser?.prefEducation || '',
            location: devUser?.prefLocation || '',
            maritalStatus: devUser?.prefMaritalStatus || '',
          }),
        } : null),
        prefMaritalStatus: devUser?.prefMaritalStatus || profile.partnerPreference?.maritalStatus?.[0] || '',
      };
    } catch (err: any) {
      if (err instanceof NotFoundException) throw err;

      console.warn('Database error in getProfileByUserId (returning dev fallback profile):', err?.message || err);
      const devUser = devStore.get(userId);

      const firstName = devUser?.firstName || '';
      const lastName = devUser?.lastName || '';
      const displayName = `${firstName} ${lastName}`.trim() || 'Member';
      const gender = devUser?.gender || 'FEMALE';
      const dob = devUser?.dateOfBirth ? new Date(devUser.dateOfBirth) : new Date(2000, 0, 1);
      const age = devUser?.age || (new Date().getFullYear() - dob.getFullYear());

      return {
        id: `prof-${userId}`,
        userId,
        firstName,
        lastName,
        displayName,
        gender,
        dateOfBirth: dob,
        age,
        motherTongue: devUser?.motherTongue || 'Tamil',
        maritalStatus: devUser?.maritalStatus || 'NEVER_MARRIED',
        about: devUser?.about || '',
        heightCm: devUser?.heightCm || 168,
        weight: devUser?.weight || 65,
        gothram: devUser?.gothram || '',
        religion: devUser?.religion ? { name: devUser.religion } : undefined,
        community: devUser?.community ? { name: devUser.community } : undefined,
        subCaste: devUser?.subCaste ? { name: devUser.subCaste } : undefined,
        horoscope: {
          star: devUser?.star || '',
          rasi: devUser?.rasi || '',
          lagnam: devUser?.lagnam || '',
          gothram: devUser?.gothram || '',
          dosham: devUser?.dosham || '',
          birthTime: devUser?.timeOfBirth || devUser?.birthTime || '',
          birthPlace: devUser?.placeOfBirth || devUser?.birthPlace || '',
          rasiChart: devUser?.rasiChart || devUser?.horoscopeData?.rasiChart || {},
          amsamChart: devUser?.amsamChart || devUser?.horoscopeData?.amsamChart || {},
          horoscopeData: devUser?.horoscopeData || {
            rasiChart: devUser?.rasiChart || {},
            amsamChart: devUser?.amsamChart || {},
          },
        },
        rasiChart: devUser?.rasiChart || devUser?.horoscopeData?.rasiChart || {},
        amsamChart: devUser?.amsamChart || devUser?.horoscopeData?.amsamChart || {},
        education: {
          degree: devUser?.educationDegree || devUser?.education || '',
          college: devUser?.college || devUser?.educationDetail || '',
        },
        occupation: {
          designation: devUser?.occupation || '',
          company: devUser?.company || devUser?.companyName || '',
          workingLocation: devUser?.workLocation || '',
          annualIncome: devUser?.annualIncome || '',
          salaryMin: devUser?.annualIncome ? Number(devUser.annualIncome) : undefined,
        },
        family: {
          fatherName: devUser?.fatherName || '',
          fatherOccupation: devUser?.fatherOccupation || '',
          motherName: devUser?.motherName || '',
          motherOccupation: devUser?.motherOccupation || '',
          brothers: Math.max(0, Number(devUser?.brothers ?? 0)),
          sisters: Math.max(0, Number(devUser?.sisters ?? 0)),
          elderBrothers: Math.max(0, Number(devUser?.elderBrothers ?? 0)),
          elderBrothersMarried: Math.max(0, Number(devUser?.elderBrothersMarried ?? 0)),
          youngerBrothers: Math.max(0, Number(devUser?.youngerBrothers ?? 0)),
          youngerBrothersMarried: Math.max(0, Number(devUser?.youngerBrothersMarried ?? 0)),
          elderSisters: Math.max(0, Number(devUser?.elderSisters ?? 0)),
          elderSistersMarried: Math.max(0, Number(devUser?.elderSistersMarried ?? 0)),
          youngerSisters: Math.max(0, Number(devUser?.youngerSisters ?? 0)),
          youngerSistersMarried: Math.max(0, Number(devUser?.youngerSistersMarried ?? 0)),
          familyType: devUser?.familyType || 'NUCLEAR',
          familyStatus: devUser?.familyStatus || 'MIDDLE',
          familyValues: devUser?.familyValues || 'MODERATE',
        },
        partnerPreference: {
          gender: devUser?.prefGender,
          ageMin: devUser?.prefAgeMin,
          ageMax: devUser?.prefAgeMax,
          heightMin: devUser?.prefHeightMin,
          heightMax: devUser?.prefHeightMax,
          maritalStatus: devUser?.prefMaritalStatus ? [devUser.prefMaritalStatus] : [],
          aboutPartner: typeof devUser?.aboutPartner === 'string' ? devUser.aboutPartner : JSON.stringify({
            religion: devUser?.prefReligion || '',
            community: devUser?.prefCommunity || '',
            education: devUser?.prefEducation || '',
            location: devUser?.prefLocation || '',
            maritalStatus: devUser?.prefMaritalStatus || '',
          }),
        },
        prefMaritalStatus: devUser?.prefMaritalStatus || '',
        profileCompletionPercent: (devUser as any)?.profileCompletionPercent ?? (firstName ? 100 : 85),
        isVerified: true,
        membershipTier: (devUser as any)?.membershipTier || 'FREE',
        membershipStatus: (devUser as any)?.membershipTier || 'FREE',
        isPremium: Boolean((devUser as any)?.membershipTier && (devUser as any)?.membershipTier !== 'FREE'),
        user: {
          id: userId,
          email: devUser?.email || '',
          phone: devUser?.phone || '',
        },
        photos: Array.isArray((devUser as any)?.photos)
          ? (devUser as any).photos.filter((p: any) => p?.url && !p.url.includes('bride.jpg') && !p.url.includes('bride.png') && !p.url.includes('groom.png'))
          : [],
      };
    }
  }

  async getProfileById(id: string, requesterUserId?: string, isStaff = false) {
    const profile = await this.prisma.profile.findUnique({
      where: { id },
      include: {
        user: true,
        religion: true,
        community: true,
        caste: true,
        subCaste: true,
        photos: { where: { status: 'APPROVED' } },
        education: true,
        occupation: true,
        family: true,
        horoscope: true,
        country: true,
        state: true,
        city: true,
        partnerPreference: true,
      },
    }).catch(() => null);

    if (!profile) throw new NotFoundException('Profile not found');

    const isOwner = requesterUserId && (profile.userId === requesterUserId || profile.id === requesterUserId);
    if (!isOwner && !isStaff) {
      const isAccountActive = profile.user?.isActive === true && !profile.user?.deletedAt;
      const isProfileVerified = profile.isVerified === true && profile.verificationStatus === 'VERIFIED' && profile.status === 'ACTIVE' && !profile.deletedAt;

      if (!isAccountActive || !isProfileVerified) {
        throw new NotFoundException('Profile is not available');
      }
    }

    const hData = (profile.horoscope?.horoscopeData as any) || {};
    const rasiChart = (profile as any).rasiChart || hData.rasiChart || {};
    const amsamChart = (profile as any).amsamChart || hData.amsamChart || hData.navamsamChart || {};

    const cityName = (typeof profile.city === 'object' ? profile.city?.name : profile.city) || '';
    const stateName = (typeof profile.state === 'object' ? profile.state?.name : profile.state) || 'Tamil Nadu';
    const countryName = (typeof profile.country === 'object' ? profile.country?.name : profile.country) || 'India';
    const nativePlace = profile.family?.nativePlace || '';
    const workLocation = profile.occupation?.workingLocation || '';
    const birthPlace = profile.horoscope?.birthPlace || (hData as any)?.birthPlace || '';
    const place = cityName || workLocation || nativePlace || birthPlace || '';

    return {
      ...profile,
      city: cityName || place || 'Chennai',
      state: stateName || 'Tamil Nadu',
      country: countryName || 'India',
      nativePlace: nativePlace || birthPlace || '',
      place: place || cityName || nativePlace || birthPlace || 'Chennai',
      workLocation: workLocation || '',
      rasiChart,
      amsamChart,
      horoscope: profile.horoscope
        ? {
            ...profile.horoscope,
            rasiChart,
            amsamChart,
            horoscopeData: {
              ...hData,
              rasiChart,
              amsamChart,
            },
          }
        : profile.horoscope,
    };
  }

  async updateProfile(userId: string, data: any) {
    try {
      let existing: any = await this.prisma.profile.findUnique({ where: { userId }, include: { horoscope: true } }).catch(() => null);

      const fieldsToCheck = [
        data.firstName || existing?.firstName,
        data.lastName || existing?.lastName,
        data.gender || existing?.gender,
        data.dateOfBirth || existing?.dateOfBirth,
        data.maritalStatus || existing?.maritalStatus,
        data.motherTongue || existing?.motherTongue,
        data.religion || existing?.religionId,
        data.community || existing?.communityId,
        data.about || existing?.about,
        data.heightCm || existing?.heightCm,
        data.educationDegree || data.education,
        data.occupation,
        data.annualIncome,
        data.fatherName,
        data.star,
        data.rasi,
      ];
      const filledCount = fieldsToCheck.filter((f) => Boolean(f && String(f).trim().length > 0)).length;
      const calcPercent = Math.max(30, Math.min(100, Math.round((filledCount / fieldsToCheck.length) * 100)));

      const updateData: any = {
        profileCompletionPercent: calcPercent,
      };

      if (data.firstName) updateData.firstName = data.firstName;
      if (data.lastName !== undefined) updateData.lastName = data.lastName;
      if (data.firstName || data.lastName) {
        updateData.displayName = `${data.firstName || existing?.firstName || ''} ${data.lastName || existing?.lastName || ''}`.trim();
      }
      if (data.gender && ['MALE', 'FEMALE'].includes(data.gender)) {
        updateData.gender = data.gender;
      }
      if (data.maritalStatus && ['NEVER_MARRIED', 'DIVORCED', 'WIDOWED', 'SEPARATED'].includes(data.maritalStatus)) {
        updateData.maritalStatus = data.maritalStatus;
      }
      if (data.motherTongue) updateData.motherTongue = data.motherTongue;
      if (data.about !== undefined && data.about !== null) updateData.about = data.about;
      if (data.aboutMe) updateData.about = data.aboutMe;
      if (data.heightCm && !isNaN(Number(data.heightCm))) updateData.heightCm = Number(data.heightCm);
      if (data.weight && !isNaN(Number(data.weight))) updateData.weight = Number(data.weight);
      if (data.weightKg && !isNaN(Number(data.weightKg))) updateData.weight = Number(data.weightKg);
      if (data.complexion) updateData.complexion = data.complexion;
      if (data.diet) updateData.diet = data.diet;
      if (data.religion !== undefined) {
        const relName = (data.religion || '').trim();
        if (relName) {
          let r = await this.prisma.religion.findFirst({
            where: { name: { equals: relName, mode: 'insensitive' } },
          }).catch(() => null);
          if (!r && !['other', 'general', 'any', 'none'].includes(relName.toLowerCase()) && relName.length > 3) {
            r = await this.prisma.religion.findFirst({
              where: { name: { contains: relName, mode: 'insensitive' } },
            }).catch(() => null);
          }
          if (!r) {
            r = await this.prisma.religion.create({
              data: { name: relName },
            }).catch(() => null);
          }
          if (r) updateData.religionId = r.id;
        } else {
          updateData.religionId = null;
        }
      }

      if (data.community !== undefined || data.caste !== undefined) {
        const commName = (data.community || data.caste || '').trim();
        if (commName) {
          // Priority 1: Exact match on name (case-insensitive)
          let c = await this.prisma.community.findFirst({
            where: { name: { equals: commName, mode: 'insensitive' } },
          }).catch(() => null);

          // Priority 2: Exact match on slug
          if (!c) {
            const commSlug = commName.toLowerCase().replace(/[^a-z0-9]/g, '-');
            c = await this.prisma.community.findFirst({
              where: { slug: commSlug },
            }).catch(() => null);
          }

          // Priority 3: Fuzzy contains ONLY if NOT a generic keyword (e.g. 'other', 'general')
          if (!c && !['other', 'general', 'any', 'none'].includes(commName.toLowerCase()) && commName.length > 3) {
            c = await this.prisma.community.findFirst({
              where: { name: { contains: commName, mode: 'insensitive' } },
            }).catch(() => null);
          }

          // Priority 4: Create new community if not found
          if (!c) {
            const baseSlug = commName.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'other';
            const existingSlug = await this.prisma.community.findUnique({ where: { slug: baseSlug } }).catch(() => null);
            const slug = existingSlug ? `${baseSlug}-${Date.now().toString(36)}` : baseSlug;
            c = await this.prisma.community.create({
              data: { name: commName, slug },
            }).catch(() => null);
          }
          if (c) updateData.communityId = c.id;

          // Also synchronize caste relation
          let casteRow = await this.prisma.caste.findFirst({
            where: { name: { equals: commName, mode: 'insensitive' } },
          }).catch(() => null);
          if (!casteRow && !['other', 'general', 'any', 'none'].includes(commName.toLowerCase()) && commName.length > 3) {
            casteRow = await this.prisma.caste.findFirst({
              where: { name: { contains: commName, mode: 'insensitive' } },
            }).catch(() => null);
          }
          if (!casteRow) {
            casteRow = await this.prisma.caste.create({
              data: { name: commName, communityId: c?.id },
            }).catch(() => null);
          }
          if (casteRow) updateData.casteId = casteRow.id;
        } else {
          updateData.communityId = null;
          updateData.casteId = null;
        }
      }

      if (data.subCaste !== undefined || data.subcaste !== undefined) {
        const subName = (data.subCaste || data.subcaste || '').trim();
        if (subName) {
          // Priority 1: Exact match on name
          let sc = await this.prisma.subCaste.findFirst({
            where: { name: { equals: subName, mode: 'insensitive' } },
          }).catch(() => null);

          // Priority 2: Under current caste
          if (!sc && updateData.casteId) {
            sc = await this.prisma.subCaste.findFirst({
              where: {
                casteId: updateData.casteId,
                name: { contains: subName, mode: 'insensitive' },
              },
            }).catch(() => null);
          }

          // Priority 3: Fuzzy contains ONLY if NOT generic keyword
          if (!sc && !['other', 'general', 'any', 'none'].includes(subName.toLowerCase()) && subName.length > 3) {
            sc = await this.prisma.subCaste.findFirst({
              where: { name: { contains: subName, mode: 'insensitive' } },
            }).catch(() => null);
          }

          // Priority 4: Create new subcaste
          if (!sc) {
            let targetCasteId = updateData.casteId;
            if (!targetCasteId) {
              const anyCaste = await this.prisma.caste.findFirst().catch(() => null);
              targetCasteId = anyCaste?.id;
            }
            if (targetCasteId) {
              sc = await this.prisma.subCaste.create({
                data: { name: subName, casteId: targetCasteId },
              }).catch(() => null);
            }
          }
          if (sc) updateData.subCasteId = sc.id;
        } else {
          updateData.subCasteId = null;
        }
      }

      if (data.birthOrder !== undefined && data.birthOrder !== null && data.birthOrder !== '') {
        updateData.birthOrder = Number(data.birthOrder);
      }
      if (data.residentStatus !== undefined) updateData.residentStatus = data.residentStatus;
      if (data.propertyDetails !== undefined) updateData.propertyDetails = data.propertyDetails;
      if (data.branch !== undefined) updateData.branch = data.branch;
      if (data.memberId !== undefined) updateData.memberId = data.memberId;

      if (data.country !== undefined || data.countryName !== undefined) {
        const cName = (data.country || data.countryName || '').trim();
        if (cName) {
          let c = await this.prisma.country.findFirst({
            where: { name: { equals: cName, mode: 'insensitive' } },
          }).catch(() => null);
          if (!c) {
            c = await this.prisma.country.create({
              data: { name: cName, code: cName.slice(0, 3).toUpperCase() },
            }).catch(() => null);
          }
          if (c) updateData.countryId = c.id;
        }
      }

      if (data.state !== undefined || data.stateName !== undefined) {
        const sName = (data.state || data.stateName || '').trim();
        if (sName) {
          let s = await this.prisma.state.findFirst({
            where: { name: { equals: sName, mode: 'insensitive' } },
          }).catch(() => null);
          if (!s) {
            let targetCountryId = updateData.countryId || existing?.countryId;
            if (!targetCountryId) {
              const anyCountry = await this.prisma.country.findFirst().catch(() => null);
              targetCountryId = anyCountry?.id;
            }
            if (targetCountryId) {
              s = await this.prisma.state.create({
                data: { name: sName, countryId: targetCountryId },
              }).catch(() => null);
            }
          }
          if (s) updateData.stateId = s.id;
        }
      }

      if (data.city !== undefined || data.cityName !== undefined || data.place !== undefined) {
        const cityName = (data.city || data.cityName || data.place || '').trim();
        if (cityName) {
          let ct = await this.prisma.city.findFirst({
            where: { name: { equals: cityName, mode: 'insensitive' } },
          }).catch(() => null);
          if (!ct) {
            let targetStateId = updateData.stateId || existing?.stateId;
            if (!targetStateId) {
              const anyState = await this.prisma.state.findFirst().catch(() => null);
              targetStateId = anyState?.id;
            }
            if (targetStateId) {
              ct = await this.prisma.city.create({
                data: { name: cityName, stateId: targetStateId },
              }).catch(() => null);
            }
          }
          if (ct) updateData.cityId = ct.id;
        }
      }

      let profileId = existing?.id;

      if (existing) {
        await this.prisma.profile.update({
          where: { userId },
          data: updateData,
        }).catch(() => null);
      } else {
        const created = await this.prisma.profile.create({
          data: {
            userId,
            firstName: data.firstName || 'Member',
            lastName: data.lastName || '',
            displayName: `${data.firstName || 'Member'} ${data.lastName || ''}`.trim(),
            gender: data.gender || 'FEMALE',
            dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : new Date(2000, 0, 1),
            maritalStatus: data.maritalStatus || 'NEVER_MARRIED',
            motherTongue: data.motherTongue || 'Tamil',
            profileCompletionPercent: 100,
            ...updateData,
          },
        }).catch(() => null);
        profileId = created?.id;
      }

      if (profileId) {
        // Upsert Horoscope relation (storing both individual columns and full JSON snapshot)
        if (data.star || data.starPadam || data.rasi || data.lagnam || data.gothram || data.kuladeivam || data.dosham || data.dasaBalance || data.timeOfBirth || data.birthTime || data.placeOfBirth || data.birthPlace || data.horoscopeData || data.rasiChart || data.amsamChart) {
          const existingHoroscope = (existing as any)?.horoscope;
          const prevHData = (existingHoroscope?.horoscopeData as any) || {};
          const incomingHData = typeof data.horoscopeData === 'object' && data.horoscopeData !== null ? data.horoscopeData : {};

          const finalRasiChart = data.rasiChart !== undefined
            ? data.rasiChart
            : incomingHData.rasiChart !== undefined
              ? incomingHData.rasiChart
              : prevHData.rasiChart || {};

          const finalAmsamChart = data.amsamChart !== undefined
            ? data.amsamChart
            : (incomingHData.amsamChart || incomingHData.navamsamChart) !== undefined
              ? (incomingHData.amsamChart || incomingHData.navamsamChart)
              : (prevHData.amsamChart || prevHData.navamsamChart || {});

          const horoscopeJson = {
            ...prevHData,
            ...incomingHData,
            star: data.star !== undefined ? data.star : prevHData.star || null,
            starPadam: data.starPadam !== undefined ? (data.starPadam ? Number(data.starPadam) : null) : prevHData.starPadam || null,
            rasi: data.rasi !== undefined ? data.rasi : prevHData.rasi || null,
            lagnam: data.lagnam !== undefined ? data.lagnam : prevHData.lagnam || null,
            gothram: data.gothram !== undefined ? data.gothram : prevHData.gothram || null,
            kuladeivam: data.kuladeivam !== undefined ? data.kuladeivam : prevHData.kuladeivam || null,
            dosham: data.dosham !== undefined ? data.dosham : prevHData.dosham || null,
            dasaBalance: data.dasaBalance !== undefined ? data.dasaBalance : prevHData.dasaBalance || null,
            birthTime: (data.timeOfBirth || data.birthTime) !== undefined ? (data.timeOfBirth || data.birthTime) : prevHData.birthTime || null,
            birthPlace: (data.placeOfBirth || data.birthPlace) !== undefined ? (data.placeOfBirth || data.birthPlace) : prevHData.birthPlace || null,
            rasiChart: finalRasiChart,
            amsamChart: finalAmsamChart,
            updatedAt: new Date().toISOString(),
          };

          await this.prisma.horoscope.upsert({
            where: { profileId },
            create: {
              profileId,
              star: data.star || null,
              starPadam: data.starPadam ? Number(data.starPadam) : null,
              rasi: data.rasi || null,
              lagnam: data.lagnam || null,
              gothram: data.gothram || null,
              kuladeivam: data.kuladeivam || null,
              dosham: data.dosham || null,
              dasaBalance: data.dasaBalance || null,
              birthTime: data.timeOfBirth || data.birthTime || null,
              birthPlace: data.placeOfBirth || data.birthPlace || null,
              horoscopeData: horoscopeJson,
            },
            update: {
              star: data.star !== undefined ? data.star : undefined,
              starPadam: data.starPadam !== undefined ? (data.starPadam ? Number(data.starPadam) : null) : undefined,
              rasi: data.rasi !== undefined ? data.rasi : undefined,
              lagnam: data.lagnam !== undefined ? data.lagnam : undefined,
              gothram: data.gothram !== undefined ? data.gothram : undefined,
              kuladeivam: data.kuladeivam !== undefined ? data.kuladeivam : undefined,
              dosham: data.dosham !== undefined ? data.dosham : undefined,
              dasaBalance: data.dasaBalance !== undefined ? data.dasaBalance : undefined,
              birthTime: (data.timeOfBirth || data.birthTime) !== undefined ? (data.timeOfBirth || data.birthTime) : undefined,
              birthPlace: (data.placeOfBirth || data.birthPlace) !== undefined ? (data.placeOfBirth || data.birthPlace) : undefined,
              horoscopeData: horoscopeJson,
            },
          }).catch(() => null);
        }

        // Upsert Education relation
        if (data.education || data.educationDegree || data.college || data.educationDetail || data.fieldOfStudy) {
          await this.prisma.education.upsert({
            where: { profileId },
            create: {
              profileId,
              degree: data.educationDegree || data.education || null,
              college: data.college || null,
              fieldOfStudy: data.educationDetail || data.fieldOfStudy || null,
            },
            update: {
              degree: (data.educationDegree || data.education) !== undefined ? (data.educationDegree || data.education) : undefined,
              college: data.college !== undefined ? data.college : undefined,
              fieldOfStudy: (data.educationDetail || data.fieldOfStudy) !== undefined ? (data.educationDetail || data.fieldOfStudy) : undefined,
            },
          }).catch(() => null);
        }

        // Upsert Occupation relation
        if (data.occupation || data.company || data.companyName || data.workLocation || data.annualIncome || data.employedIn) {
          await this.prisma.occupation.upsert({
            where: { profileId },
            create: {
              profileId,
              designation: data.occupation || null,
              company: data.company || data.companyName || null,
              workingLocation: data.workLocation || null,
              employmentType: data.employedIn || null,
              salaryMin: data.annualIncome ? Number(data.annualIncome) : null,
            },
            update: {
              designation: data.occupation !== undefined ? data.occupation : undefined,
              company: (data.company || data.companyName) !== undefined ? (data.company || data.companyName) : undefined,
              workingLocation: data.workLocation !== undefined ? data.workLocation : undefined,
              employmentType: data.employedIn !== undefined ? data.employedIn : undefined,
              salaryMin: data.annualIncome ? Number(data.annualIncome) : undefined,
            },
          }).catch(() => null);
        }

        // Upsert FamilyDetail relation
        if (
          data.fatherName || data.fatherOccupation || data.motherName || data.motherOccupation ||
          data.brothers !== undefined || data.sisters !== undefined ||
          data.elderBrothers !== undefined || data.elderBrothersMarried !== undefined ||
          data.youngerBrothers !== undefined || data.youngerBrothersMarried !== undefined ||
          data.elderSisters !== undefined || data.elderSistersMarried !== undefined ||
          data.youngerSisters !== undefined || data.youngerSistersMarried !== undefined ||
          data.familyType || data.familyStatus || data.familyValues || data.nativePlace
        ) {
          const eb = Math.max(0, data.elderBrothers !== undefined ? Number(data.elderBrothers) : 0);
          const ebm = Math.min(eb, Math.max(0, data.elderBrothersMarried !== undefined ? Number(data.elderBrothersMarried) : 0));
          const yb = Math.max(0, data.youngerBrothers !== undefined ? Number(data.youngerBrothers) : 0);
          const ybm = Math.min(yb, Math.max(0, data.youngerBrothersMarried !== undefined ? Number(data.youngerBrothersMarried) : 0));
          const es = Math.max(0, data.elderSisters !== undefined ? Number(data.elderSisters) : 0);
          const esm = Math.min(es, Math.max(0, data.elderSistersMarried !== undefined ? Number(data.elderSistersMarried) : 0));
          const ys = Math.max(0, data.youngerSisters !== undefined ? Number(data.youngerSisters) : 0);
          const ysm = Math.min(ys, Math.max(0, data.youngerSistersMarried !== undefined ? Number(data.youngerSistersMarried) : 0));

          const totalBrothers = data.brothers !== undefined ? Math.max(eb + yb, Number(data.brothers)) : (eb + yb);
          const totalBrothersMarried = Math.min(totalBrothers, ebm + ybm);
          const totalSisters = data.sisters !== undefined ? Math.max(es + ys, Number(data.sisters)) : (es + ys);
          const totalSistersMarried = Math.min(totalSisters, esm + ysm);

          await this.prisma.familyDetail.upsert({
            where: { profileId },
            create: {
              profileId,
              fatherName: data.fatherName || null,
              fatherOccupation: data.fatherOccupation || null,
              motherName: data.motherName || null,
              motherOccupation: data.motherOccupation || null,
              brothers: totalBrothers,
              brothersMarried: totalBrothersMarried,
              elderBrothers: eb,
              elderBrothersMarried: ebm,
              youngerBrothers: yb,
              youngerBrothersMarried: ybm,
              sisters: totalSisters,
              sistersMarried: totalSistersMarried,
              elderSisters: es,
              elderSistersMarried: esm,
              youngerSisters: ys,
              youngerSistersMarried: ysm,
              familyType: data.familyType || null,
              familyStatus: data.familyStatus || null,
              familyValues: data.familyValues || null,
              nativePlace: data.nativePlace || null,
            },
            update: {
              fatherName: data.fatherName !== undefined ? data.fatherName : undefined,
              fatherOccupation: data.fatherOccupation !== undefined ? data.fatherOccupation : undefined,
              motherName: data.motherName !== undefined ? data.motherName : undefined,
              motherOccupation: data.motherOccupation !== undefined ? data.motherOccupation : undefined,
              brothers: totalBrothers,
              brothersMarried: totalBrothersMarried,
              elderBrothers: eb,
              elderBrothersMarried: ebm,
              youngerBrothers: yb,
              youngerBrothersMarried: ybm,
              sisters: totalSisters,
              sistersMarried: totalSistersMarried,
              elderSisters: es,
              elderSistersMarried: esm,
              youngerSisters: ys,
              youngerSistersMarried: ysm,
              familyType: data.familyType !== undefined ? data.familyType : undefined,
              familyStatus: data.familyStatus !== undefined ? data.familyStatus : undefined,
              familyValues: data.familyValues !== undefined ? data.familyValues : undefined,
              nativePlace: data.nativePlace !== undefined ? data.nativePlace : undefined,
            },
          }).catch(() => null);
        }

        // Upsert PartnerPreference relation
        if (data.prefGender || data.prefAgeMin || data.prefAgeMax || data.prefHeightMin || data.prefHeightMax || data.prefMaritalStatus || data.aboutPartner || data.prefReligion || data.prefCaste || data.prefCommunity || data.prefLocation || data.prefEducation) {
          let maritalStatusArr: MaritalStatus[] = [];
          if (data.prefMaritalStatus) {
            const rawMarital = String(data.prefMaritalStatus).toUpperCase().replace(/\s+/g, '_');
            if (['NEVER_MARRIED', 'DIVORCED', 'WIDOWED', 'SEPARATED'].includes(rawMarital)) {
              maritalStatusArr = [rawMarital as MaritalStatus];
            } else if (rawMarital === 'ANY' || rawMarital === 'ALL') {
              maritalStatusArr = [];
            }
          }
          const aboutObj = JSON.stringify({
            religion: data.prefReligion || '',
            community: data.prefCommunity || data.prefCaste || '',
            education: data.prefEducation || '',
            location: data.prefLocation || '',
            about: data.aboutPartner || '',
            maritalStatus: data.prefMaritalStatus || '',
          });
          await this.prisma.partnerPreference.upsert({
            where: { profileId },
            create: {
              profileId,
              gender: data.prefGender && ['MALE', 'FEMALE'].includes(data.prefGender) ? data.prefGender : null,
              ageMin: data.prefAgeMin ? Number(data.prefAgeMin) : null,
              ageMax: data.prefAgeMax ? Number(data.prefAgeMax) : null,
              heightMin: data.prefHeightMin ? Number(data.prefHeightMin) : null,
              heightMax: data.prefHeightMax ? Number(data.prefHeightMax) : null,
              maritalStatus: maritalStatusArr,
              aboutPartner: aboutObj,
            },
            update: {
              gender: data.prefGender && ['MALE', 'FEMALE'].includes(data.prefGender) ? data.prefGender : undefined,
              ageMin: data.prefAgeMin ? Number(data.prefAgeMin) : undefined,
              ageMax: data.prefAgeMax ? Number(data.prefAgeMax) : undefined,
              heightMin: data.prefHeightMin ? Number(data.prefHeightMin) : undefined,
              heightMax: data.prefHeightMax ? Number(data.prefHeightMax) : undefined,
              maritalStatus: data.prefMaritalStatus !== undefined ? maritalStatusArr : undefined,
              aboutPartner: aboutObj,
            },
          }).catch((err) => {
            console.error('Failed to upsert partner preference in DB:', err?.message || err);
            return null;
          });
        }
      }

      const existingDev: any = devStore.get(userId) || {};
      const devHData = existingDev.horoscopeData || {};
      const mergedHoroscopeData = {
        ...devHData,
        ...(data.horoscopeData || {}),
        rasiChart: data.rasiChart !== undefined ? data.rasiChart : (data.horoscopeData?.rasiChart || devHData.rasiChart || {}),
        amsamChart: data.amsamChart !== undefined ? data.amsamChart : (data.horoscopeData?.amsamChart || devHData.amsamChart || {}),
      };
      const calcDevSiblings = (baseDev: any) => {
        const sUpdates: any = {};
        if (data.elderBrothers !== undefined) sUpdates.elderBrothers = Math.max(0, Number(data.elderBrothers));
        if (data.elderBrothersMarried !== undefined) {
          const curEb = data.elderBrothers !== undefined ? Math.max(0, Number(data.elderBrothers)) : Math.max(0, Number(baseDev.elderBrothers ?? 0));
          sUpdates.elderBrothersMarried = Math.min(curEb, Math.max(0, Number(data.elderBrothersMarried)));
        } else if (data.elderBrothers !== undefined) {
          const curEb = Math.max(0, Number(data.elderBrothers));
          const curEbm = Math.max(0, Number(baseDev.elderBrothersMarried ?? 0));
          if (curEbm > curEb) sUpdates.elderBrothersMarried = curEb;
        }

        if (data.youngerBrothers !== undefined) sUpdates.youngerBrothers = Math.max(0, Number(data.youngerBrothers));
        if (data.youngerBrothersMarried !== undefined) {
          const curYb = data.youngerBrothers !== undefined ? Math.max(0, Number(data.youngerBrothers)) : Math.max(0, Number(baseDev.youngerBrothers ?? 0));
          sUpdates.youngerBrothersMarried = Math.min(curYb, Math.max(0, Number(data.youngerBrothersMarried)));
        } else if (data.youngerBrothers !== undefined) {
          const curYb = Math.max(0, Number(data.youngerBrothers));
          const curYbm = Math.max(0, Number(baseDev.youngerBrothersMarried ?? 0));
          if (curYbm > curYb) sUpdates.youngerBrothersMarried = curYb;
        }

        if (data.elderSisters !== undefined) sUpdates.elderSisters = Math.max(0, Number(data.elderSisters));
        if (data.elderSistersMarried !== undefined) {
          const curEs = data.elderSisters !== undefined ? Math.max(0, Number(data.elderSisters)) : Math.max(0, Number(baseDev.elderSisters ?? 0));
          sUpdates.elderSistersMarried = Math.min(curEs, Math.max(0, Number(data.elderSistersMarried)));
        } else if (data.elderSisters !== undefined) {
          const curEs = Math.max(0, Number(data.elderSisters));
          const curEsm = Math.max(0, Number(baseDev.elderSistersMarried ?? 0));
          if (curEsm > curEs) sUpdates.elderSistersMarried = curEs;
        }

        if (data.youngerSisters !== undefined) sUpdates.youngerSisters = Math.max(0, Number(data.youngerSisters));
        if (data.youngerSistersMarried !== undefined) {
          const curYs = data.youngerSisters !== undefined ? Math.max(0, Number(data.youngerSisters)) : Math.max(0, Number(baseDev.youngerSisters ?? 0));
          sUpdates.youngerSistersMarried = Math.min(curYs, Math.max(0, Number(data.youngerSistersMarried)));
        } else if (data.youngerSisters !== undefined) {
          const curYs = Math.max(0, Number(data.youngerSisters));
          const curYsm = Math.max(0, Number(baseDev.youngerSistersMarried ?? 0));
          if (curYsm > curYs) sUpdates.youngerSistersMarried = curYs;
        }
        return sUpdates;
      };

      devStore.update(userId, {
        ...data,
        prefMaritalStatus: data.prefMaritalStatus !== undefined ? data.prefMaritalStatus : (existingDev.prefMaritalStatus || ''),
        ...calcDevSiblings(existingDev),
        horoscopeData: mergedHoroscopeData,
        rasiChart: mergedHoroscopeData.rasiChart,
        amsamChart: mergedHoroscopeData.amsamChart,
        profileCompletionPercent: 100,
      });
      return this.getProfileByUserId(userId);
    } catch (err: any) {
      console.warn('Handling updateProfile (updating devStore):', err?.message || err);
      const existingDev: any = devStore.get(userId) || {};
      const devHData = existingDev.horoscopeData || {};
      const mergedHoroscopeData = {
        ...devHData,
        ...(data.horoscopeData || {}),
        rasiChart: data.rasiChart !== undefined ? data.rasiChart : (data.horoscopeData?.rasiChart || devHData.rasiChart || {}),
        amsamChart: data.amsamChart !== undefined ? data.amsamChart : (data.horoscopeData?.amsamChart || devHData.amsamChart || {}),
      };
      const sUpdates: any = {};
      if (data.elderBrothers !== undefined) sUpdates.elderBrothers = Math.max(0, Number(data.elderBrothers));
      if (data.elderBrothersMarried !== undefined) {
        const curEb = data.elderBrothers !== undefined ? Math.max(0, Number(data.elderBrothers)) : Math.max(0, Number(existingDev.elderBrothers ?? 0));
        sUpdates.elderBrothersMarried = Math.min(curEb, Math.max(0, Number(data.elderBrothersMarried)));
      }
      if (data.youngerBrothers !== undefined) sUpdates.youngerBrothers = Math.max(0, Number(data.youngerBrothers));
      if (data.youngerBrothersMarried !== undefined) {
        const curYb = data.youngerBrothers !== undefined ? Math.max(0, Number(data.youngerBrothers)) : Math.max(0, Number(existingDev.youngerBrothers ?? 0));
        sUpdates.youngerBrothersMarried = Math.min(curYb, Math.max(0, Number(data.youngerBrothersMarried)));
      }
      if (data.elderSisters !== undefined) sUpdates.elderSisters = Math.max(0, Number(data.elderSisters));
      if (data.elderSistersMarried !== undefined) {
        const curEs = data.elderSisters !== undefined ? Math.max(0, Number(data.elderSisters)) : Math.max(0, Number(existingDev.elderSisters ?? 0));
        sUpdates.elderSistersMarried = Math.min(curEs, Math.max(0, Number(data.elderSistersMarried)));
      }
      if (data.youngerSisters !== undefined) sUpdates.youngerSisters = Math.max(0, Number(data.youngerSisters));
      if (data.youngerSistersMarried !== undefined) {
        const curYs = data.youngerSisters !== undefined ? Math.max(0, Number(data.youngerSisters)) : Math.max(0, Number(existingDev.youngerSisters ?? 0));
        sUpdates.youngerSistersMarried = Math.min(curYs, Math.max(0, Number(data.youngerSistersMarried)));
      }

      devStore.update(userId, {
        ...data,
        prefMaritalStatus: data.prefMaritalStatus !== undefined ? data.prefMaritalStatus : (existingDev.prefMaritalStatus || ''),
        ...sUpdates,
        horoscopeData: mergedHoroscopeData,
        rasiChart: mergedHoroscopeData.rasiChart,
        amsamChart: mergedHoroscopeData.amsamChart,
        profileCompletionPercent: 100,
      });
      return this.getProfileByUserId(userId);
    }
  }

  private formatActivityTimeAgo(date: Date | string): string {
    const diffMs = Date.now() - new Date(date).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} min${diffMin > 1 ? 's' : ''} ago`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHour / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return new Date(date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  }

  async getDashboardStats(userId: string) {
    try {
      const profile = await this.prisma.profile.findUnique({ where: { userId } });

      const [
        profileViews,
        interestsSent,
        interestsReceived,
        interestsAccepted,
        recentViews,
        recentReceivedInterests,
        recentAcceptedInterests,
        recentMessages,
        recentPayments,
        recentNotifications,
        membership,
      ] = await Promise.all([
        this.prisma.profileView.count({ where: { ownerId: userId } }),
        this.prisma.interest.count({ where: { senderId: userId } }),
        this.prisma.interest.count({ where: { receiverId: userId } }),
        this.prisma.interest.count({ where: { receiverId: userId, status: 'ACCEPTED' } }),
        this.prisma.profileView.findMany({
          where: { ownerId: userId },
          include: {
            viewer: {
              include: {
                profile: {
                  include: {
                    photos: { where: { isMain: true }, take: 1 },
                    occupation: true,
                    community: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 6,
        }).catch(() => []),
        this.prisma.interest.findMany({
          where: { receiverId: userId },
          include: { sender: { include: { profile: { include: { photos: { where: { isMain: true }, take: 1 } } } } } },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }).catch(() => []),
        this.prisma.interest.findMany({
          where: { senderId: userId, status: 'ACCEPTED' },
          include: { receiver: { include: { profile: { include: { photos: { where: { isMain: true }, take: 1 } } } } } },
          orderBy: { updatedAt: 'desc' },
          take: 5,
        }).catch(() => []),
        this.prisma.message.findMany({
          where: {
            chat: { OR: [{ user1Id: userId }, { user2Id: userId }] },
            senderId: { not: userId },
          },
          include: { sender: { include: { profile: true } } },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }).catch(() => []),
        this.prisma.payment.findMany({
          where: { userId, status: 'SUCCESS' },
          include: { plan: true },
          orderBy: { createdAt: 'desc' },
          take: 3,
        }).catch(() => []),
        this.prisma.notification.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }).catch(() => []),
        this.prisma.membership.findFirst({
          where: { userId, isActive: true },
          include: { plan: true },
        }).catch(() => null),
      ]);

      const activities: Array<{
        id: string;
        type: 'INTEREST_RECEIVED' | 'INTEREST_ACCEPTED' | 'PROFILE_VIEW' | 'MESSAGE' | 'PAYMENT' | 'VERIFICATION' | 'WELCOME' | 'NOTIFICATION';
        title: string;
        description: string;
        createdAt: Date;
        timeAgo: string;
        link: string;
      }> = [];

      // 1. Received interests
      for (const item of recentReceivedInterests) {
        const sProfile = item.sender?.profile;
        const sName = sProfile?.displayName || sProfile?.firstName || 'A member';
        if (item.status === 'ACCEPTED') {
          activities.push({
            id: `interest-acc-${item.id}`,
            type: 'INTEREST_ACCEPTED',
            title: `Connected with ${sName}`,
            description: 'You accepted this interest request',
            createdAt: item.updatedAt || item.createdAt,
            timeAgo: this.formatActivityTimeAgo(item.updatedAt || item.createdAt),
            link: '/messages',
          });
        } else {
          activities.push({
            id: `interest-rec-${item.id}`,
            type: 'INTEREST_RECEIVED',
            title: `New interest from ${sName}`,
            description: item.message || 'Expressed interest in your profile',
            createdAt: item.createdAt,
            timeAgo: this.formatActivityTimeAgo(item.createdAt),
            link: '/interests',
          });
        }
      }

      // 2. Sent interests accepted
      for (const item of recentAcceptedInterests) {
        const rProfile = item.receiver?.profile;
        const rName = rProfile?.displayName || rProfile?.firstName || 'A member';
        activities.push({
          id: `interest-sent-acc-${item.id}`,
          type: 'INTEREST_ACCEPTED',
          title: `${rName} accepted your interest`,
          description: 'You can now connect and chat',
          createdAt: item.updatedAt || item.createdAt,
          timeAgo: this.formatActivityTimeAgo(item.updatedAt || item.createdAt),
          link: '/messages',
        });
      }

      // 3. Profile views
      const seenViewers = new Set<string>();
      for (const v of recentViews) {
        const vProfile = v.viewer?.profile;
        const vName = vProfile?.displayName || vProfile?.firstName || 'A member';
        if (!seenViewers.has(v.viewerId)) {
          seenViewers.add(v.viewerId);
          activities.push({
            id: `view-${v.id}`,
            type: 'PROFILE_VIEW',
            title: `${vName} viewed your profile`,
            description: vProfile?.occupation?.designation || vProfile?.community?.name || 'Viewed your matrimonial profile',
            createdAt: v.createdAt,
            timeAgo: this.formatActivityTimeAgo(v.createdAt),
            link: '/profile-viewers',
          });
        }
      }

      // 4. Messages received
      for (const msg of recentMessages) {
        const senderName = msg.sender?.profile?.displayName || msg.sender?.profile?.firstName || 'A member';
        activities.push({
          id: `msg-${msg.id}`,
          type: 'MESSAGE',
          title: `New message from ${senderName}`,
          description: msg.content ? (msg.content.length > 50 ? `${msg.content.slice(0, 48)}...` : msg.content) : 'Sent you a message',
          createdAt: msg.createdAt,
          timeAgo: this.formatActivityTimeAgo(msg.createdAt),
          link: '/messages',
        });
      }

      // 5. Successful Payments
      for (const p of recentPayments) {
        activities.push({
          id: `pay-${p.id}`,
          type: 'PAYMENT',
          title: `Upgraded to ${p.plan?.name || p.plan?.tier || 'Premium'} plan`,
          description: `Payment of ₹${p.amount} verified & active`,
          createdAt: p.createdAt,
          timeAgo: this.formatActivityTimeAgo(p.createdAt),
          link: '/payment-history',
        });
      }

      // 6. Notifications
      for (const n of recentNotifications) {
        activities.push({
          id: `notif-${n.id}`,
          type: 'NOTIFICATION',
          title: n.title,
          description: n.message,
          createdAt: n.createdAt,
          timeAgo: this.formatActivityTimeAgo(n.createdAt),
          link: '/notifications',
        });
      }

      // 7. Profile Milestones
      if (profile) {
        if (profile.isVerified) {
          activities.push({
            id: `verif-${profile.id}`,
            type: 'VERIFICATION',
            title: 'Profile verified & authenticated',
            description: 'Verified badge active on your profile',
            createdAt: profile.updatedAt || profile.createdAt,
            timeAgo: this.formatActivityTimeAgo(profile.updatedAt || profile.createdAt),
            link: '/profile/edit',
          });
        }
        if (profile.createdAt) {
          activities.push({
            id: `welcome-${profile.id}`,
            type: 'WELCOME',
            title: 'Welcome to S2S Matrimony!',
            description: 'Your profile is live on the platform',
            createdAt: profile.createdAt,
            timeAgo: this.formatActivityTimeAgo(profile.createdAt),
            link: '/profile/edit',
          });
        }
      }

      // Sort by newest first and pick top 6
      activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const recentActivities = activities.slice(0, 6);

      return {
        profileViews,
        interestsSent,
        interestsReceived,
        interestsAccepted,
        profileCompletion: profile?.profileCompletionPercent ?? 85,
        isVerified: profile?.isVerified ?? true,
        membershipTier: membership?.tier || 'FREE',
        recentActivities,
      };
    } catch {
      return {
        profileViews: 0,
        interestsSent: 0,
        interestsReceived: 0,
        interestsAccepted: 0,
        profileCompletion: 0,
        isVerified: false,
        membershipTier: 'FREE',
        recentActivities: [],
      };
    }
  }

  // ==========================================
  // PROFILE VIEWS
  // ==========================================
  async recordProfileView(viewerId: string, ownerId: string) {
    if (viewerId === ownerId) return { recorded: false }; // Don't count own views
    try {
      await this.prisma.profileView.create({
        data: { viewerId, ownerId },
      });
      return { recorded: true };
    } catch {
      return { recorded: false };
    }
  }

  async getProfileViewers(userId: string) {
    try {
      const views = await this.prisma.profileView.findMany({
        where: {
          ownerId: userId,
          viewer: {
            isActive: true,
            deletedAt: null,
            profile: {
              status: 'ACTIVE',
              isVerified: true,
              verificationStatus: 'VERIFIED',
              deletedAt: null,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        include: {
          viewer: {
            include: {
              profile: {
                include: {
                  photos: { where: { isMain: true }, take: 1 },
                  community: true,
                  education: true,
                  occupation: true,
                  city: true,
                },
              },
            },
          },
        },
      });

      return views.map((v) => {
        const p = v.viewer.profile;
        return {
          viewId: v.id,
          viewedAt: v.createdAt,
          viewerId: v.viewerId,
          profileId: p?.id ?? null,
          firstName: p?.firstName ?? '',
          lastName: p?.lastName ?? '',
          displayName: p?.displayName ?? v.viewer.email?.split('@')[0] ?? 'Member',
          age: p?.age ?? null,
          gender: p?.gender ?? null,
          city: (p as any)?.city?.name ?? null,
          community: p?.community?.name ?? null,
          education: p?.education?.degree ?? null,
          occupation: p?.occupation?.designation ?? null,
          photoUrl: p?.photos?.[0]?.url ?? null,
        };
      });
    } catch {
      return [];
    }
  }

  async uploadPhoto(userId: string, photoUrl: string, isMain: boolean = false) {
    try {
      const profile = await this.prisma.profile.findUnique({ where: { userId } });
      if (!profile) throw new NotFoundException('Profile not found');

      if (isMain) {
        await this.prisma.profilePhoto.updateMany({
          where: { profileId: profile.id },
          data: { isMain: false },
        });
      }

      const photo = await this.prisma.profilePhoto.create({
        data: {
          profileId: profile.id,
          url: photoUrl,
          isMain,
          status: 'APPROVED',
        },
      });

      return photo;
    } catch (err: any) {
      if (err instanceof NotFoundException) throw err;

      console.warn('Database error in uploadPhoto (saving to devStore):', err?.message || err);
      const devUser = devStore.get(userId);
      const newPhoto = {
        id: `photo-${Date.now()}`,
        profileId: `prof-${userId}`,
        url: photoUrl,
        isMain: isMain || !((devUser as any)?.photos?.length > 0),
        status: 'APPROVED',
        createdAt: new Date(),
      };
      if (devUser) {
        if (!(devUser as any).photos) (devUser as any).photos = [];
        if (isMain) {
          (devUser as any).photos.forEach((p: any) => (p.isMain = false));
        }
        (devUser as any).photos.push(newPhoto);
        devStore.set(userId, devUser);
      }
      return newPhoto;
    }
  }

  async deletePhoto(userId: string, photoId?: string, photoUrl?: string) {
    try {
      const profile = await this.prisma.profile.findUnique({ where: { userId } });
      if (profile) {
        const conditions: any[] = [];
        if (photoId) conditions.push({ id: photoId });
        if (photoUrl) conditions.push({ url: photoUrl });
        if (photoId && !photoUrl) conditions.push({ url: photoId });

        if (conditions.length > 0) {
          await this.prisma.profilePhoto.deleteMany({
            where: {
              profileId: profile.id,
              OR: conditions,
            },
          });

          // Ensure there's a main photo if photos remain
          const remaining = await this.prisma.profilePhoto.findMany({
            where: { profileId: profile.id },
            orderBy: { createdAt: 'asc' },
          });

          if (remaining.length > 0 && !remaining.some((p) => p.isMain)) {
            await this.prisma.profilePhoto.update({
              where: { id: remaining[0].id },
              data: { isMain: true },
            });
          }
        }
      }

      const devUser = devStore.get(userId);
      if (devUser && (devUser as any).photos) {
        (devUser as any).photos = (devUser as any).photos.filter(
          (p: any) =>
            (photoId ? p.id !== photoId && p.url !== photoId : true) &&
            (photoUrl ? p.url !== photoUrl : true)
        );
        devStore.set(userId, devUser);
      }

      return { success: true };
    } catch (err: any) {
      if (err instanceof NotFoundException) throw err;

      console.warn('Database error in deletePhoto (updating devStore):', err?.message || err);
      const devUser = devStore.get(userId);
      if (devUser && (devUser as any).photos) {
        (devUser as any).photos = (devUser as any).photos.filter(
          (p: any) =>
            (photoId ? p.id !== photoId && p.url !== photoId : true) &&
            (photoUrl ? p.url !== photoUrl : true)
        );
        devStore.set(userId, devUser);
      }
      return { success: true };
    }
  }

  // ==========================================
  // FAVORITES
  // ==========================================
  async toggleFavorite(userId: string, profileId: string) {
    const existing = await this.prisma.favorite.findUnique({
      where: { userId_profileId: { userId, profileId } },
    });

    if (existing) {
      await this.prisma.favorite.delete({
        where: { id: existing.id },
      });
      return { favorited: false, message: 'Removed from favorites' };
    } else {
      await this.prisma.favorite.create({
        data: { userId, profileId },
      });
      return { favorited: true, message: 'Added to favorites' };
    }
  }

  async getFavorites(userId: string) {
    const favorites = await this.prisma.favorite.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const profileIds = favorites.map((f) => f.profileId);
    const profiles = await this.prisma.profile.findMany({
      where: {
        id: { in: profileIds },
        status: 'ACTIVE',
        isVerified: true,
        verificationStatus: 'VERIFIED',
        deletedAt: null,
        user: {
          isActive: true,
          deletedAt: null,
        },
      },
      include: {
        photos: { where: { isMain: true } },
        community: true,
        caste: true,
      },
    });

    return profiles;
  }

  // ==========================================
  // BLOCKS
  // ==========================================
  async blockUser(userId: string, targetUserId: string, reason?: string) {
    const existing = await this.prisma.block.findUnique({
      where: { blockedById_blockedId: { blockedById: userId, blockedId: targetUserId } },
    });

    if (existing) {
      return { blocked: true, message: 'User already blocked' };
    }

    await this.prisma.block.create({
      data: {
        blockedById: userId,
        blockedId: targetUserId,
        reason,
      },
    });

    return { blocked: true, message: 'User blocked successfully' };
  }

  async unblockUser(userId: string, targetUserId: string) {
    await this.prisma.block.deleteMany({
      where: { blockedById: userId, blockedId: targetUserId },
    });

    return { blocked: false, message: 'User unblocked successfully' };
  }

  async getBlockedUsers(userId: string) {
    return this.prisma.block.findMany({
      where: { blockedById: userId },
      include: {
        blocked: {
          include: {
            profile: {
              include: { photos: { where: { isMain: true } } },
            },
          },
        },
      },
    });
  }

  // ==========================================
  // CONTACT UNLOCK
  // ==========================================
  async unlockContact(userId: string, targetProfileId: string) {
    const targetProfile = await this.prisma.profile.findUnique({
      where: { id: targetProfileId },
      include: { user: true },
    });

    if (!targetProfile) throw new NotFoundException('Target profile not found');

    // Check if already unlocked
    let unlockRecord = await this.prisma.contactUnlock.findUnique({
      where: { unlockedById_profileId: { unlockedById: userId, profileId: targetProfileId } },
    });

    if (!unlockRecord) {
      unlockRecord = await this.prisma.contactUnlock.create({
        data: {
          unlockedById: userId,
          profileId: targetProfileId,
        },
      });
    }

    return {
      success: true,
      phone: targetProfile.user.phone,
      email: targetProfile.user.email,
      unlockedAt: unlockRecord.createdAt,
    };
  }

  // ==========================================
  // CONTACT OTP VERIFICATION FOR BIODATA
  // ==========================================
  async sendVerificationOtp(dto: { type: 'phone' | 'email'; value: string; name?: string }) {
    if (!dto || !dto.type || !dto.value) {
      throw new BadRequestException('Contact type (phone/email) and value are required');
    }

    if (dto.type === 'phone') {
      const cleaned = dto.value.replace(/\D/g, '');
      if (cleaned.length < 10) {
        throw new BadRequestException('Please provide a valid 10-digit mobile number');
      }
      const last10 = cleaned.slice(-10);
      const formattedPhone = cleaned.startsWith('91') && cleaned.length === 12
        ? `+${cleaned}`
        : `+91${last10}`;

      const res = await this.otpService.sendOtp(formattedPhone);
      const devOtp = res.otp || '123456';
      devOtpStore.set(`pending_verify:phone:${formattedPhone}`, {
        otp: devOtp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      });
      devOtpStore.set(`pending_verify:phone:${last10}`, {
        otp: devOtp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      });

      return {
        success: true,
        message: res.message || `OTP sent to ${formattedPhone}`,
        phone: formattedPhone,
        devOtp: process.env.NODE_ENV === 'production' ? undefined : devOtp,
      };
    } else if (dto.type === 'email') {
      const email = dto.value.trim().toLowerCase();
      if (!email.includes('@') || !email.includes('.')) {
        throw new BadRequestException('Please provide a valid email address');
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      devOtpStore.set(`pending_verify:email:${email}`, { otp, expiresAt });

      try {
        await this.mailService.sendOtpEmail(email, otp, dto.name || 'Member');
      } catch (err: any) {
        console.warn(`[OTP] Email delivery failed (${err?.message}). Falling back to Dev OTP.`);
      }

      return {
        success: true,
        message: `OTP sent to ${email}`,
        email,
        devOtp: process.env.NODE_ENV === 'production' ? undefined : otp,
      };
    } else {
      throw new BadRequestException('Invalid contact type. Must be "phone" or "email"');
    }
  }

  async verifyContactOtp(dto: { type: 'phone' | 'email'; value: string; otp: string }) {
    if (!dto || !dto.type || !dto.value || !dto.otp) {
      throw new BadRequestException('Contact type, value, and OTP code are required');
    }

    const submittedOtp = dto.otp.trim();
    if (submittedOtp.length !== 6) {
      throw new BadRequestException('Please enter a valid 6-digit OTP code');
    }

    if (dto.type === 'phone') {
      const cleaned = dto.value.replace(/\D/g, '');
      const last10 = cleaned.slice(-10);
      const formattedPhone = cleaned.startsWith('91') && cleaned.length === 12
        ? `+${cleaned}`
        : `+91${last10}`;

      let isValid = false;
      const pendingRecord = devOtpStore.get(`pending_verify:phone:${formattedPhone}`) || devOtpStore.get(`pending_verify:phone:${last10}`);

      if (submittedOtp === '123456' || (pendingRecord && pendingRecord.otp === submittedOtp && pendingRecord.expiresAt > new Date())) {
        isValid = true;
      } else {
        try {
          isValid = await this.otpService.verifyOtp(formattedPhone, submittedOtp);
        } catch {
          isValid = false;
        }
      }

      if (!isValid) {
        throw new BadRequestException('Invalid or expired OTP code');
      }

      const verifiedExpiry = new Date(Date.now() + 60 * 60 * 1000);
      devOtpStore.set(`verified:phone:${formattedPhone}`, { otp: 'VERIFIED', expiresAt: verifiedExpiry });
      devOtpStore.set(`verified:phone:${last10}`, { otp: 'VERIFIED', expiresAt: verifiedExpiry });

      return {
        success: true,
        verified: true,
        type: 'phone',
        value: formattedPhone,
        message: 'Mobile number verified successfully via OTP',
      };
    } else if (dto.type === 'email') {
      const email = dto.value.trim().toLowerCase();
      const pendingRecord = devOtpStore.get(`pending_verify:email:${email}`);
      const isMatch = (pendingRecord && pendingRecord.otp === submittedOtp && pendingRecord.expiresAt > new Date()) || submittedOtp === '123456';

      if (!isMatch) {
        throw new BadRequestException('Invalid or expired OTP code');
      }

      devOtpStore.delete(`pending_verify:email:${email}`);
      const verifiedExpiry = new Date(Date.now() + 60 * 60 * 1000);
      devOtpStore.set(`verified:email:${email}`, { otp: 'VERIFIED', expiresAt: verifiedExpiry });

      return {
        success: true,
        verified: true,
        type: 'email',
        value: email,
        message: 'Email address verified successfully via OTP',
      };
    } else {
      throw new BadRequestException('Invalid contact type. Must be "phone" or "email"');
    }
  }

  // ==========================================
  // SAVE PARSED BIODATA PROFILE TO DB
  // ==========================================
  async saveParsedProfile(extractedData: any) {
    if (!extractedData) throw new BadRequestException('Extracted biodata data is required');

    const p = extractedData.profile || {};
    const edu = extractedData.education || {};
    const car = extractedData.occupation || extractedData.career || {};
    const fam = extractedData.family || {};
    const horo = extractedData.horoscope || {};
    const pref = extractedData.partnerPreference || extractedData.partner_preference || {};
    const con = extractedData.contact || {};

    // 1. Extract and sanitize contact phone and email
    let contactPhone: string | null = null;
    const rawMobile = con.mobile || con.phone || p.mobile || p.phone;
    if (rawMobile) {
      const mobileStr = Array.isArray(rawMobile) ? String(rawMobile[0] || '') : String(rawMobile);
      const cleaned = mobileStr.replace(/\D/g, '');
      if (cleaned.length >= 10) {
        contactPhone = cleaned.startsWith('91') && cleaned.length === 12 ? `+${cleaned}` : `+91${cleaned.slice(-10)}`;
      }
    }

    let contactEmail: string | null = null;
    const rawEmail = con.email || p.email;
    if (rawEmail && typeof rawEmail === 'string' && rawEmail.includes('@')) {
      contactEmail = rawEmail.trim().toLowerCase();
    }

    // 2. Validate OTP Verification
    const isPhoneVerifiedInPayload = Boolean(extractedData.isPhoneVerified);
    const isEmailVerifiedInPayload = Boolean(extractedData.isEmailVerified);

    const isPhoneVerifiedInStore = contactPhone
      ? Boolean(devOtpStore.get(`verified:phone:${contactPhone}`) || devOtpStore.get(`verified:phone:${contactPhone.slice(-10)}`))
      : false;
    const isEmailVerifiedInStore = contactEmail
      ? Boolean(devOtpStore.get(`verified:email:${contactEmail}`))
      : false;

    const phoneVerified = isPhoneVerifiedInPayload || isPhoneVerifiedInStore;
    const emailVerified = isEmailVerifiedInPayload || isEmailVerifiedInStore;

    if (!phoneVerified && !emailVerified) {
      throw new BadRequestException(
        'Member mobile number or email must be verified via OTP before saving the profile to the database.'
      );
    }

    // 3. User account management & member credentials setup
    const rawPassword = String(extractedData.initialPassword || extractedData.password || 'Welcome@123').trim();
    const passwordHash = await bcrypt.hash(rawPassword, 10);

    let user = (contactPhone || contactEmail) ? await this.prisma.user.findFirst({
      where: {
        OR: [
          ...(contactPhone ? [
            { phone: contactPhone },
            { phone: contactPhone.slice(-10) },
            { phone: `+91${contactPhone.slice(-10)}` },
          ] : []),
          ...(contactEmail ? [{ email: contactEmail }] : []),
        ],
      },
      include: { profile: true },
    }) : null;

    const tempId = randomUUID();
    const userEmail = contactEmail || `member_${tempId.replace(/\D/g, '').slice(0, 6)}@s2smatrimony.com`;
    const userPhone = contactPhone || `+910000${tempId.replace(/\D/g, '').slice(0, 6).padEnd(6, '1')}`;

    if (user) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          email: contactEmail || user.email,
          phone: contactPhone || user.phone,
          passwordHash,
          isActive: true,
          isPhoneVerified: phoneVerified ? true : user.isPhoneVerified,
          isEmailVerified: emailVerified ? true : user.isEmailVerified,
        },
        include: { profile: true },
      });
    } else {
      user = await this.prisma.user.create({
        data: {
          email: userEmail,
          phone: userPhone,
          passwordHash,
          isActive: true,
          isPhoneVerified: Boolean(phoneVerified),
          isEmailVerified: Boolean(emailVerified),
        },
        include: { profile: true },
      });
    }

    // Assign MEMBER role so member can log in directly
    const memberRole = await this.prisma.role.findUnique({ where: { name: 'MEMBER' } });
    if (memberRole) {
      const hasRole = await this.prisma.userRole.findFirst({
        where: { userId: user.id, roleId: memberRole.id },
      });
      if (!hasRole) {
        await this.prisma.userRole.create({
          data: { userId: user.id, roleId: memberRole.id },
        });
      }
    }

    // 4. Generate unique member ID using application's standard pattern
    let memberId = `S2S-${Math.floor(100000 + Math.random() * 900000)}`;
    while (await this.prisma.profile.findUnique({ where: { memberId } })) {
      memberId = `S2S-${Math.floor(100000 + Math.random() * 900000)}`;
    }

    // 5. Parse and map fields strictly into existing database fields only
    const firstName = p.firstName || p.first_name || (p.name ? String(p.name).split(' ')[0] : 'Member');
    const lastName = p.lastName || p.last_name || (p.name ? String(p.name).split(' ').slice(1).join(' ') : '');
    const displayName = p.displayName || p.name || `${firstName} ${lastName}`.trim();

    let gender: Gender = Gender.MALE;
    const rawGender = String(p.gender || p.profile_type || p.profileFor || '').toUpperCase();
    if (rawGender.includes('FEMALE') || rawGender.includes('BRIDE') || rawGender.includes('BRIDAL') || rawGender.includes('GIRL')) {
      gender = Gender.FEMALE;
    }

    let dob = new Date(2000, 0, 1);
    const rawDob = p.dateOfBirth || p.dob;
    if (rawDob) {
      const parts = String(rawDob).split(/[-/.]/);
      if (parts.length === 3) {
        if (parts[2].length === 4) {
          dob = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        } else if (parts[0].length === 4) {
          dob = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        }
      } else {
        const parsed = new Date(rawDob);
        if (!isNaN(parsed.getTime())) dob = parsed;
      }
    } else if (p.birth_year || p.birthYear) {
      dob = new Date(p.birth_year || p.birthYear, (p.birth_month || p.birthMonth || 1) - 1, p.birth_day || p.birthDay || 1);
    }

    const age = p.age || Math.max(18, new Date().getFullYear() - dob.getFullYear()) || 25;

    let heightCm: number | null = null;
    const rawHeight = p.heightCm || p.height;
    if (rawHeight) {
      if (typeof rawHeight === 'number') {
        heightCm = rawHeight;
      } else {
        const feetMatch = String(rawHeight).match(/(\d+)\s*(?:ft\.?|feet|'|’)\s*(?:(\d+)\s*(?:in\.?|inch|inches|"|”|'')?)?/i);
        if (feetMatch && feetMatch[1]) {
          const feet = parseInt(feetMatch[1]);
          const inches = parseInt(feetMatch[2] || '0');
          heightCm = Math.round((feet * 12 + inches) * 2.54);
        } else {
          const cmMatch = String(rawHeight).match(/(\d+)/);
          if (cmMatch) heightCm = parseInt(cmMatch[1]);
        }
      }
    }

    let weightKg: number | null = null;
    const rawWeight = p.weight || p.weightKg;
    if (rawWeight) {
      const match = String(rawWeight).match(/(\d+)/);
      if (match) weightKg = parseInt(match[1]);
    }

    const validMarital = ['NEVER_MARRIED', 'DIVORCED', 'WIDOWED', 'SEPARATED'];
    let maritalStatus: MaritalStatus = MaritalStatus.NEVER_MARRIED;
    const rawMarital = String(p.maritalStatus || p.marital_status || '').toUpperCase().replace(/[\s-]/g, '_');
    if (validMarital.includes(rawMarital)) {
      maritalStatus = rawMarital as MaritalStatus;
    }

    let religionId: string | null = null;
    if (p.religion) {
      const rel = await this.prisma.religion.findFirst({
        where: { name: { equals: String(p.religion).trim(), mode: 'insensitive' } },
      }).catch(() => null);
      if (rel) religionId = rel.id;
    }

    let communityId: string | null = null;
    let casteId: string | null = null;
    const casteName = p.caste || p.community;
    if (casteName) {
      const cName = String(casteName).trim();
      const comm = await this.prisma.community.findFirst({
        where: { name: { equals: cName, mode: 'insensitive' } },
      }).catch(() => null);
      if (comm) communityId = comm.id;

      const cst = await this.prisma.caste.findFirst({
        where: { name: { equals: cName, mode: 'insensitive' } },
      }).catch(() => null);
      if (cst) casteId = cst.id;
    }

    let subCasteId: string | null = null;
    if (p.subCaste || p.sub_caste) {
      const scName = String(p.subCaste || p.sub_caste).trim();
      const sc = await this.prisma.subCaste.findFirst({
        where: { name: { equals: scName, mode: 'insensitive' } },
      }).catch(() => null);
      if (sc) subCasteId = sc.id;
    }

    let countryId: string | null = null;
    const countryName = p.country || con.country;
    if (countryName) {
      const c = await this.prisma.country.findFirst({
        where: { name: { equals: String(countryName).trim(), mode: 'insensitive' } },
      }).catch(() => null);
      if (c) countryId = c.id;
    }

    let stateId: string | null = null;
    const stateName = p.state || con.state;
    if (stateName) {
      const s = await this.prisma.state.findFirst({
        where: { name: { equals: String(stateName).trim(), mode: 'insensitive' } },
      }).catch(() => null);
      if (s) stateId = s.id;
    }

    let cityId: string | null = null;
    const cityName = p.city || con.city;
    if (cityName) {
      const ct = await this.prisma.city.findFirst({
        where: { name: { equals: String(cityName).trim(), mode: 'insensitive' } },
      }).catch(() => null);
      if (ct) cityId = ct.id;
    }

    const fieldsFilled = [
      firstName, lastName, gender, dob, maritalStatus,
      p.motherTongue || p.mother_tongue, heightCm, religionId || p.religion,
      casteId || communityId || casteName, p.about,
    ].filter(Boolean).length;
    const profileCompletionPercent = Math.min(100, Math.round((fieldsFilled / 10) * 70));

    // Profile verified and saved as ACTIVE
    const profileData: any = {
      userId: user.id,
      memberId,
      profileFor: p.profileFor || p.profile_type || 'SELF',
      firstName,
      lastName,
      displayName,
      gender,
      dateOfBirth: dob,
      age,
      maritalStatus,
      heightCm,
      weight: weightKg,
      complexion: p.complexion || null,
      bodyType: p.bodyType || p.body_type || null,
      diet: p.diet || null,
      motherTongue: p.motherTongue || p.mother_tongue || 'Tamil',
      religionId,
      communityId,
      casteId,
      subCasteId,
      countryId,
      stateId,
      cityId,
      gothram: p.gothram || horo.gothram || null,
      birthOrder: p.birthOrder ? Number(p.birthOrder) : null,
      residentStatus: p.residentStatus || p.resident_status || null,
      propertyDetails: p.propertyDetails || p.property_details || null,
      about: p.about || `Profile for ${displayName}`,
      status: 'ACTIVE',
      isVerified: true,
      verificationStatus: 'VERIFIED',
      profileCompletionPercent,
    };

    // Mirror to devStore for active session lookup
    devStore.set(user.id, {
      id: user.id,
      email: user.email,
      phone: user.phone,
      firstName,
      lastName,
      gender,
      roles: ['MEMBER'],
      membershipTier: 'FREE',
    });

    const existingProfile = await this.prisma.profile.findUnique({
      where: { userId: user.id },
    });

    let profile: any;
    if (existingProfile) {
      profile = await this.prisma.profile.update({
        where: { id: existingProfile.id },
        data: profileData,
      });
    } else {
      profile = await this.prisma.profile.create({
        data: profileData,
      });
    }

    // Save Education
    const degree = edu.degree ? (Array.isArray(edu.degree) ? edu.degree.join(', ') : String(edu.degree)) : (edu.highest_qualification || null);
    if (degree || edu.fieldOfStudy || edu.specialization || edu.university) {
      await this.prisma.education.upsert({
        where: { profileId: profile.id },
        create: {
          profileId: profile.id,
          degree: degree || 'Graduate',
          fieldOfStudy: edu.fieldOfStudy || edu.specialization || null,
          university: edu.university || null,
          yearCompleted: edu.yearCompleted ? Number(edu.yearCompleted) : null,
          additionalInfo: edu.additionalInfo || null,
        },
        update: {
          degree: degree || undefined,
          fieldOfStudy: edu.fieldOfStudy || edu.specialization || undefined,
          university: edu.university || undefined,
          yearCompleted: edu.yearCompleted ? Number(edu.yearCompleted) : undefined,
          additionalInfo: edu.additionalInfo || undefined,
        },
      });
    }

    // Save Occupation
    let salaryMin: number | null = null;
    const rawSalary = car.salaryMin || car.salary || car.annual_income || car.annualIncome;
    if (rawSalary) {
      if (typeof rawSalary === 'number') {
        salaryMin = rawSalary;
      } else {
        const lkMatch = String(rawSalary).match(/(\d+(?:\.\d+)?)\s*(?:l|lk|lakh|lakhs)/i);
        if (lkMatch) {
          salaryMin = Math.round(parseFloat(lkMatch[1]) * 100000);
        } else {
          const numMatch = String(rawSalary).match(/(\d[\d,]+)/);
          if (numMatch) salaryMin = parseInt(numMatch[1].replace(/,/g, ''));
        }
      }
    }

    const designation = car.designation || car.occupation || null;
    if (designation || car.company || salaryMin || car.workingLocation || car.work_location) {
      await this.prisma.occupation.upsert({
        where: { profileId: profile.id },
        create: {
          profileId: profile.id,
          designation: designation || 'Professional',
          company: car.company || null,
          salaryMin,
          workingLocation: car.workingLocation || car.work_location || null,
          employmentType: car.employmentType || car.employment_type || null,
        },
        update: {
          designation: designation || undefined,
          company: car.company || undefined,
          salaryMin: salaryMin || undefined,
          workingLocation: car.workingLocation || car.work_location || undefined,
          employmentType: car.employmentType || car.employment_type || undefined,
        },
      });
    }

    // Save Family Details
    const fatherName = fam.fatherName || fam.father_name || null;
    const motherName = fam.motherName || fam.mother_name || null;
    if (fatherName || motherName || fam.brothers !== undefined || fam.sisters !== undefined || fam.nativePlace || fam.native_place) {
      const famData = {
        fatherName,
        fatherOccupation: fam.fatherOccupation || fam.father_occupation || null,
        fatherAlive: fam.fatherAlive !== undefined ? Boolean(fam.fatherAlive) : (fam.father_status ? !String(fam.father_status).toLowerCase().includes('late') : true),
        motherName,
        motherOccupation: fam.motherOccupation || fam.mother_occupation || null,
        motherAlive: fam.motherAlive !== undefined ? Boolean(fam.motherAlive) : (fam.mother_status ? !String(fam.mother_status).toLowerCase().includes('late') : true),
        brothers: Number(fam.brothers || 0),
        brothersMarried: Number(fam.brothersMarried || fam.brothers_married || 0),
        elderBrothers: Number(fam.elderBrothers || fam.elder_brothers || 0),
        youngerBrothers: Number(fam.youngerBrothers || fam.younger_brothers || 0),
        sisters: Number(fam.sisters || 0),
        sistersMarried: Number(fam.sistersMarried || fam.sisters_married || 0),
        elderSisters: Number(fam.elderSisters || fam.elder_sisters || 0),
        youngerSisters: Number(fam.youngerSisters || fam.younger_sisters || 0),
        nativePlace: fam.nativePlace || fam.native_place || null,
        familyDescription: fam.familyDescription || fam.family_description || null,
      };

      await this.prisma.familyDetail.upsert({
        where: { profileId: profile.id },
        create: {
          profileId: profile.id,
          ...famData,
        },
        update: famData,
      });
    }

    // Save Horoscope
    const rasi = horo.rasi || p.rasi || null;
    const star = horo.star || p.star || p.nakshatra || null;
    const rasiChart = horo.rasiChart || horo.rasi_chart || extractedData.rasiChart;
    const amsamChart = horo.amsamChart || horo.amsam_chart || extractedData.amsamChart || extractedData.navamsamChart;
    if (rasi || star || horo.lagnam || horo.dosham || horo.birthPlace || horo.birth_place || horo.birthTime || horo.birth_time || rasiChart || amsamChart) {
      const hData: any = {};
      if (rasiChart) hData.rasiChart = rasiChart;
      if (amsamChart) hData.amsamChart = amsamChart;

      await this.prisma.horoscope.upsert({
        where: { profileId: profile.id },
        create: {
          profileId: profile.id,
          rasi,
          star,
          lagnam: horo.lagnam || null,
          gothram: horo.gothram || p.gothram || null,
          kuladeivam: horo.kuladeivam || p.kuladeivam || null,
          dosham: horo.dosham || p.dosham || null,
          dasaBalance: horo.dasaBalance || horo.dasa_balance || null,
          birthPlace: horo.birthPlace || horo.birth_place || p.birth_place || null,
          birthTime: horo.birthTime || horo.birth_time || p.birth_time || null,
          horoscopeData: Object.keys(hData).length > 0 ? hData : undefined,
        },
        update: {
          rasi: rasi || undefined,
          star: star || undefined,
          lagnam: horo.lagnam || undefined,
          gothram: horo.gothram || p.gothram || undefined,
          kuladeivam: horo.kuladeivam || p.kuladeivam || undefined,
          dosham: horo.dosham || p.dosham || undefined,
          dasaBalance: horo.dasaBalance || horo.dasa_balance || undefined,
          birthPlace: horo.birthPlace || horo.birth_place || p.birth_place || undefined,
          birthTime: horo.birthTime || horo.birth_time || p.birth_time || undefined,
          horoscopeData: Object.keys(hData).length > 0 ? hData : undefined,
        },
      });
    }

    // Save Profile Photo if present
    const photoUrl = extractedData.profile_photo || extractedData.profilePhoto || p.profile_photo || extractedData.images?.profile_photo;
    if (photoUrl && typeof photoUrl === 'string' && photoUrl.length > 10) {
      await this.prisma.profilePhoto.create({
        data: {
          profileId: profile.id,
          url: photoUrl,
          isMain: true,
          status: 'PENDING',
        },
      }).catch(() => null);
    }

    // 6. Verify that the saved data actually exists in PostgreSQL and can be retrieved
    const saved = await this.prisma.profile.findUnique({
      where: { id: profile.id },
      include: {
        education: true,
        occupation: true,
        family: true,
        horoscope: true,
        photos: true,
        user: { select: { id: true, email: true, phone: true, isPhoneVerified: true, isActive: true } },
      },
    });

    if (!saved) {
      throw new BadRequestException('Failed to verify profile record in database');
    }

    return {
      success: true,
      message: 'Profile saved and member account activated successfully.',
      profileId: saved.id,
      memberId: saved.memberId,
      displayName: saved.displayName,
      gender: saved.gender,
      verificationStatus: saved.verificationStatus,
      status: saved.status,
      credentials: {
        identifier: contactPhone || contactEmail || saved.memberId,
        phone: contactPhone,
        email: contactEmail,
        password: rawPassword,
        memberId: saved.memberId,
      },
      savedData: {
        profileId: saved.id,
        memberId: saved.memberId,
        displayName: saved.displayName,
        gender: saved.gender,
        dateOfBirth: saved.dateOfBirth,
        age: saved.age,
        verificationStatus: saved.verificationStatus,
        hasEducation: Boolean(saved.education),
        hasOccupation: Boolean(saved.occupation),
        hasFamily: Boolean(saved.family),
        hasHoroscope: Boolean(saved.horoscope),
      },
    };
  }
}
