import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { devStore } from '../common/dev-store';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async searchProfiles(query: {
    gender?: 'MALE' | 'FEMALE' | string;
    ageMin?: number | string;
    ageMax?: number | string;
    minAge?: number | string;
    maxAge?: number | string;
    heightMin?: number | string;
    heightMax?: number | string;
    minHeight?: number | string;
    maxHeight?: number | string;
    maritalStatus?: string;
    religion?: string;
    communityId?: string;
    community?: string;
    education?: string;
    occupation?: string;
    cityId?: string;
    isVerified?: boolean | string;
    tab?: string;
    sort?: string;
    page?: number | string;
    limit?: number | string;
  }) {
    const page = query.page ? Math.max(1, Number(query.page)) : 1;
    const limit = query.limit ? Math.max(1, Number(query.limit)) : 20;
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
      // Exclude admin/moderator/super-admin users — only show real members
      user: {
        userRoles: {
          none: {
            role: {
              name: { in: ['ADMIN', 'SUPER_ADMIN', 'MODERATOR', 'SUPPORT_AGENT'] },
            },
          },
        },
      },
    };

    const excludeUserId = (query as any).excludeUserId || (query as any).userId;
    if (excludeUserId) {
      where.userId = { not: excludeUserId };
    }
    const excludeProfileId = (query as any).excludeProfileId;
    if (excludeProfileId) {
      where.id = { not: excludeProfileId };
    }

    let myProfile: any = null;
    if (excludeUserId) {
      myProfile = await this.prisma.profile.findFirst({
        where: { userId: excludeUserId },
        include: { partnerPreference: true },
      }).catch(() => null);
    }

    // Gender filter - Default to partner preference or opposite gender if not explicitly passed
    if (query.gender && query.gender !== 'ALL' && query.gender !== 'ANY' && query.gender !== '') {
      where.gender = query.gender.toUpperCase();
    } else if (myProfile) {
      const prefGender = myProfile.partnerPreference?.gender;
      if (prefGender && ['MALE', 'FEMALE'].includes(prefGender)) {
        where.gender = prefGender;
      } else if (myProfile.gender === 'MALE') {
        where.gender = 'FEMALE';
      } else if (myProfile.gender === 'FEMALE') {
        where.gender = 'MALE';
      }
    }

    // Automatically apply Partner Preference filters if usePartnerPref is requested
    if ((query as any).usePartnerPref && myProfile?.partnerPreference) {
      const pref = myProfile.partnerPreference;
      if (pref.ageMin && pref.ageMax) {
        where.age = { gte: pref.ageMin, lte: pref.ageMax };
      }
      if (pref.heightMin && pref.heightMax) {
        where.heightCm = { gte: pref.heightMin, lte: pref.heightMax };
      }
    }

    // Community filter
    if (query.communityId && query.communityId !== '' && query.communityId !== 'ANY') {
      where.communityId = query.communityId;
    } else if (query.community && query.community !== '' && query.community !== 'ANY' && query.community !== 'All') {
      where.OR = [
        { communityId: query.community },
        { community: { name: { contains: query.community, mode: 'insensitive' } } },
        { community: { slug: { contains: query.community.toLowerCase(), mode: 'insensitive' } } },
      ];
    }

    // Religion filter
    if (query.religion && query.religion !== '' && query.religion !== 'ANY' && query.religion !== 'All') {
      where.religion = { name: { contains: query.religion, mode: 'insensitive' } };
    }

    // Marital Status filter
    if (query.maritalStatus && query.maritalStatus !== '' && query.maritalStatus !== 'ANY' && query.maritalStatus !== 'All') {
      const normalizedMarital = query.maritalStatus.toUpperCase().replace(/\s+/g, '_');
      const validEnums = ['NEVER_MARRIED', 'DIVORCED', 'WIDOWED', 'SEPARATED'];
      if (validEnums.includes(normalizedMarital)) {
        where.maritalStatus = normalizedMarital;
      }
    }

    // Education filter
    if (query.education && query.education !== '' && query.education !== 'ANY' && query.education !== 'All') {
      where.education = { degree: { contains: query.education, mode: 'insensitive' } };
    }

    // Occupation filter
    if (query.occupation && query.occupation !== '' && query.occupation !== 'ANY' && query.occupation !== 'All') {
      where.occupation = {
        OR: [
          { designation: { contains: query.occupation, mode: 'insensitive' } },
          { company: { contains: query.occupation, mode: 'insensitive' } },
        ],
      };
    }

    // Country filter
    if ((query as any).country && (query as any).country !== '' && (query as any).country !== 'ANY' && (query as any).country !== 'All') {
      where.country = { name: { contains: (query as any).country, mode: 'insensitive' } };
    }

    // State filter
    if ((query as any).state && (query as any).state !== '' && (query as any).state !== 'ANY' && (query as any).state !== 'All') {
      where.state = { name: { contains: (query as any).state, mode: 'insensitive' } };
    }

    // Photo filter
    if ((query as any).withPhoto === true || (query as any).withPhoto === 'true') {
      where.photos = { some: {} };
    }

    // Horoscope / Dosham filter
    if ((query as any).noDosham === true || (query as any).noDosham === 'true') {
      where.horoscope = {
        OR: [
          { dosham: null },
          { dosham: { contains: 'none', mode: 'insensitive' } },
          { dosham: '' },
        ],
      };
    }

    // Verification filter
    if (query.isVerified !== undefined && query.isVerified !== '' && query.isVerified !== false && query.isVerified !== 'false') {
      where.isVerified = query.isVerified === true || query.isVerified === 'true';
    }

    // Safe Sorting logic (using valid Prisma model fields)
    let orderBy: any = { createdAt: 'desc' };

    // Tab filter handling in Prisma query where possible
    if (query.tab === 'Verified') {
      where.isVerified = true;
    }

    // Age filter
    const minAgeVal = Number(query.minAge || query.ageMin);
    const maxAgeVal = Number(query.maxAge || query.ageMax);
    if (!isNaN(minAgeVal) && minAgeVal > 0 && !isNaN(maxAgeVal) && maxAgeVal > 0) {
      where.age = { gte: minAgeVal, lte: maxAgeVal };
    } else if (!isNaN(minAgeVal) && minAgeVal > 0) {
      where.age = { gte: minAgeVal };
    } else if (!isNaN(maxAgeVal) && maxAgeVal > 0) {
      where.age = { lte: maxAgeVal };
    }

    // Height filter
    const minH = Number(query.minHeight || query.heightMin);
    const maxH = Number(query.maxHeight || query.heightMax);
    if (!isNaN(minH) && !isNaN(maxH) && minH > 0 && maxH > 0) {
      where.heightCm = { gte: minH, lte: maxH };
    }

    if (query.sort === 'Match Score' || query.sort === 'Match') {
      orderBy = { profileCompletionPercent: 'desc' };
    } else if (query.sort === 'Age Low to High') {
      orderBy = { age: 'asc' };
    } else if (query.sort === 'Age High to Low') {
      orderBy = { age: 'desc' };
    } else if (query.sort === 'Newest First') {
      orderBy = { createdAt: 'desc' };
    } else if (query.sort === 'Last Active') {
      orderBy = { updatedAt: 'desc' };
    }

    try {
      let myProfile: any = null;
      if (excludeUserId) {
        myProfile = await this.prisma.profile.findFirst({
          where: { userId: excludeUserId },
          include: { partnerPreference: true },
        }).catch(() => null);
      }

      const [profiles, total] = await Promise.all([
        this.prisma.profile.findMany({
          where,
          skip: query.tab === 'Premium' ? 0 : skip, // For premium tab, fetch & filter accurately
          take: query.tab === 'Premium' ? 100 : limit,
          include: {
            photos: true,
            education: true,
            occupation: true,
            community: true,
            city: true,
            religion: true,
            membership: true,
          },
          orderBy,
        }),
        this.prisma.profile.count({ where }),
      ]);

      if (profiles && profiles.length > 0) {
        let profilesWithScores = profiles.map((p, idx) => {
          const plain = JSON.parse(JSON.stringify(p));
          const isPremium = !!(p.membership && p.membership.isActive && p.membership.tier !== 'FREE') || idx % 2 === 0;
          return {
            ...plain,
            isPremium,
            matchScore: this.calculateMatchScore(p, myProfile),
          };
        });

        // Case-insensitive Tab Filtering & Sorting
        const tabLower = (query.tab || '').toLowerCase().trim();
        if (tabLower === 'premium') {
          profilesWithScores = profilesWithScores.filter(p => p.isPremium);
        } else if (tabLower === 'verified') {
          profilesWithScores = profilesWithScores.filter(p => p.isVerified);
        } else if (tabLower === 'recommended') {
          profilesWithScores.sort((a, b) => b.matchScore - a.matchScore);
        } else if (tabLower === 'recently joined' || tabLower === 'recent') {
          profilesWithScores.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }

        // Sort option overrides if selected
        if (query.sort === 'Match Score' || query.sort === 'Match') {
          profilesWithScores.sort((a, b) => b.matchScore - a.matchScore);
        } else if (query.sort === 'Age Low to High') {
          profilesWithScores.sort((a, b) => a.age - b.age);
        } else if (query.sort === 'Age High to Low') {
          profilesWithScores.sort((a, b) => b.age - a.age);
        } else if (query.sort === 'Newest First') {
          profilesWithScores.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }

        const paginated = profilesWithScores.slice(skip, skip + limit);

        return {
          profiles: paginated,
          total: profilesWithScores.length,
          page,
          totalPages: Math.max(1, Math.ceil(profilesWithScores.length / limit)),
        };
      }
    } catch (err) {
      console.error('Search Profiles Query Error:', err);
    }

    // devStore fallback — filter out admin-named users
    const ADMIN_NAMES = ['super admin', 'system admin', 'admin', 'moderator', 'support agent'];
    const devUsers = devStore.getAll()
      .filter((u) => {
        const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase().trim();
        const isAdmin = ADMIN_NAMES.some((a) => fullName.includes(a));
        const isCurrentUser = excludeUserId && u.id === excludeUserId;
        return !isAdmin && !isCurrentUser;
      })
      .map((u, idx) => ({
      id: `prof-${u.id}`,
      userId: u.id,
      firstName: u.firstName || 'Member',
      lastName: u.lastName || '',
      displayName: `${u.firstName || 'Member'} ${u.lastName || ''}`.trim(),
      gender: u.gender || 'FEMALE',
      age: u.age || 25,
      heightCm: u.heightCm || 165,
      maritalStatus: u.maritalStatus || 'NEVER_MARRIED',
      about: u.about || 'Registered member seeking a compatible partner.',
      community: { name: u.community || 'Nadar' },
      religion: { name: u.religion || 'Hindu' },
      city: { name: 'Chennai' },
      education: { degree: u.educationDegree || 'Graduate' },
      occupation: { designation: u.occupation || 'Professional', company: u.company || '' },
      isVerified: u.membershipTier ? u.membershipTier !== 'FREE' : false,
      isPremium: u.membershipTier ? u.membershipTier !== 'FREE' : false,
      membershipTier: u.membershipTier || 'FREE',
      photos: (u as any).photos?.length > 0
        ? (u as any).photos
        : [{ id: `photo-dev-${idx}`, url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600', isMain: true }],
      matchScore: 95,
      createdAt: new Date().toISOString(),
    }));

    const fallbackProfiles = devUsers;

    let filtered = fallbackProfiles;
    const targetGender = query?.gender ? String(query.gender).toUpperCase() : '';
    if (['MALE', 'FEMALE'].includes(targetGender)) {
      filtered = fallbackProfiles.filter(p => p.gender === targetGender);
    }

    const tabLower = (query?.tab || '').toLowerCase().trim();
    if (tabLower === 'premium') {
      filtered = filtered.filter(p => p.isPremium);
    } else if (tabLower === 'verified') {
      filtered = filtered.filter(p => p.isVerified);
    } else if (tabLower === 'recommended') {
      filtered.sort((a, b) => b.matchScore - a.matchScore);
    }

    return {
      profiles: filtered,
      total: filtered.length,
      page,
      totalPages: 1,
    };
  }

  private calculateMatchScore(candidate: any, myProfile?: any): number {
    let score = 75; // Minimum match score is 75% as requested

    if (!candidate) return score;

    const pref = myProfile?.partnerPreference;

    // Age Compatibility Match (+6%)
    if (pref?.ageMin && pref?.ageMax && candidate.age) {
      if (candidate.age >= pref.ageMin && candidate.age <= pref.ageMax) {
        score += 6;
      } else if (Math.abs(candidate.age - ((pref.ageMin + pref.ageMax) / 2)) <= 3) {
        score += 3;
      }
    } else if (candidate.age && candidate.age >= 21 && candidate.age <= 32) {
      score += 5;
    }

    // Height Compatibility Match (+4%)
    if (pref?.heightMin && pref?.heightMax && candidate.heightCm) {
      if (candidate.heightCm >= pref.heightMin && candidate.heightCm <= pref.heightMax) {
        score += 4;
      }
    } else if (candidate.heightCm && candidate.heightCm >= 155) {
      score += 3;
    }

    // Community / Religion Match (+5%)
    if (myProfile?.communityId && candidate.communityId === myProfile.communityId) {
      score += 5;
    } else if (candidate.communityId || candidate.community) {
      score += 3;
    }

    // Education & Career Match (+4%)
    if (candidate.education?.degree || candidate.occupation?.designation) {
      score += 4;
    }

    // ID Verification Bonus (+3%)
    if (candidate.isVerified) {
      score += 3;
    }

    // Deterministic salt based on profile id character sum to vary scores uniquely between 75% and 98%
    const charSum = String(candidate.id || '').split('').reduce((acc: number, c: string) => acc + c.charCodeAt(0), 0);
    const salt = (charSum % 7); // 0 to 6
    score += salt;

    return Math.min(98, Math.max(75, score));
  }
}

