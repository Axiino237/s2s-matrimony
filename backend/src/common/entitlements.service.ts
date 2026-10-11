import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { devStore } from './dev-store';

export interface UserEntitlements {
  userId: string;
  planId: string;
  planName: string;
  tier: string;
  category: 'GENERAL' | 'ELITE';
  isElite: boolean;
  isActive: boolean;
  isStaff: boolean;

  contacts: {
    enabled: boolean;
    max: number; // -1 = unlimited, 0 = disabled, >0 = limit
    used: number;
    remaining: number; // 999999 if unlimited
    unlockedIds: string[];
  };

  interests: {
    enabled: boolean;
    max: number; // -1 = unlimited, 0 = disabled, >0 = limit
    used: number;
    remaining: number; // 999999 if unlimited
  };

  profileViews: {
    enabled: boolean;
    max: number; // -1 = unlimited, >0 = limit
    usedToday: number;
    remainingToday: number; // 999999 if unlimited
    isRestricted: boolean; // true if reached limit
    viewedOwnerIdsToday: string[];
  };

  hasChat: boolean;
  hasAiMatch: boolean;
  hasVideoProfile: boolean;
  hasHoroscope: boolean;
  hasHoroscopeReport: boolean;
  canAccessHoroscopeMatching: boolean;
  hasAdvancedSearch: boolean;
  hasProfileHighlight: boolean;
  hasPriorityListing: boolean;
  hasVerificationBadge: boolean;
  hasWhatsappConnect: boolean;
  hasDedicatedManager: boolean;
  hasPrioritySupport: boolean;

  features: string[];
}

import { EliteQualificationService } from './elite-qualification.service';

@Injectable()
export class EntitlementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eliteQualService: EliteQualificationService,
  ) {}

  /**
   * Resolves the user's active membership plan and complete dynamic capabilities from the database.
   * If the user has no explicit active membership, it resolves the database's default active Free plan.
   */
  async getUserEntitlements(userId: string): Promise<UserEntitlements> {
    // 1. Check if user is staff (SUPER_ADMIN, ADMIN) -> Full access
    let isStaff = false;
    try {
      const userRoles = await this.prisma.userRole.findMany({
        where: { userId },
        include: { role: true },
      });
      isStaff = userRoles.some((ur: any) =>
        ['SUPER_ADMIN', 'ADMIN'].includes(ur.role?.name),
      );
    } catch {
      // ignore
    }

    if (isStaff) {
      const unlockedIds = await this.getUnlockedContactIds(userId);
      return {
        userId,
        planId: 'staff-plan',
        planName: 'Staff Full Access',
        tier: 'ELITE',
        category: 'ELITE',
        isElite: true,
        isActive: true,
        isStaff: true,
        contacts: {
          enabled: true,
          max: -1,
          used: unlockedIds.length,
          remaining: 999999,
          unlockedIds,
        },
        interests: {
          enabled: true,
          max: -1,
          used: 0,
          remaining: 999999,
        },
        profileViews: {
          enabled: true,
          max: -1,
          usedToday: 0,
          remainingToday: 999999,
          isRestricted: false,
          viewedOwnerIdsToday: [],
        },
        hasChat: true,
        hasAiMatch: true,
        hasVideoProfile: true,
        hasHoroscope: true,
        hasHoroscopeReport: true,
        canAccessHoroscopeMatching: true,
        hasAdvancedSearch: true,
        hasProfileHighlight: true,
        hasPriorityListing: true,
        hasVerificationBadge: true,
        hasWhatsappConnect: true,
        hasDedicatedManager: true,
        hasPrioritySupport: true,
        features: ['All Features (Staff Bypass)'],
      };
    }

    // 2. Query user's active non-expired membership from DB
    let resolvedPlan: any = null;
    let isActiveMembership = false;

    try {
      const dbMembership = await this.prisma.membership.findFirst({
        where: {
          userId,
          isActive: true,
          endDate: { gte: new Date() },
        },
        include: { plan: true },
      });

      if (dbMembership?.plan && dbMembership.plan.isActive !== false) {
        resolvedPlan = dbMembership.plan;
        isActiveMembership = true;
      }
    } catch {
      // ignore
    }

    // 3. Default: If no active membership, resolve the active Free/default plan from DB
    if (!resolvedPlan) {
      try {
        resolvedPlan = await this.prisma.membershipPlan.findFirst({
          where: {
            isActive: true,
            OR: [{ tier: 'FREE' }, { price: 0 }],
          },
          orderBy: { displayOrder: 'asc' },
        });
      } catch {
        // ignore
      }
    }

    // 4. Default fallback object if DB has no plans configured
    if (!resolvedPlan) {
      resolvedPlan = {
        id: 'plan-free-default',
        name: 'Free Plan',
        tier: 'FREE',
        maxContacts: 0,
        maxInterests: 0,
        hasChat: false,
        hasAiMatch: false,
        hasVideoProfile: false,
        features: [],
      };
    }

    // Extract raw features array
    const features: string[] = Array.isArray(resolvedPlan.features)
      ? resolvedPlan.features
      : typeof resolvedPlan.features === 'string'
      ? [resolvedPlan.features]
      : [];

    const hasFeature = (keyword: string) =>
      features.some((f) => f.toLowerCase().includes(keyword.toLowerCase()));

    // 6. Contact view limits & usage calculation
    const maxContacts = Number(resolvedPlan.maxContacts ?? resolvedPlan.contactLimit ?? 0);
    const contactsEnabled = maxContacts !== 0 || hasFeature('contact');
    const unlockedIds = await this.getUnlockedContactIds(userId);
    const usedContacts = unlockedIds.length;
    const remainingContacts =
      maxContacts === -1
        ? 999999
        : maxContacts <= 0
        ? 0
        : Math.max(0, maxContacts - usedContacts);

    // 7. Express interests limit & usage calculation
    const maxInterests = Number(resolvedPlan.maxInterests ?? 0);
    const interestsEnabled = maxInterests !== 0 || hasFeature('interest');
    let usedInterests = 0;
    try {
      usedInterests = await this.prisma.interest.count({
        where: { senderId: userId },
      });
    } catch {
      usedInterests = 0;
    }
    const remainingInterests =
      maxInterests === -1
        ? 999999
        : maxInterests <= 0
        ? 0
        : Math.max(0, maxInterests - usedInterests);

    // 8. Dynamic Feature Boolean capabilities based purely on DB plan configuration
    const hasChat = Boolean(resolvedPlan.hasChat) || hasFeature('chat') || hasFeature('message');
    const hasAiMatch = Boolean(resolvedPlan.hasAiMatch) || hasFeature('ai match') || hasFeature('ai-match');
    const hasVideoProfile = Boolean(resolvedPlan.hasVideoProfile) || hasFeature('video');
    const hasAdvancedSearch = hasFeature('advanced search');
    const hasProfileHighlight = hasFeature('profile highlighting') || hasFeature('highlight');
    const hasPriorityListing = hasFeature('priority listing');
    const hasVerificationBadge = hasFeature('verification badge') || hasFeature('verified');
    const hasWhatsappConnect = hasFeature('whatsapp');
    const dedicatedManagerFeature = hasFeature('manager');
    const prioritySupportFeature = hasFeature('support');

    // Elite plan / category classification
    // Business rule: membershipCategory must have ONLY two values: 'GENERAL' or 'ELITE'.
    // 'GOLD' is a plan tier, never a membership category.
    // Elite plan family: elite-plan-silver, elite-plan-gold, elite-plan-platinum -> category ELITE
    // Regular plans (e.g. regular Gold Plan) -> category GENERAL
    let isElite = this.eliteQualService.isElitePlan(resolvedPlan);
    let category: 'GENERAL' | 'ELITE' = isElite ? 'ELITE' : 'GENERAL';
    if (userId) {
      try {
        const userProf = await this.prisma.profile.findFirst({
          where: { userId },
          include: {
            membership: { include: { plan: true } },
          },
        });
        if (userProf) {
          const threshold = await this.eliteQualService.getEliteThreshold();
          const evaluation = this.eliteQualService.evaluateProfile(userProf, threshold);
          category = evaluation.membershipCategory;
          isElite = evaluation.isElite;
        }
      } catch {
        // ignore
      }
    }

    const hasHoroscopeMatchingOnPlan =
      hasFeature('horoscope matching report') ||
      hasFeature('horoscope matching') ||
      hasFeature('horoscope report') ||
      hasFeature('horoscope-matching');

    // Rule: Horoscope Matching is EXCLUSIVELY for Elite members whose plan has Horoscope Matching enabled by Admin.
    // General members (whose net worth is < elite threshold / general category) CANNOT access or view horoscope matching.
    const isEliteCategory = category === 'ELITE' || isElite;
    const canAccessHoroscopeMatching = Boolean(isEliteCategory && hasHoroscopeMatchingOnPlan);
    const hasHoroscopeReport = canAccessHoroscopeMatching;
    const hasHoroscope = canAccessHoroscopeMatching;

    // Filter out horoscope perks from features list for General category members
    const effectiveFeatures = isEliteCategory
      ? features
      : features.filter(
          (f) =>
            typeof f === 'string' &&
            !f.toLowerCase().includes('horoscope'),
        );

    const profileViewUsage = await this.getDailyProfileViewUsage(userId);
    const profileViews = {
      enabled: true,
      max: profileViewUsage.max,
      usedToday: profileViewUsage.usedToday,
      remainingToday: profileViewUsage.remainingToday,
      isRestricted: profileViewUsage.isRestricted,
      viewedOwnerIdsToday: profileViewUsage.viewedOwnerIdsToday,
    };

    return {
      userId,
      planId: resolvedPlan.id,
      planName: resolvedPlan.name,
      tier: (resolvedPlan.tier || 'FREE').toUpperCase(),
      category,
      isElite,
      isActive: isActiveMembership || resolvedPlan.tier === 'FREE' || Number(resolvedPlan.price ?? 0) === 0,
      isStaff: false,
      contacts: {
        enabled: contactsEnabled,
        max: maxContacts,
        used: usedContacts,
        remaining: remainingContacts,
        unlockedIds,
      },
      interests: {
        enabled: interestsEnabled,
        max: maxInterests,
        used: usedInterests,
        remaining: remainingInterests,
      },
      profileViews,
      hasChat,
      hasAiMatch,
      hasVideoProfile,
      hasHoroscope,
      hasHoroscopeReport,
      canAccessHoroscopeMatching,
      hasAdvancedSearch,
      hasProfileHighlight,
      hasPriorityListing,
      hasVerificationBadge,
      hasWhatsappConnect,
      hasDedicatedManager: dedicatedManagerFeature,
      hasPrioritySupport: prioritySupportFeature,
      features: effectiveFeatures,
    };
  }

  /**
   * Helper to retrieve all contact IDs (profile IDs & user IDs) unlocked by this user
   */
  private async getUnlockedContactIds(userId: string): Promise<string[]> {
    const idSet = new Set<string>();

    try {
      const dbUnlocks = await this.prisma.contactUnlock.findMany({
        where: { unlockedById: userId },
        include: { profile: true },
      });
      for (const u of dbUnlocks) {
        idSet.add(u.profileId);
        if (u.profile?.userId) idSet.add(u.profile.userId);
      }
    } catch {
      // ignore
    }

    return Array.from(idSet);
  }

  /**
   * Calculates the exact start of calendar day (00:00:00) in the specified timezone as a UTC Date.
   * Default timezone: 'Asia/Kolkata' (IST, UTC+05:30).
   */
  getStartOfDayUtc(timeZone = 'Asia/Kolkata', refDate = new Date()): Date {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false,
    });
    const parts = formatter.formatToParts(refDate);
    const getPart = (type: string) => parts.find((p) => p.type === type)?.value;

    const hour = parseInt(getPart('hour') || '0', 10);
    const minute = parseInt(getPart('minute') || '0', 10);
    const second = parseInt(getPart('second') || '0', 10);

    const msSinceMidnight =
      ((hour * 60 + minute) * 60 + second) * 1000 + (refDate.getTime() % 1000);
    return new Date(refDate.getTime() - msSinceMidnight);
  }

  /**
   * Dynamically resolves the Free plan daily profile view limit from:
   * 1. system_settings in the database Setting table (or devStore in memory)
   * 2. The active Free Plan's features list (e.g. "5 Profile Views / day")
   * Default fallback is 5 if not configured anywhere.
   */
  async getFreeDailyProfileViewLimit(): Promise<number> {
    // 1. Check system_settings in Setting table
    try {
      const setting = await this.prisma.setting.findUnique({
        where: { key: 'system_settings' },
      });
      if (setting?.value) {
        const parsed = JSON.parse(setting.value);
        const limitVal = parsed.freeDailyProfileViewLimit ?? parsed.dailyProfileViewLimit;
        if (limitVal !== undefined && limitVal !== null && !isNaN(Number(limitVal)) && Number(limitVal) >= 0) {
          return Number(limitVal);
        }
      }
    } catch {
      // ignore
    }

    // Check devStore systemSettings in-memory fallback
    try {
      const devStoreSettings = (devStore as any)?.systemSettings;
      if (devStoreSettings) {
        const limitVal = devStoreSettings.freeDailyProfileViewLimit ?? devStoreSettings.dailyProfileViewLimit;
        if (limitVal !== undefined && limitVal !== null && !isNaN(Number(limitVal)) && Number(limitVal) >= 0) {
          return Number(limitVal);
        }
      }
    } catch {
      // ignore
    }

    // 2. Check Free plan features array in MembershipPlan table
    try {
      const freePlan = await this.prisma.membershipPlan.findFirst({
        where: {
          isActive: true,
          OR: [{ tier: 'FREE' }, { price: 0 }],
        },
        orderBy: { displayOrder: 'asc' },
      });
      if (freePlan?.features) {
        const feats: string[] = Array.isArray(freePlan.features)
          ? (freePlan.features as any)
          : typeof freePlan.features === 'string'
          ? JSON.parse(freePlan.features)
          : [];
        for (const f of feats) {
          const match =
            typeof f === 'string' &&
            f.match(/(\d+)\s*profile\s*views?(?:\s*(?:\/|per)\s*day)?/i);
          if (match && match[1]) {
            return parseInt(match[1], 10);
          }
        }
      }
    } catch {
      // ignore
    }

    return 5;
  }

  /**
   * Retrieves current daily profile view usage for a user.
   */
  async getDailyProfileViewUsage(userId: string): Promise<{
    isStaff: boolean;
    isFreeTier: boolean;
    max: number;
    usedToday: number;
    remainingToday: number;
    isRestricted: boolean;
    viewedOwnerIdsToday: string[];
  }> {
    if (!userId) {
      return {
        isStaff: false,
        isFreeTier: true,
        max: 5,
        usedToday: 0,
        remainingToday: 5,
        isRestricted: false,
        viewedOwnerIdsToday: [],
      };
    }

    // 1. Check if staff
    let isStaff = false;
    try {
      const userRoles = await this.prisma.userRole.findMany({
        where: { userId },
        include: { role: true },
      });
      isStaff = userRoles.some((ur: any) =>
        ['SUPER_ADMIN', 'ADMIN'].includes(ur.role?.name),
      );
    } catch {
      // ignore
    }

    if (isStaff) {
      return {
        isStaff: true,
        isFreeTier: false,
        max: -1,
        usedToday: 0,
        remainingToday: 999999,
        isRestricted: false,
        viewedOwnerIdsToday: [],
      };
    }

    // 2. Check if user has an active non-expired paid membership
    let isPaid = false;
    try {
      const dbMembership = await this.prisma.membership.findFirst({
        where: {
          userId,
          isActive: true,
          endDate: { gte: new Date() },
        },
        include: { plan: true },
      });
      if (
        dbMembership?.plan &&
        dbMembership.plan.tier !== 'FREE' &&
        Number(dbMembership.plan.price ?? 0) > 0
      ) {
        isPaid = true;
      }
    } catch {
      // ignore
    }

    const startOfDayUtc = this.getStartOfDayUtc('Asia/Kolkata');
    let viewedOwnerIdsToday: string[] = [];
    try {
      const views = await this.prisma.profileView.findMany({
        where: {
          viewerId: userId,
          createdAt: { gte: startOfDayUtc },
        },
        select: { ownerId: true },
      });
      viewedOwnerIdsToday = Array.from(new Set(views.map((v) => v.ownerId)));
    } catch {
      // ignore
    }

    if (isPaid) {
      return {
        isStaff: false,
        isFreeTier: false,
        max: -1,
        usedToday: viewedOwnerIdsToday.length,
        remainingToday: 999999,
        isRestricted: false,
        viewedOwnerIdsToday,
      };
    }

    // 3. Free tier user
    const max = await this.getFreeDailyProfileViewLimit();
    const usedToday = viewedOwnerIdsToday.length;
    const remainingToday = max === -1 ? 999999 : Math.max(0, max - usedToday);
    const isRestricted = max !== -1 && usedToday >= max;

    return {
      isStaff: false,
      isFreeTier: true,
      max,
      usedToday,
      remainingToday,
      isRestricted,
      viewedOwnerIdsToday,
    };
  }

  /**
   * Evaluates if a viewer user is allowed to view the target owner profile today.
   * If the target owner was already viewed today, access is allowed without consuming extra limit.
   */
  async checkCanViewProfile(
    viewerUserId: string,
    targetOwnerUserId: string,
    isStaff = false,
  ): Promise<{
    allowed: boolean;
    reason?: string;
    isAlreadyViewedToday: boolean;
  }> {
    if (isStaff || viewerUserId === targetOwnerUserId) {
      return { allowed: true, isAlreadyViewedToday: true };
    }

    const usage = await this.getDailyProfileViewUsage(viewerUserId);
    if (!usage.isFreeTier) {
      return {
        allowed: true,
        isAlreadyViewedToday: usage.viewedOwnerIdsToday.includes(targetOwnerUserId),
      };
    }

    const isAlreadyViewedToday = usage.viewedOwnerIdsToday.includes(targetOwnerUserId);
    if (isAlreadyViewedToday) {
      return { allowed: true, isAlreadyViewedToday: true };
    }

    if (usage.isRestricted) {
      return {
        allowed: false,
        reason:
          'You have reached your daily profile view limit. Upgrade your membership to view more profiles.',
        isAlreadyViewedToday: false,
      };
    }

    return { allowed: true, isAlreadyViewedToday: false };
  }

  /**
   * Idempotently records a profile view for today in the profile_views table.
   * Avoids duplicate records for the same viewer and owner on the same day.
   */
  async recordProfileView(viewerUserId: string, targetOwnerUserId: string): Promise<boolean> {
    if (!viewerUserId || !targetOwnerUserId || viewerUserId === targetOwnerUserId) {
      return false;
    }
    const startOfDayUtc = this.getStartOfDayUtc('Asia/Kolkata');
    try {
      const existing = await this.prisma.profileView.findFirst({
        where: {
          viewerId: viewerUserId,
          ownerId: targetOwnerUserId,
          createdAt: { gte: startOfDayUtc },
        },
      });
      if (!existing) {
        await this.prisma.profileView.create({
          data: {
            viewerId: viewerUserId,
            ownerId: targetOwnerUserId,
          },
        });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}
