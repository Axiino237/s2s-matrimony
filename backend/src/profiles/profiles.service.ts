import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Gender } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { devStore } from '../common/dev-store';
import { buildCanonicalProfileJson } from '../common/profile-json-formatter';

@Injectable()
export class ProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfileByUserId(userId: string) {
    try {
      let profile = await this.prisma.profile.findUnique({
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
          partnerPreference: true,
          privacySetting: true,
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
            partnerPreference: true,
            privacySetting: true,
          },
        });
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
          brothers: profile.family?.brothers ?? devUser.brothers ?? 0,
          sisters: profile.family?.sisters ?? devUser.sisters ?? 0,
          elderBrothers: profile.family?.elderBrothers ?? devUser.elderBrothers ?? 0,
          elderBrothersMarried: profile.family?.elderBrothersMarried ?? devUser.elderBrothersMarried ?? 0,
          youngerBrothers: profile.family?.youngerBrothers ?? devUser.youngerBrothers ?? 0,
          youngerBrothersMarried: profile.family?.youngerBrothersMarried ?? devUser.youngerBrothersMarried ?? 0,
          elderSisters: profile.family?.elderSisters ?? devUser.elderSisters ?? 0,
          elderSistersMarried: profile.family?.elderSistersMarried ?? devUser.elderSistersMarried ?? 0,
          youngerSisters: profile.family?.youngerSisters ?? devUser.youngerSisters ?? 0,
          youngerSistersMarried: profile.family?.youngerSistersMarried ?? devUser.youngerSistersMarried ?? 0,
          familyType: profile.family?.familyType || devUser.familyType || 'NUCLEAR',
          familyStatus: profile.family?.familyStatus || devUser.familyStatus || 'MIDDLE',
          familyValues: profile.family?.familyValues || devUser.familyValues || 'MODERATE',
        },
        biodataJson: (profile as any).biodataJson || JSON.stringify(buildCanonicalProfileJson(profile)),
        profileJson: (profile as any).biodataJson ? JSON.parse((profile as any).biodataJson) : buildCanonicalProfileJson(profile),
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
        },
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
          brothers: devUser?.brothers || 0,
          sisters: devUser?.sisters || 0,
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
          aboutPartner: devUser?.aboutPartner || '',
        },
        profileCompletionPercent: (devUser as any)?.profileCompletionPercent ?? (firstName ? 100 : 85),
        isVerified: true,
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

  async getProfileById(id: string) {
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
      },
    }).catch(() => null);

    if (!profile) throw new NotFoundException('Profile not found');
    const canonicalJson = (profile as any).biodataJson ? JSON.parse((profile as any).biodataJson) : buildCanonicalProfileJson(profile);
    return {
      ...profile,
      biodataJson: (profile as any).biodataJson || JSON.stringify(canonicalJson),
      profileJson: canonicalJson,
    };
  }

  async updateProfile(userId: string, data: any) {
    try {
      let existing = await this.prisma.profile.findUnique({ where: { userId } }).catch(() => null);

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
      if (data.religion) {
        let r = await this.prisma.religion.findFirst({
          where: { name: { contains: data.religion, mode: 'insensitive' } },
        }).catch(() => null);
        if (!r) {
          r = await this.prisma.religion.create({
            data: { name: data.religion },
          }).catch(() => null);
        }
        if (r) updateData.religionId = r.id;
      }
      if (data.community || data.caste) {
        const commName = data.community || data.caste;
        let c = await this.prisma.community.findFirst({
          where: { name: { contains: commName, mode: 'insensitive' } },
        }).catch(() => null);
        if (!c) {
          c = await this.prisma.community.create({
            data: { name: commName, slug: commName.toLowerCase().replace(/[^a-z0-9]/g, '-') },
          }).catch(() => null);
        }
        if (c) updateData.communityId = c.id;
      }
      if (data.subCaste || data.subcaste) {
        const subName = data.subCaste || data.subcaste;
        const sc = await this.prisma.subCaste.findFirst({
          where: { name: { contains: subName, mode: 'insensitive' } },
        }).catch(() => null);
        if (sc) updateData.subCasteId = sc.id;
      }

      if (data.birthOrder !== undefined && data.birthOrder !== null && data.birthOrder !== '') {
        updateData.birthOrder = Number(data.birthOrder);
      }
      if (data.residentStatus !== undefined) updateData.residentStatus = data.residentStatus;
      if (data.propertyDetails !== undefined) updateData.propertyDetails = data.propertyDetails;
      if (data.branch !== undefined) updateData.branch = data.branch;
      if (data.memberId !== undefined) updateData.memberId = data.memberId;

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
        if (data.star || data.starPadam || data.rasi || data.lagnam || data.gothram || data.kuladeivam || data.dosham || data.dasaBalance || data.timeOfBirth || data.placeOfBirth || data.horoscopeData) {
          const horoscopeJson = typeof data.horoscopeData === 'object'
            ? data.horoscopeData
            : {
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
        if (data.education || data.educationDegree || data.college || data.educationDetail) {
          await this.prisma.education.upsert({
            where: { profileId },
            create: {
              profileId,
              degree: data.educationDegree || data.education || null,
              college: data.college || data.educationDetail || null,
              fieldOfStudy: data.educationDetail || null,
            },
            update: {
              degree: (data.educationDegree || data.education) !== undefined ? (data.educationDegree || data.education) : undefined,
              college: (data.college || data.educationDetail) !== undefined ? (data.college || data.educationDetail) : undefined,
              fieldOfStudy: data.educationDetail !== undefined ? data.educationDetail : undefined,
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
          const eb = data.elderBrothers !== undefined ? Number(data.elderBrothers) : 0;
          const ebm = data.elderBrothersMarried !== undefined ? Number(data.elderBrothersMarried) : 0;
          const yb = data.youngerBrothers !== undefined ? Number(data.youngerBrothers) : 0;
          const ybm = data.youngerBrothersMarried !== undefined ? Number(data.youngerBrothersMarried) : 0;
          const es = data.elderSisters !== undefined ? Number(data.elderSisters) : 0;
          const esm = data.elderSistersMarried !== undefined ? Number(data.elderSistersMarried) : 0;
          const ys = data.youngerSisters !== undefined ? Number(data.youngerSisters) : 0;
          const ysm = data.youngerSistersMarried !== undefined ? Number(data.youngerSistersMarried) : 0;

          const totalBrothers = data.brothers !== undefined ? Number(data.brothers) : (eb + yb);
          const totalBrothersMarried = data.brothersMarried !== undefined ? Number(data.brothersMarried) : (ebm + ybm);
          const totalSisters = data.sisters !== undefined ? Number(data.sisters) : (es + ys);
          const totalSistersMarried = data.sistersMarried !== undefined ? Number(data.sistersMarried) : (esm + ysm);

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
          const aboutObj = JSON.stringify({
            religion: data.prefReligion || '',
            community: data.prefCommunity || data.prefCaste || '',
            education: data.prefEducation || '',
            location: data.prefLocation || '',
            about: data.aboutPartner || '',
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
              aboutPartner: aboutObj,
            },
            update: {
              gender: data.prefGender && ['MALE', 'FEMALE'].includes(data.prefGender) ? data.prefGender : undefined,
              ageMin: data.prefAgeMin ? Number(data.prefAgeMin) : undefined,
              ageMax: data.prefAgeMax ? Number(data.prefAgeMax) : undefined,
              heightMin: data.prefHeightMin ? Number(data.prefHeightMin) : undefined,
              heightMax: data.prefHeightMax ? Number(data.prefHeightMax) : undefined,
              aboutPartner: aboutObj,
            },
          }).catch(() => null);
        }
      }

      if (profileId) {
        const fullProfile = await this.prisma.profile.findUnique({
          where: { id: profileId },
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
            partnerPreference: true,
          },
        }).catch(() => null);

        if (fullProfile) {
          const canonicalJson = buildCanonicalProfileJson(fullProfile, data, 'PROFILE_UPDATE');
          await this.prisma.profile.update({
            where: { id: profileId },
            data: { biodataJson: JSON.stringify(canonicalJson) },
          }).catch(() => null);
        }
      }

      devStore.update(userId, { ...data, profileCompletionPercent: 100 });
      return this.getProfileByUserId(userId);
    } catch (err: any) {
      console.warn('Handling updateProfile (updating devStore):', err?.message || err);
      devStore.update(userId, { ...data, profileCompletionPercent: 100 });
      return this.getProfileByUserId(userId);
    }
  }

  async getDashboardStats(userId: string) {
    try {
      const profile = await this.prisma.profile.findUnique({ where: { userId } });

      const [profileViews, interestsSent, interestsReceived, interestsAccepted] = await Promise.all([
        this.prisma.profileView.count({ where: { ownerId: userId } }),
        this.prisma.interest.count({ where: { senderId: userId } }),
        this.prisma.interest.count({ where: { receiverId: userId } }),
        this.prisma.interest.count({ where: { receiverId: userId, status: 'ACCEPTED' } }),
      ]);

      return {
        profileViews,
        interestsSent,
        interestsReceived,
        interestsAccepted,
        profileCompletion: profile?.profileCompletionPercent ?? 85,
        isVerified: profile?.isVerified ?? true,
        membershipTier: 'FREE',
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
        where: { ownerId: userId },
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

  async deletePhoto(userId: string, photoId: string) {
    try {
      const profile = await this.prisma.profile.findUnique({ where: { userId } });
      if (profile) {
        await this.prisma.profilePhoto.deleteMany({
          where: {
            profileId: profile.id,
            OR: [{ id: photoId }, { url: photoId }],
          },
        });
      }

      const devUser = devStore.get(userId);
      if (devUser && (devUser as any).photos) {
        (devUser as any).photos = (devUser as any).photos.filter(
          (p: any) => p.id !== photoId && p.url !== photoId
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
          (p: any) => p.id !== photoId && p.url !== photoId
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
      where: { id: { in: profileIds } },
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
  // SAVE PARSED BIODATA PROFILE TO DB
  // ==========================================
  async saveParsedProfile(extractedData: any) {
    if (!extractedData) throw new BadRequestException('Extracted biodata JSON is required');

    const p = extractedData.profile || {};
    const edu = extractedData.education || {};
    const car = extractedData.career || {};
    const fam = extractedData.family || {};
    const con = extractedData.contact || {};

    const timestamp = Date.now();
    const email = (con.email && typeof con.email === 'string' && con.email.includes('@'))
      ? con.email.toLowerCase().trim()
      : `biodata_${timestamp}@s2smatrimony.com`;

    let phone = `+9199${timestamp.toString().slice(-8)}`;
    if (Array.isArray(con.mobile) && con.mobile[0]) {
      const cleaned = String(con.mobile[0]).replace(/\D/g, '');
      if (cleaned.length >= 10) {
        phone = cleaned.startsWith('91') && cleaned.length === 12 ? `+${cleaned}` : `+91${cleaned.slice(-10)}`;
      }
    }

    const firstName = p.first_name || (p.name ? String(p.name).split(' ')[0] : 'Member');
    const lastName = p.last_name || (p.name ? String(p.name).split(' ').slice(1).join(' ') : '') || 'S2S';
    const displayName = p.name || `${firstName} ${lastName}`.trim();

    let gender: Gender = Gender.MALE;
    if (p.gender) {
      const g = String(p.gender).toUpperCase();
      if (g.includes('FEMALE') || g.includes('WOMAN') || g.includes('BRIDE') || g.includes('GIRL')) {
        gender = Gender.FEMALE;
      }
    }

    let dob = new Date(2000, 0, 1);
    if (p.dob) {
      const parts = String(p.dob).split(/[-/]/);
      if (parts.length === 3) {
        if (parts[2].length === 4) {
          dob = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        } else if (parts[0].length === 4) {
          dob = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        }
      }
    } else if (p.birth_year) {
      dob = new Date(p.birth_year, (p.birth_month || 1) - 1, p.birth_day || 1);
    }

    const age = p.age || (new Date().getFullYear() - dob.getFullYear()) || 25;

    let heightCm: number | null = null;
    if (p.height) {
      const feetMatch = String(p.height).match(/(\d+)\s*(?:ft|feet|')\s*(\d+)?/i);
      if (feetMatch) {
        const feet = parseInt(feetMatch[1]);
        const inches = parseInt(feetMatch[2] || '0');
        heightCm = Math.round((feet * 12 + inches) * 2.54);
      } else {
        const cmMatch = String(p.height).match(/(\d+)\s*cm/i);
        if (cmMatch) heightCm = parseInt(cmMatch[1]);
      }
    }

    const hashedPassword = await bcrypt.hash('Password@123', 10);

    let user = await this.prisma.user.findFirst({
      where: { OR: [{ email }, { phone }] },
      include: { profile: true },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          phone,
          passwordHash: hashedPassword,
          isEmailVerified: true,
          isPhoneVerified: true,
          isActive: true,
        },
        include: { profile: true },
      });

      const memberRole = await this.prisma.role.findUnique({ where: { name: 'MEMBER' } });
      if (memberRole) {
        await this.prisma.userRole.create({
          data: { userId: user.id, roleId: memberRole.id },
        });
      }
    }

    let profile = await this.prisma.profile.findUnique({
      where: { userId: user.id },
    });

    const profileData: any = {
      userId: user.id,
      firstName,
      lastName,
      displayName,
      gender,
      dateOfBirth: dob,
      age,
      heightCm,
      motherTongue: p.mother_tongue || 'Tamil',
      gothram: p.gothram || null,
      status: 'ACTIVE',
      isVerified: true,
      verificationStatus: 'VERIFIED',
      profileCompletionPercent: 90,
      about: `Parsed AI Biodata profile for ${displayName}. ${p.caste ? 'Caste: ' + p.caste : ''} ${p.rasi ? 'Rasi: ' + p.rasi : ''}`,
    };

    if (profile) {
      profile = await this.prisma.profile.update({
        where: { id: profile.id },
        data: profileData,
      });
    } else {
      profile = await this.prisma.profile.create({
        data: profileData,
      });
    }

    if (edu.highest_qualification || (edu.degree && edu.degree.length > 0) || edu.college) {
      await this.prisma.education.upsert({
        where: { profileId: profile.id },
        create: {
          profileId: profile.id,
          degree: Array.isArray(edu.degree) ? edu.degree.join(', ') : (edu.highest_qualification || 'Bachelor Degree'),
          college: edu.college || edu.university || 'University',
        },
        update: {
          degree: Array.isArray(edu.degree) ? edu.degree.join(', ') : (edu.highest_qualification || 'Bachelor Degree'),
          college: edu.college || edu.university || 'University',
        },
      });
    }

    if (car.occupation || car.designation || car.company) {
      await this.prisma.occupation.upsert({
        where: { profileId: profile.id },
        create: {
          profileId: profile.id,
          designation: car.designation || car.occupation || 'Engineer',
          company: car.company || 'Private Firm',
          workingLocation: car.work_location || 'Tamil Nadu',
        },
        update: {
          designation: car.designation || car.occupation || 'Engineer',
          company: car.company || 'Private Firm',
          workingLocation: car.work_location || 'Tamil Nadu',
        },
      });
    }

    if (fam.father_name || fam.mother_name) {
      await this.prisma.familyDetail.upsert({
        where: { profileId: profile.id },
        create: {
          profileId: profile.id,
          fatherName: fam.father_name || null,
          fatherOccupation: fam.father_occupation || null,
          motherName: fam.mother_name || null,
          motherOccupation: fam.mother_occupation || null,
        },
        update: {
          fatherName: fam.father_name || null,
          fatherOccupation: fam.father_occupation || null,
          motherName: fam.mother_name || null,
          motherOccupation: fam.mother_occupation || null,
        },
      });
    }

    if (p.rasi || p.star || p.nakshatra || p.gothram) {
      await this.prisma.horoscope.upsert({
        where: { profileId: profile.id },
        create: {
          profileId: profile.id,
          rasi: p.rasi || null,
          star: p.star || p.nakshatra || null,
          gothram: p.gothram || null,
          dosham: p.dosham || p.chevvai || null,
          birthPlace: p.birth_place || null,
          birthTime: p.birth_time || null,
        },
        update: {
          rasi: p.rasi || null,
          star: p.star || p.nakshatra || null,
          gothram: p.gothram || null,
          dosham: p.dosham || p.chevvai || null,
          birthPlace: p.birth_place || null,
          birthTime: p.birth_time || null,
        },
      });
    }

    const profilePhoto = extractedData.profile_photo || p?.profile_photo || extractedData.profile_photo_url || extractedData.images?.profile_photo;
    if (profilePhoto) {
      await this.prisma.profilePhoto.create({
        data: {
          profileId: profile.id,
          url: profilePhoto,
          isMain: true,
          status: 'APPROVED',
        },
      }).catch(() => null);
    }

    const fullProfile = await this.prisma.profile.findUnique({
      where: { id: profile.id },
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
        partnerPreference: true,
      },
    }).catch(() => null);

    const canonicalJson = buildCanonicalProfileJson(fullProfile || profile, extractedData, 'AI_OCR');
    await this.prisma.profile.update({
      where: { id: profile.id },
      data: { biodataJson: JSON.stringify(canonicalJson) },
    }).catch(() => null);

    return {
      success: true,
      message: 'Parsed AI Biodata successfully saved to Database!',
      profileId: profile.id,
      userId: user.id,
      displayName: profile.displayName,
      email: user.email,
      phone: user.phone,
      profileJson: canonicalJson,
    };
  }
}
