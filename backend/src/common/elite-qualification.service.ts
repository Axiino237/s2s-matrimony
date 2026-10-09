import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { devStore } from './dev-store';

export type MembershipCategory = 'GENERAL' | 'ELITE';
export type EliteQualificationStatus = 'GENERAL' | 'ELITE_QUALIFIED' | 'ELITE_NOT_QUALIFIED';

export const DEFAULT_ELITE_THRESHOLD = 50000000; // ₹5 Crore (50,000,000 INR)

export interface ProfileEliteEvaluation {
  membershipCategory: MembershipCategory;
  isElite: boolean;
  isQualified: boolean;
  eliteStatus: EliteQualificationStatus;
  threshold: number;
}

@Injectable()
export class EliteQualificationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retrieves the configured Elite Financial Qualification Threshold.
   * Default is ₹5 Crore (50,000,000) if not explicitly set.
   */
  async getEliteThreshold(): Promise<number> {
    try {
      const record = await this.prisma.setting.findUnique({
        where: { key: 'system_settings' },
      });
      if (record && record.value) {
        const parsed = JSON.parse(record.value);
        if (parsed.eliteQualificationThreshold !== undefined && parsed.eliteQualificationThreshold !== null) {
          const num = Number(parsed.eliteQualificationThreshold);
          if (!isNaN(num) && num >= 0) return num;
        }
      }
    } catch {}

    const devSettings = (devStore as any).systemSettings;
    if (devSettings && devSettings.eliteQualificationThreshold !== undefined) {
      const num = Number(devSettings.eliteQualificationThreshold);
      if (!isNaN(num) && num >= 0) return num;
    }

    return DEFAULT_ELITE_THRESHOLD;
  }

  /**
   * Helper to check whether a plan belongs to the Elite family.
   * Elite plan family:
   * - elite-plan-silver (category: ELITE, tier: SILVER)
   * - elite-plan-gold (category: ELITE, tier: GOLD)
   * - elite-plan-platinum (category: ELITE, tier: PLATINUM)
   * Or any plan where category === 'ELITE' or tier === 'ELITE'.
   * Ordinary plans (e.g. regular Gold Plan) have category === 'GENERAL' and tier === 'GOLD' and are NOT Elite.
   */
  isElitePlan(plan?: any): boolean {
    if (!plan) return false;
    const category = (plan.category || '').toString().toUpperCase().trim();
    if (category === 'ELITE') return true;
    if (category === 'GENERAL') return false;

    const id = (plan.id || '').toString().toLowerCase().trim();
    if (
      id === 'elite-plan-silver' ||
      id === 'elite-plan-gold' ||
      id === 'elite-plan-platinum' ||
      id.startsWith('elite-plan-')
    ) {
      return true;
    }

    const name = (plan.name || '').toString().toLowerCase().trim();
    if (name.includes('elite')) return true;

    const tier = (plan.tier || '').toString().toUpperCase().trim();
    if (tier === 'ELITE' && !plan.category) return true;

    return false;
  }

  /**
   * Evaluates the membership category and qualification status of a profile.
   * Rules:
   * 1. membershipCategory has ONLY two valid values: 'GENERAL' or 'ELITE'.
   * 2. GOLD, SILVER, and PLATINUM are plan tiers, never membership categories.
   * 3. A member is in category 'ELITE' if their active membership belongs to the Elite plan family
   *    (elite-plan-silver, elite-plan-gold, elite-plan-platinum),
   *    OR if they have completed the required Elite qualification information with netWorth >= threshold.
   * 4. Ordinary plans (regular Silver, regular Gold, regular Platinum) remain 'GENERAL'.
   * 5. Members without completed net-worth and without an Elite plan remain GENERAL.
   */
  evaluateProfile(profile: any, threshold: number): ProfileEliteEvaluation {
    // Check active plan attached to profile / membership
    const activePlan =
      profile?.membership?.plan ||
      (Array.isArray(profile?.memberships)
        ? profile.memberships.find((m: any) => m.isActive !== false && (!m.endDate || new Date(m.endDate) >= new Date()))?.plan
        : null) ||
      profile?.plan;

    const hasElitePlan = this.isElitePlan(activePlan);

    // Net-worth financial qualification check
    const netWorthNum = Number(profile?.netWorth);
    const hasValidNetWorth =
      profile?.netWorth !== null &&
      profile?.netWorth !== undefined &&
      !isNaN(netWorthNum) &&
      netWorthNum > 0;
    const isFinanciallyQualified = hasValidNetWorth && netWorthNum >= threshold;

    // Business Rules:
    // 1. User with networth >= elite threshold + elite plan = ELITE_QUALIFIED.
    // 2. If the member's networth is greater than threshold, but they didn't buy any plan,
    //    that member is GENERAL until they buy an elite plan.
    //    They are only shown to general members and can view general members.
    // 3. If a member bought an Elite plan, but their networth is < threshold (or not given),
    //    that member is ELITE_NOT_QUALIFIED.
    if (!hasElitePlan) {
      return {
        membershipCategory: 'GENERAL',
        isElite: false,
        isQualified: isFinanciallyQualified,
        eliteStatus: 'GENERAL',
        threshold,
      };
    }

    return {
      membershipCategory: 'ELITE',
      isElite: true,
      isQualified: isFinanciallyQualified,
      eliteStatus: isFinanciallyQualified ? 'ELITE_QUALIFIED' : 'ELITE_NOT_QUALIFIED',
      threshold,
    };
  }

  /**
   * Helper to evaluate category visibility between viewer and candidate:
   * - GENERAL viewer sees GENERAL members only
   * - ELITE viewer sees ELITE members only
   */
  isCategoryVisibleToViewer(
    viewerCategory: MembershipCategory,
    targetCategory: MembershipCategory,
  ): boolean {
    if (viewerCategory === 'GENERAL') {
      return targetCategory === 'GENERAL';
    }
    if (viewerCategory === 'ELITE') {
      return targetCategory === 'ELITE';
    }
    return false;
  }

  /**
   * Evaluates the viewer's category ('GENERAL' or 'ELITE').
   * Unauthenticated or non-existent members default to 'GENERAL'.
   */
  async getViewerCategory(viewerUserId?: string, threshold?: number): Promise<MembershipCategory> {
    if (!viewerUserId) return 'GENERAL';
    const activeThreshold = threshold ?? (await this.getEliteThreshold());
    try {
      const profile = await this.prisma.profile.findFirst({
        where: { userId: viewerUserId },
        include: {
          membership: { include: { plan: true } },
        },
      });

      if (!profile) {
        const devUser = devStore.get(viewerUserId);
        if (devUser) {
          return this.evaluateProfile(devUser, activeThreshold).membershipCategory;
        }
        return 'GENERAL';
      }

      return this.evaluateProfile(profile, activeThreshold).membershipCategory;
    } catch {
      return 'GENERAL';
    }
  }

  /**
   * Evaluates the viewer's qualification status.
   * Unauthenticated or non-existent members default to 'GENERAL'.
   */
  async getViewerStatus(viewerUserId?: string, threshold?: number): Promise<EliteQualificationStatus> {
    if (!viewerUserId) return 'GENERAL';

    const activeThreshold = threshold ?? (await this.getEliteThreshold());

    try {
      const profile = await this.prisma.profile.findFirst({
        where: { userId: viewerUserId },
        include: {
          membership: {
            include: { plan: true },
          },
        },
      });

      if (!profile) {
        const devUser = devStore.get(viewerUserId);
        if (devUser) {
          const evalRes = this.evaluateProfile(devUser, activeThreshold);
          return evalRes.eliteStatus;
        }
        return 'GENERAL';
      }

      return this.evaluateProfile(profile, activeThreshold).eliteStatus;
    } catch {
      return 'GENERAL';
    }
  }

  /**
   * Visibility Matrix:
   * | Member (Viewer)       | Can View General | Can View Elite Not Qualified | Can View Elite Qualified |
   * | General               |       YES        |              NO              |            NO            |
   * | Elite not qualified   |        NO        |             YES              |           YES            |
   * | Elite qualified       |        NO        |              NO              |           YES            |
   */
  isProfileVisibleToViewer(
    viewerStatus: EliteQualificationStatus,
    targetStatus: EliteQualificationStatus,
  ): boolean {
    if (viewerStatus === 'GENERAL') {
      return targetStatus === 'GENERAL';
    }
    if (viewerStatus === 'ELITE_NOT_QUALIFIED') {
      return targetStatus === 'ELITE_NOT_QUALIFIED' || targetStatus === 'ELITE_QUALIFIED';
    }
    if (viewerStatus === 'ELITE_QUALIFIED') {
      return targetStatus === 'ELITE_QUALIFIED';
    }
    return false;
  }
}
