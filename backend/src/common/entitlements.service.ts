import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
}
