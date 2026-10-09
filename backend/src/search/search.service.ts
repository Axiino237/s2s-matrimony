import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { devStore } from '../common/dev-store';
import { EliteQualificationService } from '../common/elite-qualification.service';

@Injectable()
export class SearchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eliteQualService: EliteQualificationService,
  ) {}

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
      status: 'ACTIVE',
      isVerified: true,
      verificationStatus: 'VERIFIED',
      // Mandatory visibility criteria for other members:
      // Account status must be Active (isActive: true, deletedAt: null)
      user: {
        isActive: true,
        deletedAt: null,
        userRoles: {
          none: {
            role: {
              name: { in: ['ADMIN', 'SUPER_ADMIN'] },
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

    const threshold = await this.eliteQualService.getEliteThreshold();
    const viewerCategory = await this.eliteQualService.getViewerCategory(excludeUserId, threshold);
    const viewerStatus = await this.eliteQualService.getViewerStatus(excludeUserId, threshold);

    // Backend Category Visibility Enforcement at Query Level:
    // 1. General viewer -> General targets only
    // 2. Elite viewer -> Elite targets only
    if (viewerCategory === 'GENERAL') {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { netWorth: null },
            { netWorth: { lt: threshold } },
          ],
        },
        {
          OR: [
            { membership: null },
            {
              membership: {
                plan: {
                  category: { not: 'ELITE' },
                  id: { notIn: ['elite-plan-silver', 'elite-plan-gold', 'elite-plan-platinum'] },
                },
              },
            },
          ],
        },
      ];
    } else {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { netWorth: { gte: threshold } },
            {
              membership: {
                plan: {
                  OR: [
                    { category: 'ELITE' },
                    { id: { in: ['elite-plan-silver', 'elite-plan-gold', 'elite-plan-platinum'] } },
                  ],
                },
              },
            },
          ],
        },
      ];
    }

    let myProfile: any = null;
    if (excludeUserId) {
      myProfile = await this.prisma.profile.findFirst({
        where: { userId: excludeUserId },
        include: { partnerPreference: true },
      }).catch(() => null);
    }

    // Gender filter:
    // 1. If explicitly 'MALE' or 'FEMALE': filter strictly by that gender
    // 2. If 'ALL', 'ANY', 'BOTH': show both Bride and Groom members (do not filter where.gender)
    // 3. Only default to partner preference or opposite gender if usePartnerPref is explicitly requested (e.g. /matches)
    const genderUpper = (query.gender || '').toUpperCase().trim();
    if (genderUpper === 'MALE' || genderUpper === 'FEMALE') {
      where.gender = genderUpper;
    } else if (genderUpper === 'ALL' || genderUpper === 'ANY' || genderUpper === 'BOTH') {
      // Explicitly show both Bride and Groom — do not set where.gender
    } else if (myProfile) {
      const prefGender = myProfile.partnerPreference?.gender;
      if (prefGender && ['MALE', 'FEMALE'].includes(prefGender) && prefGender !== myProfile.gender) {
        where.gender = prefGender;
      } else if (myProfile.gender === 'MALE') {
        where.gender = 'FEMALE';
      } else if (myProfile.gender === 'FEMALE') {
        where.gender = 'MALE';
      }
    }

    // Automatically apply Partner Preference filters if usePartnerPref is requested AND not in Recommended mode
    // (In Recommended mode, partner preferences are scored dynamically via calculateMatchScore to avoid hard exclusion)
    const isRecommendedMode = !query.tab || String(query.tab).toLowerCase().trim() === 'recommended';
    if ((query as any).usePartnerPref && myProfile?.partnerPreference && !isRecommendedMode) {
      const pref = myProfile.partnerPreference;
      if (pref.ageMin && pref.ageMax) {
        where.age = { gte: pref.ageMin, lte: pref.ageMax };
      }
      if (pref.heightMin && pref.heightMax) {
        where.heightCm = { gte: pref.heightMin, lte: pref.heightMax };
      }
      if (!query.maritalStatus && pref.maritalStatus && pref.maritalStatus.length > 0) {
        where.maritalStatus = { in: pref.maritalStatus };
      }
    }

    // Community filter
    if (query.communityId && query.communityId !== '' && query.communityId !== 'ANY') {
      where.communityId = query.communityId;
    } else if (query.community && query.community !== '' && query.community !== 'ANY' && query.community !== 'All') {
      if (!where.AND) where.AND = [];
      where.AND.push({
        OR: [
          { communityId: query.community },
          { community: { name: { contains: query.community, mode: 'insensitive' } } },
          { community: { slug: { contains: query.community.toLowerCase(), mode: 'insensitive' } } },
        ],
      });
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
      if (!where.AND) where.AND = [];
      where.AND.push({
        occupation: {
          OR: [
            { designation: { contains: query.occupation, mode: 'insensitive' } },
            { company: { contains: query.occupation, mode: 'insensitive' } },
          ],
        },
      });
    }

    // Salary / Annual Income filter
    const salaryQuery = (query as any).salary || (query as any).salaryMin || (query as any).minSalary;
    if (salaryQuery && salaryQuery !== '' && salaryQuery !== 'ANY' && salaryQuery !== 'All') {
      let minSalaryNum: number | null = null;
      if (typeof salaryQuery === 'number') {
        minSalaryNum = salaryQuery;
      } else {
        const rawStr = String(salaryQuery).trim();
        const lpaMatch = rawStr.match(/(\d+(?:\.\d+)?)\s*lpa/i);
        if (lpaMatch) {
          minSalaryNum = Math.round(parseFloat(lpaMatch[1]) * 100000);
        } else {
          const lakhMatch = rawStr.match(/(\d+(?:\.\d+)?)\s*lakh/i);
          if (lakhMatch) {
            minSalaryNum = Math.round(parseFloat(lakhMatch[1]) * 100000);
          } else {
            const parsed = parseInt(rawStr.replace(/[^0-9]/g, ''), 10);
            if (!isNaN(parsed) && parsed > 0) {
              minSalaryNum = parsed < 100 ? parsed * 100000 : parsed;
            }
          }
        }
      }

      if (minSalaryNum !== null && minSalaryNum > 0) {
        if (!where.AND) where.AND = [];
        where.AND.push({
          occupation: {
            OR: [
              { salaryMin: { gte: minSalaryNum } },
              { salaryMax: { gte: minSalaryNum } },
            ],
          },
        });
      }
    }

    // Country filter
    if ((query as any).country && (query as any).country !== '' && (query as any).country !== 'ANY' && (query as any).country !== 'All') {
      const c = String((query as any).country).trim();
      const isIndia = c.toLowerCase() === 'india' || c.toUpperCase() === 'IN';
      const countryCondition: any[] = [
        { country: { name: { contains: c, mode: 'insensitive' } } },
        { country: { code: { equals: c, mode: 'insensitive' } } },
      ];
      if (c.toUpperCase() === 'USA') {
        countryCondition.push({ country: { name: { contains: 'United States', mode: 'insensitive' } } });
        countryCondition.push({ country: { code: 'US' } });
      } else if (c.toUpperCase() === 'UK') {
        countryCondition.push({ country: { name: { contains: 'United Kingdom', mode: 'insensitive' } } });
        countryCondition.push({ country: { code: 'GB' } });
      }
      if (isIndia) {
        countryCondition.push({ countryId: null });
      }
      if (!where.AND) where.AND = [];
      where.AND.push({ OR: countryCondition });
    }

    // State filter
    if ((query as any).state && (query as any).state !== '' && (query as any).state !== 'ANY' && (query as any).state !== 'All') {
      const s = String((query as any).state).trim();
      const stateCondition: any[] = [
        { state: { name: { contains: s, mode: 'insensitive' } } },
        { city: { name: { contains: s, mode: 'insensitive' } } },
        { family: { nativePlace: { contains: s, mode: 'insensitive' } } },
        { occupation: { workingLocation: { contains: s, mode: 'insensitive' } } },
      ];
      if (!where.AND) where.AND = [];
      where.AND.push({ OR: stateCondition });
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
          { dosham: { contains: 'no dosham', mode: 'insensitive' } },
          { dosham: '' },
        ],
      };
    }

    // Enforce profile verification & active criteria
    where.isVerified = true;
    where.verificationStatus = 'VERIFIED';
    where.status = 'ACTIVE';

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
            state: true,
            country: true,
            family: true,
            membership: { include: { plan: true } },
          },
          orderBy,
        }),
        this.prisma.profile.count({ where }),
      ]);

      if (profiles && profiles.length > 0) {
        let profilesWithScores = profiles
          .map((p) => {
            const targetEval = this.eliteQualService.evaluateProfile(p, threshold);
            if (targetEval.membershipCategory !== viewerCategory) {
              return null;
            }

            const plain = JSON.parse(JSON.stringify(p));
            delete plain.assetValue;
            delete plain.bankBalance;
            delete plain.netWorth;
            const plan = p.membership?.plan;
            const features: string[] = Array.isArray(plan?.features) ? (plan.features as string[]) : [];
            const hasHighlight = (plan as any)?.hasProfileHighlight || features.some((f) => String(f).toLowerCase().includes('highlight') || String(f).toLowerCase().includes('priority'));
            const isPremium = Boolean(
              p.membership &&
              p.membership.isActive &&
              p.membership.tier !== 'FREE' &&
              (!p.membership.endDate || new Date(p.membership.endDate) >= new Date())
            );
            const membershipTier = isPremium ? p.membership?.tier : 'FREE';
            return {
              ...plain,
              membershipCategory: targetEval.membershipCategory,
              isElite: targetEval.isElite,
              isEliteQualified: targetEval.isQualified,
              eliteStatus: targetEval.eliteStatus,
              isPremium,
              membershipTier,
              matchScore: this.calculateMatchScore(p, myProfile),
            };
          })
          .filter(Boolean) as any[];

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

    // devStore fallback — filter out admin-named users and enforce visibility criteria
    const ADMIN_NAMES = ['super admin', 'system admin', 'admin'];
    const devUsers = devStore.getAll()
      .filter((u) => {
        const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase().trim();
        const isAdmin = ADMIN_NAMES.some((a) => fullName.includes(a));
        const isCurrentUser = excludeUserId && u.id === excludeUserId;
        const isAccountActive = u.isActive !== false && !u.isSuspended;
        const isProfileVerified = (u.isVerified === true || u.verificationStatus === 'VERIFIED');
        return !isAdmin && !isCurrentUser && isAccountActive && isProfileVerified;
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
      isVerified: Boolean(u.isVerified),
      isPremium: Boolean(u.isPremium),
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

  async getCountries() {
    try {
      const countries = await this.prisma.country.findMany({
        where: { isActive: true },
        select: { id: true, name: true, code: true, flag: true },
        orderBy: { name: 'asc' },
      });
      if (countries && countries.length > 0) {
        return countries;
      }
    } catch (e) {
      console.error('Error fetching countries from database:', e);
    }
    // Fallback list of standard countries
    return [
      { id: 'in', name: 'India', code: 'IN', flag: '🇮🇳' },
      { id: 'us', name: 'United States', code: 'US', flag: '🇺🇸' },
      { id: 'ae', name: 'United Arab Emirates', code: 'AE', flag: '🇦🇪' },
      { id: 'sg', name: 'Singapore', code: 'SG', flag: '🇸🇬' },
      { id: 'my', name: 'Malaysia', code: 'MY', flag: '🇲🇾' },
      { id: 'uk', name: 'United Kingdom', code: 'GB', flag: '🇬🇧' },
      { id: 'ca', name: 'Canada', code: 'CA', flag: '🇨🇦' },
      { id: 'au', name: 'Australia', code: 'AU', flag: '🇦🇺' },
    ];
  }

  async getStates(countryFilter?: string) {
    try {
      const where: any = { isActive: true };

      if (countryFilter && countryFilter !== 'ANY' && countryFilter !== 'All') {
        const countryTerm = countryFilter.trim();
        where.country = {
          OR: [
            { id: countryTerm },
            { code: { equals: countryTerm, mode: 'insensitive' } },
            { name: { contains: countryTerm, mode: 'insensitive' } },
            ...(countryTerm.toUpperCase() === 'USA' ? [{ code: 'US' }, { name: { contains: 'United States', mode: 'insensitive' } }] : []),
            ...(countryTerm.toUpperCase() === 'UK' ? [{ code: 'GB' }, { name: { contains: 'United Kingdom', mode: 'insensitive' } }] : []),
            ...(countryTerm.toUpperCase() === 'UAE' ? [{ code: 'AE' }, { name: { contains: 'Emirates', mode: 'insensitive' } }] : []),
          ],
        };
      }

      const states = await this.prisma.state.findMany({
        where,
        select: {
          id: true,
          name: true,
          countryId: true,
          country: {
            select: { id: true, name: true, code: true },
          },
        },
        orderBy: { name: 'asc' },
      });

      if (states && states.length > 0) {
        return states;
      }
    } catch (e) {
      console.error('Error fetching states from database:', e);
    }

    // Default / fallback states if database empty or error
    return [
      { id: 'tn', name: 'Tamil Nadu', countryId: 'in', country: { name: 'India', code: 'IN' } },
      { id: 'kl', name: 'Kerala', countryId: 'in', country: { name: 'India', code: 'IN' } },
      { id: 'ka', name: 'Karnataka', countryId: 'in', country: { name: 'India', code: 'IN' } },
      { id: 'ap', name: 'Andhra Pradesh', countryId: 'in', country: { name: 'India', code: 'IN' } },
      { id: 'ts', name: 'Telangana', countryId: 'in', country: { name: 'India', code: 'IN' } },
      { id: 'mh', name: 'Maharashtra', countryId: 'in', country: { name: 'India', code: 'IN' } },
    ];
  }
}

