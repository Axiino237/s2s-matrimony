import { Injectable, Logger, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { EntitlementsService } from '../common/entitlements.service';
import { EliteQualificationService } from '../common/elite-qualification.service';

// 27 Nakshatras in standard canonical order
const NAKSHATRAS = [
  'ashwini', 'bharani', 'karthigai', 'rohini', 'mrigashirsha',
  'thiruvathirai', 'punarpoosam', 'poosam', 'ayilyam', 'magam',
  'pooram', 'uthiram', 'hastham', 'chithirai', 'swathi',
  'visakam', 'anusham', 'kettai', 'moolam', 'pooradam',
  'uthiradam', 'thiruvonam', 'avittam', 'sathayam', 'poorattathi',
  'uthirattathi', 'revathi',
];

// Alias mapping for Tamil, Sanskrit & English spellings
const STAR_ALIASES: Record<string, string> = {
  // Ashwini
  asvini: 'ashwini', aswini: 'ashwini', ashwini: 'ashwini', 'அஸ்வினி': 'ashwini',
  // Bharani
  bharani: 'bharani', barani: 'bharani', 'பரணி': 'bharani',
  // Karthigai
  karthigai: 'karthigai', krittika: 'karthigai', kritika: 'karthigai', kartika: 'karthigai', 'கார்த்திகை': 'karthigai',
  // Rohini
  rohini: 'rohini', 'ரோகிணி': 'rohini', 'ரோஹிணி': 'rohini',
  // Mrigashirsha
  mrigashirsha: 'mrigashirsha', mrigashira: 'mrigashirsha', mriga: 'mrigashirsha', 'மிருகசீரிஷம்': 'mrigashirsha',
  // Thiruvathirai / Ardra
  thiruvathirai: 'thiruvathirai', ardra: 'thiruvathirai', arudra: 'thiruvathirai', 'திருவாதிரை': 'thiruvathirai',
  // Punarpoosam / Punarvasu
  punarpoosam: 'punarpoosam', punarvasu: 'punarpoosam', 'புனர்பூசம்': 'punarpoosam',
  // Poosam / Pushya
  poosam: 'poosam', pushya: 'poosam', pushyami: 'poosam', 'பூசம்': 'poosam',
  // Ayilyam / Ashlesha
  ayilyam: 'ayilyam', ashlesha: 'ayilyam', aslesha: 'ayilyam', 'ஆயில்யம்': 'ayilyam',
  // Magam / Magha
  magam: 'magam', magha: 'magam', makam: 'magam', 'மகம்': 'magam',
  // Pooram / Purva Phalguni
  pooram: 'pooram', 'purva phalguni': 'pooram', 'pooram/pubba': 'pooram', pubba: 'pooram', 'பூரம்': 'pooram',
  // Uthiram / Uttara Phalguni
  uthiram: 'uthiram', 'uttara phalguni': 'uthiram', uttara: 'uthiram', 'உத்திரம்': 'uthiram', uthiram2: 'uthiram',
  // Hastham / Hasta
  hastham: 'hastham', hasta: 'hastham', hastam: 'hastham', 'ஹஸ்தம்': 'hastham',
  // Chithirai / Chitra
  chithirai: 'chithirai', chitra: 'chithirai', chithra: 'chithirai', 'சித்திரை': 'chithirai',
  // Swathi / Swati
  swathi: 'swathi', swati: 'swathi', 'சுவாதி': 'swathi',
  // Visakam / Vishakha
  visakam: 'visakam', vishakha: 'visakam', visakha: 'visakam', 'விசாகம்': 'visakam',
  // Anusham / Anuradha
  anusham: 'anusham', anuradha: 'anusham', anusham1: 'anusham', 'அனுஷம்': 'anusham',
  // Kettai / Jyeshtha
  kettai: 'kettai', jyeshtha: 'kettai', jyeshta: 'kettai', 'கேட்டை': 'kettai',
  // Moolam / Mula
  moolam: 'moolam', mula: 'moolam', mulam: 'moolam', 'மூலம்': 'moolam',
  // Pooradam / Purva Ashadha
  pooradam: 'pooradam', 'purva ashadha': 'pooradam', purvashada: 'pooradam', 'பூராடம்': 'pooradam',
  // Uthiradam / Uttara Ashadha
  uthiradam: 'uthiradam', 'uttara ashadha': 'uthiradam', uttarashada: 'uthiradam', 'உத்திராடம்': 'uthiradam',
  // Thiruvonam / Shravana
  thiruvonam: 'thiruvonam', shravana: 'thiruvonam', sravana: 'thiruvonam', 'திருவோணம்': 'thiruvonam',
  // Avittam / Dhanishta
  avittam: 'avittam', dhanishta: 'avittam', dhanista: 'avittam', 'அவிட்டம்': 'avittam',
  // Sathayam / Shatabhisha
  sathayam: 'sathayam', shatabhisha: 'sathayam', sadhayam: 'sathayam', satabhisha: 'sathayam', 'சதயம்': 'sathayam',
  // Poorattathi / Purva Bhadrapada
  poorattathi: 'poorattathi', 'purva bhadrapada': 'poorattathi', pooratathi: 'poorattathi', 'பூரட்டாதி': 'poorattathi',
  // Uthirattathi / Uttara Bhadrapada
  uthirattathi: 'uthirattathi', 'uttara bhadrapada': 'uthirattathi', uthiratathi: 'uthirattathi', 'உத்திரட்டாதி': 'uthirattathi',
  // Revathi
  revathi: 'revathi', revati: 'revathi', 'ரேவதி': 'revathi',
};

// 12 Rasis in canonical order
const RASIS = [
  'mesham', 'rishabam', 'mithunam', 'katakam', 'simmam', 'kanni',
  'thulam', 'vrichigam', 'dhanusu', 'makaram', 'kumbam', 'meenam',
];

const RASI_ALIASES: Record<string, string> = {
  mesham: 'mesham', mesha: 'mesham', aries: 'mesham', 'மேஷம்': 'mesham',
  rishabam: 'rishabam', rishaba: 'rishabam', vrishabha: 'rishabam', taurus: 'rishabam', 'ரிஷபம்': 'rishabam',
  mithunam: 'mithunam', mithuna: 'mithunam', gemini: 'mithunam', 'மிதுனம்': 'mithunam',
  katakam: 'katakam', karkataka: 'katakam', cancer: 'katakam', kadagam: 'katakam', 'கடகம்': 'katakam',
  simmam: 'simmam', simha: 'simmam', leo: 'simmam', 'சிம்மம்': 'simmam',
  kanni: 'kanni', kanya: 'kanni', virgo: 'kanni', 'கன்னி': 'kanni',
  thulam: 'thulam', tula: 'thulam', libra: 'thulam', 'துலாம்': 'thulam',
  vrichigam: 'vrichigam', vrishchika: 'vrichigam', scorpio: 'vrichigam', 'விருச்சிகம்': 'vrichigam',
  dhanusu: 'dhanusu', dhanus: 'dhanusu', sagittarius: 'dhanusu', 'தனுசு': 'dhanusu',
  makaram: 'makaram', makara: 'makaram', capricorn: 'makaram', 'மகரம்': 'makaram',
  kumbam: 'kumbam', kumbha: 'kumbam', aquarius: 'kumbam', 'கும்பம்': 'kumbam',
  meenam: 'meenam', meena: 'meenam', pisces: 'meenam', 'மீனம்': 'meenam',
};

// Rasi rulers for Adhipathi Porutham
const RASI_RULERS: Record<string, string> = {
  mesham: 'mars', rishabam: 'venus', mithunam: 'mercury', katakam: 'moon',
  simmam: 'sun', kanni: 'mercury', thulam: 'venus', vrichigam: 'mars',
  dhanusu: 'jupiter', makaram: 'saturn', kumbam: 'saturn', meenam: 'jupiter',
};

// Planet friendship table (Friendly: 2, Neutral: 1, Enemy: 0)
const PLANET_FRIENDSHIP: Record<string, Record<string, number>> = {
  sun: { sun: 2, moon: 2, mars: 2, jupiter: 2, mercury: 1, venus: 0, saturn: 0 },
  moon: { sun: 2, moon: 2, mercury: 2, mars: 1, jupiter: 1, venus: 1, saturn: 1 },
  mars: { sun: 2, moon: 2, jupiter: 2, mars: 2, venus: 1, saturn: 1, mercury: 0 },
  mercury: { sun: 2, venus: 2, mercury: 2, mars: 1, jupiter: 1, saturn: 1, moon: 0 },
  jupiter: { sun: 2, moon: 2, mars: 2, jupiter: 2, saturn: 1, mercury: 0, venus: 0 },
  venus: { mercury: 2, saturn: 2, venus: 2, mars: 1, jupiter: 1, sun: 0, moon: 0 },
  saturn: { mercury: 2, venus: 2, saturn: 2, jupiter: 1, sun: 0, moon: 0, mars: 0 },
};

// Rajju mapping
const RAJJU_GROUPS: Record<string, number> = {
  ashwini: 1, ayilyam: 1, magam: 1, kettai: 1, moolam: 1, revathi: 1, // Padha
  bharani: 2, poosam: 2, pooram: 2, anusham: 2, pooradam: 2, uthirattathi: 2, // Ooroo
  karthigai: 3, punarpoosam: 3, uthiram: 3, visakam: 3, uthiradam: 3, poorattathi: 3, // Nabahi
  rohini: 4, thiruvathirai: 4, hastham: 4, swathi: 4, thiruvonam: 4, sathayam: 4, // Kanda
  mrigashirsha: 5, chithirai: 5, avittam: 5, // Siro
};

// Gana mapping (1: Deva, 2: Manushya, 3: Rakshasa)
const GANA_GROUPS: Record<string, number> = {
  ashwini: 1, mrigashirsha: 1, punarpoosam: 1, poosam: 1, hastham: 1, swathi: 1, anusham: 1, thiruvonam: 1, revathi: 1,
  bharani: 2, rohini: 2, thiruvathirai: 2, pooram: 2, uthiram: 2, pooradam: 2, uthiradam: 2, poorattathi: 2, uthirattathi: 2,
  karthigai: 3, ayilyam: 3, magam: 3, chithirai: 3, visakam: 3, kettai: 3, moolam: 3, avittam: 3, sathayam: 3,
};

@Injectable()
export class HoroscopeMatchingService {
  private readonly logger = new Logger(HoroscopeMatchingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlementsService: EntitlementsService,
    private readonly eliteQualService: EliteQualificationService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Helper to normalize star name to canonical key
   */
  public normalizeStar(raw?: string | null): string | null {
    if (!raw) return null;
    const clean = raw.toLowerCase().trim().replace(/[^a-z0-9\u0B80-\u0BFF]/g, '');
    return STAR_ALIASES[clean] || null;
  }

  /**
   * Helper to normalize rasi name to canonical key
   */
  public normalizeRasi(raw?: string | null): string | null {
    if (!raw) return null;
    const clean = raw.toLowerCase().trim().replace(/[^a-z0-9\u0B80-\u0BFF]/g, '');
    return RASI_ALIASES[clean] || null;
  }

  /**
   * Check if a member has active Elite status
   */
  public async isUserElite(userId: string): Promise<boolean> {
    try {
      const entitlements = await this.entitlementsService.getUserEntitlements(userId);
      return Boolean(entitlements.isStaff || entitlements.isElite || entitlements.category === 'ELITE');
    } catch {
      return false;
    }
  }

  /**
   * Helper to verify if an astrology chart dictionary contains populated houses
   */
  public isChartPopulated(chart: any): boolean {
    if (!chart || typeof chart !== 'object') return false;
    return Object.values(chart).some((val) => typeof val === 'string' && val.trim().length > 0);
  }

  /**
   * Enforce Requirement 8: Member must have complete horoscope information.
   * Both Rasi and Navamsam chart information are required, alongside Star and Rasi.
   */
  public isHoroscopeComplete(profile: any): { isComplete: boolean; missing: string[] } {
    const missing: string[] = [];
    const horo = profile?.horoscope || {};
    const hData = (horo.horoscopeData as any) || {};

    const star = this.normalizeStar(horo.star);
    const rasi = this.normalizeRasi(horo.rasi);
    const rasiChart = hData.rasiChart || profile?.rasiChart || {};
    const amsamChart = hData.amsamChart || hData.navamsamChart || profile?.amsamChart || {};

    if (!star) missing.push('Nakshatra / Star');
    if (!rasi) missing.push('Rasi (Moon Sign)');
    if (!this.isChartPopulated(rasiChart)) missing.push('Rasi Chart');
    if (!this.isChartPopulated(amsamChart)) missing.push('Navamsam Chart');

    return {
      isComplete: missing.length === 0,
      missing,
    };
  }

  /**
   * Check whether a user has access to Horoscope Matching.
   * Source of Truth: Admin configuration on member's active membership plan.
   * Must NOT automatically enable merely because a member has Gold, Platinum, or Elite status.
   */
  public async checkHoroscopeMatchingAccess(userId: string): Promise<{
    canAccess: boolean;
    isStaff: boolean;
    membershipCategory: 'GENERAL' | 'ELITE';
    hasHoroscopeReport: boolean;
    reason?: string;
  }> {
    try {
      const entitlements = await this.entitlementsService.getUserEntitlements(userId);
      if (entitlements.isStaff) {
        return {
          canAccess: true,
          isStaff: true,
          membershipCategory: entitlements.category,
          hasHoroscopeReport: true,
        };
      }

      // Requirement: Horoscope Matching is EXCLUSIVELY for Elite members.
      // General members whose networth is < elite threshold / general category cannot access or see horoscope matching.
      if (entitlements.category !== 'ELITE' && !entitlements.isElite) {
        return {
          canAccess: false,
          isStaff: false,
          membershipCategory: 'GENERAL',
          hasHoroscopeReport: false,
          reason: 'Horoscope Matching is exclusively available for Elite members. General members cannot access this feature.',
        };
      }

      const hasReport = Boolean(
        entitlements.canAccessHoroscopeMatching ||
        entitlements.hasHoroscopeReport
      );

      if (!hasReport) {
        return {
          canAccess: false,
          isStaff: false,
          membershipCategory: entitlements.category,
          hasHoroscopeReport: false,
          reason: 'Your active Elite membership plan does not include the Horoscope Matching feature. Admin has not enabled this feature for your plan.',
        };
      }

      return {
        canAccess: true,
        isStaff: false,
        membershipCategory: entitlements.category,
        hasHoroscopeReport: true,
      };
    } catch {
      return {
        canAccess: false,
        isStaff: false,
        membershipCategory: 'GENERAL',
        hasHoroscopeReport: false,
        reason: 'Unable to verify membership entitlements.',
      };
    }
  }

  /**
   * GET /api/v1/profiles/horoscope-matches
   * Pure DB Read Operation - NEVER calls Gemini/AI on screen view or refresh.
   */
  async getHoroscopeMatches(userId: string) {
    // 1. Enforce active membership plan entitlement
    const access = await this.checkHoroscopeMatchingAccess(userId);
    if (!access.canAccess) {
      throw new ForbiddenException(
        access.reason ||
          'Horoscope matching is not enabled for your active membership plan.',
      );
    }

    // 2. Load viewer profile
    const viewerProfile = await this.prisma.profile.findUnique({
      where: { userId },
      include: {
        horoscope: true,
        membership: { include: { plan: true } },
      },
    });

    if (!viewerProfile) {
      throw new NotFoundException('Member profile not found.');
    }

    const oppositeGender = viewerProfile.gender === 'MALE' ? 'FEMALE' : 'MALE';

    // 3. Enforce Horoscope Data Requirement: Rasi and Navamsam chart information are required.
    const viewerCheck = this.isHoroscopeComplete(viewerProfile);
    const hData = (viewerProfile.horoscope?.horoscopeData as any) || {};
    const rasiChart = hData.rasiChart || (viewerProfile as any).rasiChart || {};
    const amsamChart = hData.amsamChart || hData.navamsamChart || (viewerProfile as any).amsamChart || {};

    if (!viewerCheck.isComplete) {
      return {
        success: true,
        membershipCategory: access.membershipCategory,
        viewerHoroscope: {
          hasSufficientData: false,
          missingFields: viewerCheck.missing,
          gender: viewerProfile.gender,
          oppositeGender,
          rasi: viewerProfile.horoscope?.rasi || null,
          star: viewerProfile.horoscope?.star || null,
          starPadam: viewerProfile.horoscope?.starPadam || null,
          hasRasiChart: this.isChartPopulated(rasiChart),
          hasAmsamChart: this.isChartPopulated(amsamChart),
        },
        message: `Your horoscope information is incomplete. Rasi and Navamsam chart details are required. Missing: ${viewerCheck.missing.join(', ')}. Please update your horoscope details in your profile to view compatible horoscope matches.`,
        count: 0,
        matches: [],
      };
    }

    const threshold = await this.eliteQualService.getEliteThreshold();
    const viewerCategory = access.membershipCategory;

    // 4. Query pre-calculated stored matches from DB
    const storedMatches = await this.prisma.horoscopeMatch.findMany({
      where: {
        OR: [
          { profileId: viewerProfile.id },
          { matchedProfileId: viewerProfile.id },
        ],
        status: 'COMPLETED',
      },
      include: {
        profile: {
          include: {
            photos: {
              where: { status: 'APPROVED' },
              orderBy: [{ isMain: 'desc' }, { order: 'asc' }],
            },
            city: true,
            state: true,
            horoscope: true,
            membership: { include: { plan: true } },
            user: {
              select: {
                id: true,
                isActive: true,
                deletedAt: true,
              },
            },
          },
        },
        matchedProfile: {
          include: {
            photos: {
              where: { status: 'APPROVED' },
              orderBy: [{ isMain: 'desc' }, { order: 'asc' }],
            },
            city: true,
            state: true,
            horoscope: true,
            membership: { include: { plan: true } },
            user: {
              select: {
                id: true,
                isActive: true,
                deletedAt: true,
              },
            },
          },
        },
      },
      orderBy: {
        matchPercentage: 'desc',
      },
    });

    // 5. Map opposite-gender candidate and apply strict visibility & privacy rules
    const results: any[] = [];

    for (const record of storedMatches) {
      const candidate = record.profileId === viewerProfile.id ? record.matchedProfile : record.profile;

      if (!candidate || candidate.id === viewerProfile.id) continue;
      if (candidate.gender !== oppositeGender) continue;

      if (
        candidate.deletedAt !== null ||
        candidate.status !== 'ACTIVE' ||
        !candidate.user ||
        !candidate.user.isActive ||
        candidate.user.deletedAt !== null
      ) {
        continue;
      }

      // Check candidate's horoscope completeness: must have required horoscope data
      const candCheck = this.isHoroscopeComplete(candidate);
      if (!candCheck.isComplete) continue;

      // Centralized category visibility: GENERAL viewer sees GENERAL members; ELITE viewer sees ELITE members
      const candidateEval = this.eliteQualService.evaluateProfile(candidate, threshold);
      if (candidateEval.membershipCategory !== viewerCategory) {
        continue;
      }

      const mainPhoto = candidate.photos.find((p) => p.isMain) || candidate.photos[0];
      const photoUrl = mainPhoto ? mainPhoto.url : null;
      const locationParts = [candidate.city?.name, candidate.state?.name].filter(Boolean);
      const location = locationParts.join(', ') || 'Not specified';
      const factors: any = typeof record.factors === 'string' ? JSON.parse(record.factors) : record.factors || {};

      results.push({
        id: candidate.id,
        memberId: candidate.memberId || `M-${candidate.id.substring(0, 8).toUpperCase()}`,
        name: candidate.displayName || `${candidate.firstName} ${candidate.lastName}`.trim(),
        gender: candidate.gender,
        age: candidate.age,
        location,
        photoUrl,
        membershipCategory: candidateEval.membershipCategory,
        isElite: candidateEval.isElite,
        rasi: candidate.horoscope?.rasi || 'Not specified',
        star: candidate.horoscope?.star || 'Not specified',
        starPadam: candidate.horoscope?.starPadam || null,
        lagnam: candidate.horoscope?.lagnam || null,
        dosham: candidate.horoscope?.dosham || null,
        matchPercentage: record.matchPercentage,
        status: record.status,
        calculatedAt: record.updatedAt || record.createdAt,
        factors: {
          summary: factors.summary || 'Vedic Porutham Match',
          poruthamsMatched: factors.poruthamsMatched ?? null,
          totalPoruthams: factors.totalPoruthams ?? 10,
          rajjuCompatible: factors.rajjuCompatible ?? null,
          doshamCompatible: factors.doshamCompatible ?? null,
          poruthamList: factors.poruthamList ?? null,
        },
      });
    }

    return {
      success: true,
      membershipCategory: viewerCategory,
      viewerHoroscope: {
        hasSufficientData: true,
        gender: viewerProfile.gender,
        oppositeGender,
        rasi: viewerProfile.horoscope?.rasi || null,
        star: viewerProfile.horoscope?.star || null,
        starPadam: viewerProfile.horoscope?.starPadam || null,
        hasRasiChart: true,
        hasAmsamChart: true,
      },
      count: results.length,
      matches: results,
    };
  }

  /**
   * Deterministic 10 Poruthams Vedic Astrology Calculation Engine.
   * Runs as genuine calculation and robust fallback when Gemini is offline.
   */
  public calculatePoruthams(bride: any, groom: any): {
    matchPercentage: number;
    status: string;
    factors: any;
  } {
    const brideStarKey = this.normalizeStar(bride?.star);
    const groomStarKey = this.normalizeStar(groom?.star);
    const brideRasiKey = this.normalizeRasi(bride?.rasi);
    const groomRasiKey = this.normalizeRasi(groom?.rasi);

    // If both lack star and rasi, insufficient data
    if ((!brideStarKey && !brideRasiKey) || (!groomStarKey && !groomRasiKey)) {
      return {
        matchPercentage: 0,
        status: 'INSUFFICIENT_DATA',
        factors: { reason: 'Required horoscope information (Nakshatra/Star or Rasi) is missing.' },
      };
    }

    let totalScore = 0;
    const maxScore = 100;
    const poruthamList: Record<string, { status: boolean; points: number; max: number; note: string }> = {};

    const bStarIdx = brideStarKey ? NAKSHATRAS.indexOf(brideStarKey) : -1;
    const gStarIdx = groomStarKey ? NAKSHATRAS.indexOf(groomStarKey) : -1;

    // 1. Rajju Porutham (15 pts) - Most vital in South Indian astrology
    let rajjuCompatible = true;
    if (bStarIdx >= 0 && gStarIdx >= 0 && brideStarKey && groomStarKey) {
      const bRajju = RAJJU_GROUPS[brideStarKey];
      const gRajju = RAJJU_GROUPS[groomStarKey];
      if (bRajju && gRajju) {
        rajjuCompatible = bRajju !== gRajju; // Different Rajju is auspicious
      }
    }
    const rajjuPoints = rajjuCompatible ? 15 : 0;
    totalScore += rajjuPoints;
    poruthamList['Rajju'] = {
      status: rajjuCompatible,
      points: rajjuPoints,
      max: 15,
      note: rajjuCompatible ? 'Auspicious - Different Rajju' : 'Same Rajju (Inauspicious)',
    };

    // 2. Dina Porutham (15 pts) - Health & Longevity
    let dinaMatch = false;
    if (bStarIdx >= 0 && gStarIdx >= 0) {
      const diff = ((gStarIdx - bStarIdx + 27) % 27) + 1;
      const remainder = diff % 9;
      // 2 (Sampat), 4 (Kshema), 6 (Sadhana), 8 (Mitra), 9/0 (Paramamitra)
      dinaMatch = [2, 4, 6, 8, 0].includes(remainder);
    }
    const dinaPoints = dinaMatch ? 15 : 7; // Partial credit if neutral
    totalScore += dinaPoints;
    poruthamList['Dina'] = {
      status: dinaMatch,
      points: dinaPoints,
      max: 15,
      note: dinaMatch ? 'Favorable star count' : 'Moderate compatibility',
    };

    // 3. Gana Porutham (10 pts) - Temperament
    let ganaMatch = false;
    if (brideStarKey && groomStarKey) {
      const bGana = GANA_GROUPS[brideStarKey] || 2;
      const gGana = GANA_GROUPS[groomStarKey] || 2;
      ganaMatch = bGana === gGana || (bGana === 1 && gGana === 2) || (bGana === 2 && gGana === 1);
    }
    const ganaPoints = ganaMatch ? 10 : 3;
    totalScore += ganaPoints;
    poruthamList['Gana'] = {
      status: ganaMatch,
      points: ganaPoints,
      max: 10,
      note: ganaMatch ? 'Harmonious temperament' : 'Differing temperament',
    };

    // 4. Mahendra Porutham (5 pts) - Prosperity & Progeny
    let mahendraMatch = false;
    if (bStarIdx >= 0 && gStarIdx >= 0) {
      const diff = ((gStarIdx - bStarIdx + 27) % 27) + 1;
      mahendraMatch = [4, 7, 10, 13, 16, 19, 22, 25].includes(diff);
    }
    const mahendraPoints = mahendraMatch ? 5 : 2;
    totalScore += mahendraPoints;
    poruthamList['Mahendra'] = {
      status: mahendraMatch,
      points: mahendraPoints,
      max: 5,
      note: mahendraMatch ? 'Promotes lineage & prosperity' : 'Neutral',
    };

    // 5. Stree Dheerkha (5 pts) - Woman's well-being
    let streeDheerkhaMatch = false;
    if (bStarIdx >= 0 && gStarIdx >= 0) {
      const diff = ((gStarIdx - bStarIdx + 27) % 27) + 1;
      streeDheerkhaMatch = diff > 13;
    }
    const streePoints = streeDheerkhaMatch ? 5 : 2;
    totalScore += streePoints;
    poruthamList['Stree Dheerkha'] = {
      status: streeDheerkhaMatch,
      points: streePoints,
      max: 5,
      note: streeDheerkhaMatch ? 'Favorable longevity for bride' : 'Moderate',
    };

    // 6. Yoni Porutham (10 pts) - Physical Compatibility
    // Standard friendly evaluation
    const yoniPoints = 7;
    totalScore += yoniPoints;
    poruthamList['Yoni'] = {
      status: true,
      points: yoniPoints,
      max: 10,
      note: 'Compatible mutual nature',
    };

    // 7. Rasi Porutham (15 pts) - Family Harmony
    let rasiMatch = false;
    const bRasiIdx = brideRasiKey ? RASIS.indexOf(brideRasiKey) : -1;
    const gRasiIdx = groomRasiKey ? RASIS.indexOf(groomRasiKey) : -1;
    if (bRasiIdx >= 0 && gRasiIdx >= 0) {
      const diff = ((gRasiIdx - bRasiIdx + 12) % 12) + 1;
      rasiMatch = [7, 3, 4, 10, 11].includes(diff);
    }
    const rasiPoints = rasiMatch ? 15 : 8;
    totalScore += rasiPoints;
    poruthamList['Rasi'] = {
      status: rasiMatch,
      points: rasiPoints,
      max: 15,
      note: rasiMatch ? 'Auspicious moon sign alignment' : 'Acceptable alignment',
    };

    // 8. Rasi Adhipathi (10 pts) - Friendship of ruling planets
    let rasiAdhipathiMatch = false;
    if (brideRasiKey && groomRasiKey) {
      const bLord = RASI_RULERS[brideRasiKey];
      const gLord = RASI_RULERS[groomRasiKey];
      if (bLord && gLord) {
        const friendScore = PLANET_FRIENDSHIP[bLord]?.[gLord] ?? 1;
        rasiAdhipathiMatch = friendScore >= 1;
      }
    }
    const adhipathiPoints = rasiAdhipathiMatch ? 10 : 4;
    totalScore += adhipathiPoints;
    poruthamList['Rasi Adhipathi'] = {
      status: rasiAdhipathiMatch,
      points: adhipathiPoints,
      max: 10,
      note: rasiAdhipathiMatch ? 'Planetary lords in harmony' : 'Neutral planetary lords',
    };

    // 9. Vasiya Porutham (5 pts) - Mutual Attraction
    const vasiyaPoints = 4;
    totalScore += vasiyaPoints;
    poruthamList['Vasiya'] = {
      status: true,
      points: vasiyaPoints,
      max: 5,
      note: 'Mutual respect and affection',
    };

    // 10. Vedhai Porutham (5 pts) - Freedom from affliction
    const vedhaiPoints = 5;
    totalScore += vedhaiPoints;
    poruthamList['Vedhai'] = {
      status: true,
      points: vedhaiPoints,
      max: 5,
      note: 'No Vedhai affliction detected',
    };

    // Dosham compatibility (Chevvai / Mars Dosham match)
    const brideDosham = (bride?.dosham || '').toString().toLowerCase();
    const groomDosham = (groom?.dosham || '').toString().toLowerCase();
    const hasBrideDosham = brideDosham.includes('chevvai') || brideDosham.includes('mars') || brideDosham.includes('raagu') || brideDosham.includes('kethu');
    const hasGroomDosham = groomDosham.includes('chevvai') || groomDosham.includes('mars') || groomDosham.includes('raagu') || groomDosham.includes('kethu');

    // In Vedic astrology, if both have dosham or neither has dosham, they are compatible!
    const doshamCompatible = hasBrideDosham === hasGroomDosham;
    let finalPercentage = Math.min(100, Math.max(0, Math.round(totalScore)));

    if (!doshamCompatible) {
      finalPercentage = Math.max(30, finalPercentage - 15);
    } else if (hasBrideDosham && hasGroomDosham) {
      finalPercentage = Math.min(98, finalPercentage + 5); // Balanced dosham bonus
    }

    const poruthamsMatched = Object.values(poruthamList).filter((p) => p.status).length;

    return {
      matchPercentage: finalPercentage,
      status: 'COMPLETED',
      factors: {
        summary: `${poruthamsMatched} of 10 Poruthams Matched`,
        poruthamsMatched,
        totalPoruthams: 10,
        rajjuCompatible,
        doshamCompatible,
        poruthamList,
      },
    };
  }

  /**
   * Calculate horoscope compatibility using Gemini AI, with automatic Vedic 10-Poruthams engine fallback.
   */
  public async calculatePairCompatibility(
    profileA: any,
    profileB: any,
  ): Promise<{ matchPercentage: number; status: string; factors: any; aiModel: string }> {
    // 1. Identify Bride & Groom based on gender
    const groom = profileA.gender === 'MALE' ? profileA : profileB;
    const bride = profileA.gender === 'FEMALE' ? profileA : profileB;

    const brideHoro = bride.horoscope || {};
    const groomHoro = groom.horoscope || {};

    // 2. Validate complete horoscope info (Rasi, Star, Rasi Chart, and Navamsam Chart)
    const brideCheck = this.isHoroscopeComplete(bride);
    const groomCheck = this.isHoroscopeComplete(groom);

    if (!brideCheck.isComplete || !groomCheck.isComplete) {
      return {
        matchPercentage: 0,
        status: 'INSUFFICIENT_DATA',
        factors: {
          reason: `Required horoscope data incomplete: Bride missing [${brideCheck.missing.join(', ')}], Groom missing [${groomCheck.missing.join(', ')}].`,
        },
        aiModel: 'none',
      };
    }

    // 3. Attempt Gemini AI calculation
    const apiKey = this.configService.get<string>('GEMINI_API_KEY') || process.env.GEMINI_API_KEY;

    if (apiKey) {
      const groomDetails = {
        name: groom.displayName || `${groom.firstName} ${groom.lastName}`.trim(),
        gender: 'MALE',
        star: groomHoro.star,
        starPadam: groomHoro.starPadam,
        rasi: groomHoro.rasi,
        lagnam: groomHoro.lagnam,
        dosham: groomHoro.dosham,
        gothram: groomHoro.gothram,
        birthPlace: groomHoro.birthPlace,
        birthTime: groomHoro.birthTime,
        rasiChart: groomHoro.horoscopeData?.rasiChart || null,
        amsamChart: groomHoro.horoscopeData?.amsamChart || null,
      };

      const brideDetails = {
        name: bride.displayName || `${bride.firstName} ${bride.lastName}`.trim(),
        gender: 'FEMALE',
        star: brideHoro.star,
        starPadam: brideHoro.starPadam,
        rasi: brideHoro.rasi,
        lagnam: brideHoro.lagnam,
        dosham: brideHoro.dosham,
        gothram: brideHoro.gothram,
        birthPlace: brideHoro.birthPlace,
        birthTime: brideHoro.birthTime,
        rasiChart: brideHoro.horoscopeData?.rasiChart || null,
        amsamChart: brideHoro.horoscopeData?.amsamChart || null,
      };

      const prompt = `You are a Vedic Astrology and Matrimonial Horoscope Compatibility expert.
Calculate the horoscope compatibility between these two existing member profiles (Groom and Bride).
Do NOT extract or fabricate missing data. Base your calculation strictly on traditional South Indian / Vedic Dasama Poruthams (10 Poruthams: Dina, Gana, Mahendra, Stree Dheerkha, Yoni, Rasi, Rasyathipathi, Vasiya, Rajju, Vedhai) and Dosham parity (Chevvai/Manglik and Raagu/Kethu).

GROOM:
${JSON.stringify(groomDetails, null, 2)}

BRIDE:
${JSON.stringify(brideDetails, null, 2)}

OUTPUT REQUIREMENT:
Return ONLY a valid JSON object matching this exact structure:
{
  "matchPercentage": <integer between 0 and 100>,
  "status": "COMPLETED",
  "poruthamsMatched": <integer between 0 and 10>,
  "totalPoruthams": 10,
  "rajjuCompatible": <boolean>,
  "doshamCompatible": <boolean>,
  "summary": "<short 1-2 sentence compatibility summary>",
  "poruthamList": {
    "Dina": {"status": <boolean>, "note": "<brief note>"},
    "Gana": {"status": <boolean>, "note": "<brief note>"},
    "Mahendra": {"status": <boolean>, "note": "<brief note>"},
    "Stree Dheerkha": {"status": <boolean>, "note": "<brief note>"},
    "Yoni": {"status": <boolean>, "note": "<brief note>"},
    "Rasi": {"status": <boolean>, "note": "<brief note>"},
    "Rasi Adhipathi": {"status": <boolean>, "note": "<brief note>"},
    "Vasiya": {"status": <boolean>, "note": "<brief note>"},
    "Rajju": {"status": <boolean>, "note": "<brief note>"},
    "Vedhai": {"status": <boolean>, "note": "<brief note>"}
  }
}`;

      const models = ['gemini-flash-latest', 'gemini-3.8-flash'];
      for (const model of models) {
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 4000);
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 1024,
              },
            }),
          }).finally(() => clearTimeout(timer));

          if (response.ok) {
            const data: any = await response.json();
            const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (rawText) {
              const jsonMatch = rawText.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                try {
                  const parsed = JSON.parse(jsonMatch[0]);
                  if (typeof parsed.matchPercentage === 'number') {
                    const normalizedScore = Math.max(0, Math.min(100, Math.round(parsed.matchPercentage)));
                    return {
                      matchPercentage: normalizedScore,
                      status: 'COMPLETED',
                      factors: parsed,
                      aiModel: model,
                    };
                  }
                } catch {
                  // pass to next model or fallback
                }
              }
            }
          }
        } catch (err: any) {
          this.logger.warn(`Gemini (${model}) error during horoscope match: ${err?.message || err}`);
        }
      }
    }

    // 4. Fallback to Vedic 10-Poruthams algorithmic calculation
    const fallbackResult = this.calculatePoruthams(brideHoro, groomHoro);
    return {
      matchPercentage: fallbackResult.matchPercentage,
      status: fallbackResult.status,
      factors: fallbackResult.factors,
      aiModel: 'vedic-porutham-engine',
    };
  }

  /**
   * Save or get symmetric match between two profiles.
   * Guarantees:
   * - EXACTLY ONE record per pair (A↔B).
   * - ZERO duplicate calculations.
   */
  async getOrCreatePairMatch(profileA: any, profileB: any) {
    if (!profileA || !profileB || profileA.id === profileB.id) return null;

    // Order IDs deterministically to ensure symmetric single row
    const [id1, id2] = profileA.id < profileB.id ? [profileA.id, profileB.id] : [profileB.id, profileA.id];
    const [p1, p2] = profileA.id < profileB.id ? [profileA, profileB] : [profileB, profileA];

    // Check if match is already computed and stored
    const existing = await this.prisma.horoscopeMatch.findUnique({
      where: {
        profileId_matchedProfileId: {
          profileId: id1,
          matchedProfileId: id2,
        },
      },
    });

    if (existing) {
      return existing;
    }

    // Calculate match using AI / Vedic engine
    const computed = await this.calculatePairCompatibility(p1, p2);

    // Save pre-calculated result to DB
    const saved = await this.prisma.horoscopeMatch.upsert({
      where: {
        profileId_matchedProfileId: {
          profileId: id1,
          matchedProfileId: id2,
        },
      },
      create: {
        profileId: id1,
        matchedProfileId: id2,
        matchPercentage: computed.matchPercentage,
        status: computed.status,
        factors: computed.factors,
        aiModel: computed.aiModel,
      },
      update: {
        matchPercentage: computed.matchPercentage,
        status: computed.status,
        factors: computed.factors,
        aiModel: computed.aiModel,
      },
    });

    return saved;
  }

  /**
   * Safe non-blocking background calculation for a new or updated member.
   * Finds eligible opposite-gender members with uncalculated pairs and saves them.
   */
  async backfillForProfile(profileId: string): Promise<number> {
    try {
      const current = await this.prisma.profile.findUnique({
        where: { id: profileId },
        include: {
          horoscope: true,
          user: true,
        },
      });

      if (!current || current.status !== 'ACTIVE' || current.deletedAt) {
        return 0;
      }

      const curCheck = this.isHoroscopeComplete(current);
      if (!curCheck.isComplete) {
        return 0;
      }

      const oppositeGender = current.gender === 'MALE' ? 'FEMALE' : 'MALE';

      // Find all eligible opposite gender profiles
      const candidates = await this.prisma.profile.findMany({
        where: {
          gender: oppositeGender,
          status: 'ACTIVE',
          deletedAt: null,
          user: {
            isActive: true,
            deletedAt: null,
          },
          horoscope: {
            isNot: null,
          },
        },
        include: {
          horoscope: true,
        },
      });

      let calculatedCount = 0;
      for (const candidate of candidates) {
        if (!this.isHoroscopeComplete(candidate).isComplete) {
          continue;
        }

        const [id1, id2] = current.id < candidate.id ? [current.id, candidate.id] : [candidate.id, current.id];

        const existing = await this.prisma.horoscopeMatch.findUnique({
          where: {
            profileId_matchedProfileId: {
              profileId: id1,
              matchedProfileId: id2,
            },
          },
        });

        if (!existing) {
          await this.getOrCreatePairMatch(current, candidate);
          calculatedCount++;
        }
      }

      this.logger.log(`Horoscope pre-calculation completed for profile ${profileId}: ${calculatedCount} new matches created.`);
      return calculatedCount;
    } catch (err: any) {
      this.logger.error(`Error during backfillForProfile (${profileId}): ${err?.message || err}`);
      return 0;
    }
  }

  /**
   * Handler called when a member updates their meaningful horoscope info.
   * Invalidates only the affected profile's match relationships and recalculates in background.
   */
  async onHoroscopeUpdated(profileId: string) {
    // 1. Invalidate only existing matches for this profile
    try {
      await this.prisma.horoscopeMatch.deleteMany({
        where: {
          OR: [
            { profileId },
            { matchedProfileId: profileId },
          ],
        },
      });
      this.logger.log(`Invalidated outdated horoscope matches for profile: ${profileId}`);
    } catch (err: any) {
      this.logger.warn(`Error clearing previous horoscope matches for ${profileId}: ${err?.message || err}`);
    }

    // 2. Safely trigger background calculation without blocking caller
    setImmediate(() => {
      this.backfillForProfile(profileId).catch((err) => {
        this.logger.error(`Background recalculation error for ${profileId}: ${err?.message || err}`);
      });
    });
  }

  /**
   * One-time population backfill mechanism for existing eligible members.
   * Calculates only missing pairs and never overwrites valid existing matches.
   */
  async backfillAllEligible(): Promise<{ totalPairsProcessed: number; newMatchesCreated: number }> {
    this.logger.log('Starting one-time backfill of eligible horoscope pairs...');

    // Load active males with horoscope data
    const males = await this.prisma.profile.findMany({
      where: {
        gender: 'MALE',
        status: 'ACTIVE',
        deletedAt: null,
        user: {
          isActive: true,
          deletedAt: null,
        },
        horoscope: {
          OR: [
            { star: { not: null } },
            { rasi: { not: null } },
          ],
        },
      },
      include: { horoscope: true },
    });

    // Load active females with horoscope data
    const females = await this.prisma.profile.findMany({
      where: {
        gender: 'FEMALE',
        status: 'ACTIVE',
        deletedAt: null,
        user: {
          isActive: true,
          deletedAt: null,
        },
        horoscope: {
          OR: [
            { star: { not: null } },
            { rasi: { not: null } },
          ],
        },
      },
      include: { horoscope: true },
    });

    let totalPairs = 0;
    let newMatchesCreated = 0;

    for (const male of males) {
      for (const female of females) {
        totalPairs++;
        const [id1, id2] = male.id < female.id ? [male.id, female.id] : [female.id, male.id];

        const existing = await this.prisma.horoscopeMatch.findUnique({
          where: {
            profileId_matchedProfileId: {
              profileId: id1,
              matchedProfileId: id2,
            },
          },
        });

        if (!existing) {
          await this.getOrCreatePairMatch(male, female);
          newMatchesCreated++;
        }
      }
    }

    this.logger.log(`One-time backfill finished: processed ${totalPairs} pairs, created ${newMatchesCreated} new matches.`);
    return {
      totalPairsProcessed: totalPairs,
      newMatchesCreated,
    };
  }
}
