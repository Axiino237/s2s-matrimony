import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Razorpay = require('razorpay');
import { createHmac, timingSafeEqual } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { devPlansStore, devUnlockedContactsStore, devStore, DevPlan, devPaymentsStore } from '../common/dev-store';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  private get isProduction() {
    return this.configService.get<string>('NODE_ENV') === 'production';
  }

  private get allowMockPayments() {
    return !this.isProduction && this.configService.get<string>('ALLOW_MOCK_PAYMENTS', 'true') === 'true';
  }

  private async getRazorpayKeys() {
    let keyId = this.configService.get<string>('RAZORPAY_KEY_ID');
    let keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET');

    if (!keyId || keyId.includes('XXXXXXXX') || !keySecret || keySecret.includes('your-')) {
      const sysSettings = (devStore as any).systemSettings || {};
      if (sysSettings.razorpayKeyId && sysSettings.razorpayKeySecret) {
        keyId = sysSettings.razorpayKeyId;
        keySecret = sysSettings.razorpayKeySecret;
      } else {
        try {
          const rec = await this.prisma.setting.findUnique({ where: { key: 'system_settings' } });
          if (rec?.value) {
            const parsed = JSON.parse(rec.value);
            if (parsed.razorpayKeyId && parsed.razorpayKeySecret) {
              keyId = parsed.razorpayKeyId;
              keySecret = parsed.razorpayKeySecret;
            }
          }
        } catch {}
      }
    }

    const hasRealKeys = !!keyId && !keyId.includes('XXXXXXXX') && keyId.startsWith('rzp_');
    return hasRealKeys ? { keyId: keyId!, keySecret: keySecret || '' } : null;
  }

  async getPlans() {
    let resultPlans: any[] = [];

    try {
      const plans = await this.prisma.membershipPlan.findMany({
        where: { isActive: true },
      });
      if (plans && plans.length > 0) {
        resultPlans = plans.map((p) => {
          let tier = p.tier as string;
          if (tier === 'DIAMOND' || p.name === 'Diamond Plan' || p.name === 'Diamond') {
            tier = 'ELITE';
          }
          return {
            ...p,
            tier,
            contactLimit: p.maxContacts ?? (tier === 'FREE' ? 5 : tier === 'SILVER' ? 50 : tier === 'GOLD' ? 100 : 999),
          };
        });
      }
    } catch {
      // Fallback
    }

    if (resultPlans.length === 0) {
      resultPlans = [...devPlansStore];
    }

    const getPlanRank = (plan: any): number => {
      const tier = (plan.tier || '').toUpperCase();
      const name = (plan.name || '').toLowerCase();

      if (tier === 'FREE' || name.includes('free')) return 1;
      if (tier === 'SILVER' || name.includes('silver')) return 2;
      if (tier === 'GOLD' || name.includes('gold')) return 3;
      if (tier === 'ELITE' || name.includes('elite')) return 4;
      if (tier === 'PLATINUM' || name.includes('platinum')) return 5;
      if (tier === 'DIAMOND' || name.includes('diamond')) return 6;
      return 100; // Custom / newly added plans go at the end
    };

    return resultPlans.sort((a, b) => {
      const rankA = getPlanRank(a);
      const rankB = getPlanRank(b);
      if (rankA !== rankB) return rankA - rankB;
      const pA = parseFloat(String(a.price).replace(/[^\d.]/g, '') || '0');
      const pB = parseFloat(String(b.price).replace(/[^\d.]/g, '') || '0');
      return pA - pB;
    });
  }

  async createPlan(data: any) {
    const planId = data.id || `plan-${Date.now()}`;
    const name = data.name || 'New Membership Plan';
    let tier = (data.tier || 'SILVER').toUpperCase();
    if (tier === 'DIAMOND') tier = 'ELITE';
    const price = String(data.price ?? 999);
    const durationMonths = Number(data.durationMonths || 3);
    const contactLimit = Number(data.contactViewLimit ?? data.contactLimit ?? 50);
    const features = Array.isArray(data.features) ? data.features : ['Contact Views', 'Direct Chat'];
    const isActive = data.isActive !== false;
    const isPopular = data.isPopular === true;

    try {
      const created = await this.prisma.membershipPlan.create({
        data: {
          id: planId,
          name,
          tier: tier as any,
          price: Number(price),
          durationMonths,
          maxContacts: contactLimit,
          features,
          isActive,
          isPopular,
        },
      });

      const devItem: DevPlan = {
        id: created.id,
        name: created.name,
        tier: tier as any,
        price: String(created.price),
        duration: `${created.durationMonths} months`,
        contactLimit: created.maxContacts,
        features: created.features as string[],
        isActive: created.isActive,
        isPopular: created.isPopular,
      };
      devPlansStore.push(devItem);

      return {
        ...created,
        durationMonths,
        contactLimit,
        contactViewLimit: contactLimit,
      };
    } catch {
      // Fallback
    }

    const devItem: DevPlan = {
      id: planId,
      name,
      tier: tier as any,
      price,
      duration: `${durationMonths} months`,
      contactLimit,
      features,
      isActive,
      isPopular,
    };
    devPlansStore.push(devItem);

    return {
      id: planId,
      name,
      tier,
      price: Number(price),
      durationMonths,
      contactLimit,
      contactViewLimit: contactLimit,
      features,
      isActive,
      isPopular,
    };
  }

  async updatePlan(planId: string, patch: any) {
    const name = patch.name;
    let tier = patch.tier ? String(patch.tier).toUpperCase() : undefined;
    if (tier === 'DIAMOND') tier = 'ELITE';
    const price = patch.price !== undefined ? Number(patch.price) : undefined;
    const durationMonths = patch.durationMonths !== undefined ? Number(patch.durationMonths) : undefined;
    const contactLimit = patch.contactViewLimit !== undefined ? Number(patch.contactViewLimit) : patch.contactLimit !== undefined ? Number(patch.contactLimit) : undefined;
    const features = Array.isArray(patch.features) ? patch.features : undefined;
    const isActive = patch.isActive !== undefined ? Boolean(patch.isActive) : undefined;
    const isPopular = patch.isPopular !== undefined ? Boolean(patch.isPopular) : undefined;

    try {
      const existing = await this.prisma.membershipPlan.findUnique({ where: { id: planId } });
      if (existing) {
        const updated = await this.prisma.membershipPlan.update({
          where: { id: planId },
          data: {
            name: name || existing.name,
            tier: (tier as any) || existing.tier,
            price: price !== undefined ? price : existing.price,
            durationMonths: durationMonths !== undefined ? durationMonths : existing.durationMonths,
            maxContacts: contactLimit !== undefined ? contactLimit : existing.maxContacts,
            features: features !== undefined ? features : existing.features,
            isActive: isActive !== undefined ? isActive : existing.isActive,
            isPopular: isPopular !== undefined ? isPopular : existing.isPopular,
          },
        });

        const idx = devPlansStore.findIndex((p) => p.id === planId);
        if (idx >= 0) {
          devPlansStore[idx] = {
            ...devPlansStore[idx],
            name: updated.name,
            tier: updated.tier as any,
            price: String(updated.price),
            contactLimit: updated.maxContacts,
            isActive: updated.isActive,
            isPopular: updated.isPopular,
          };
        }

        return {
          ...updated,
          contactLimit: updated.maxContacts,
          contactViewLimit: updated.maxContacts,
        };
      }
    } catch {
      // Fallback
    }

    const idx = devPlansStore.findIndex((p) => p.id === planId);
    if (idx >= 0) {
      devPlansStore[idx] = {
        ...devPlansStore[idx],
        ...(name && { name }),
        ...(tier && { tier: tier as any }),
        ...(price !== undefined && { price: String(price) }),
        ...(contactLimit !== undefined && { contactLimit }),
        ...(features && { features }),
        ...(isActive !== undefined && { isActive }),
        ...(isPopular !== undefined && { isPopular }),
      };
      return {
        ...devPlansStore[idx],
        contactViewLimit: devPlansStore[idx].contactLimit,
        price: Number(devPlansStore[idx].price),
      };
    }

    return this.createPlan({ id: planId, ...patch });
  }

  async deletePlan(planId: string) {
    try {
      await this.prisma.membershipPlan.delete({ where: { id: planId } }).catch(() => null);
    } catch {
      // Fallback
    }

    const idx = devPlansStore.findIndex((p) => p.id === planId);
    if (idx >= 0) {
      devPlansStore.splice(idx, 1);
    }

    return { success: true, message: 'Plan deleted successfully', id: planId };
  }

  async togglePlanActive(planId: string, isActive?: boolean) {
    return this.updatePlan(planId, { isActive });
  }

  async getUnlockedContacts(userId: string) {
    let userTier = 'FREE';
    let contactLimit = 5;

    try {
      const dbMembership = await this.prisma.membership.findFirst({
        where: { userId, isActive: true },
        include: { plan: true },
      });

      if (dbMembership) {
        userTier = (dbMembership.tier || dbMembership.plan?.tier || 'FREE').toUpperCase();
        contactLimit = dbMembership.plan?.maxContacts ?? (userTier === 'FREE' ? 5 : userTier === 'SILVER' ? 50 : userTier === 'ELITE' ? 100 : 999);
      } else {
        const userDev = devStore.get(userId);
        userTier = (userDev?.membershipTier || 'FREE').toUpperCase();
        const activePlan = devPlansStore.find((p) => p.tier === userTier) || devPlansStore[0];
        contactLimit = activePlan.contactLimit;
      }
    } catch {
      const userDev = devStore.get(userId);
      userTier = (userDev?.membershipTier || 'FREE').toUpperCase();
      const activePlan = devPlansStore.find((p) => p.tier === userTier) || devPlansStore[0];
      contactLimit = activePlan.contactLimit;
    }

    const unlockedIdsSet = new Set<string>();
    const uniqueProfilesSet = new Set<string>();

    try {
      const dbUnlocks = await this.prisma.contactUnlock.findMany({
        where: { unlockedById: userId },
        include: { profile: true },
      });
      for (const u of dbUnlocks) {
        unlockedIdsSet.add(u.profileId);
        if (u.profile?.userId) unlockedIdsSet.add(u.profile.userId);
        uniqueProfilesSet.add(u.profileId);
      }
    } catch {
      // Ignore DB error
    }

    const rawDevIds = Array.from(devUnlockedContactsStore.get(userId) || new Set<string>());
    if (rawDevIds.length > 0) {
      try {
        const matchedProfiles = await this.prisma.profile.findMany({
          where: {
            OR: [
              { id: { in: rawDevIds } },
              { userId: { in: rawDevIds } },
            ],
          },
        });

        const matchedIdSet = new Set<string>();
        for (const p of matchedProfiles) {
          unlockedIdsSet.add(p.id);
          if (p.userId) unlockedIdsSet.add(p.userId);
          uniqueProfilesSet.add(p.id);
          matchedIdSet.add(p.id);
          if (p.userId) matchedIdSet.add(p.userId);
        }

        for (const id of rawDevIds) {
          if (!matchedIdSet.has(id)) {
            unlockedIdsSet.add(id);
            uniqueProfilesSet.add(id);
          }
        }
      } catch {
        for (const id of rawDevIds) {
          unlockedIdsSet.add(id);
          uniqueProfilesSet.add(id);
        }
      }
    }

    const unlockedIds = Array.from(unlockedIdsSet);
    const usedCount = uniqueProfilesSet.size;
    const remaining = contactLimit < 0 || contactLimit >= 999 ? 999999 : Math.max(0, contactLimit - usedCount);

    return {
      tier: userTier,
      contactLimit,
      usedCount,
      remaining,
      unlockedIds,
    };
  }

  async unlockContact(userId: string, targetUserId: string) {
    const status = await this.getUnlockedContacts(userId);

    const existingProfile = await this.prisma.profile.findFirst({
      where: { OR: [{ id: targetUserId }, { userId: targetUserId }] },
    }).catch(() => null);

    const canonicalProfileId = existingProfile?.id || targetUserId;
    const canonicalUserId = existingProfile?.userId;

    const isAlreadyUnlocked =
      status.unlockedIds.includes(targetUserId) ||
      status.unlockedIds.includes(canonicalProfileId) ||
      Boolean(canonicalUserId && status.unlockedIds.includes(canonicalUserId));

    if (isAlreadyUnlocked) {
      return {
        success: true,
        alreadyUnlocked: true,
        ...status,
      };
    }

    if (status.usedCount >= status.contactLimit && status.contactLimit < 999) {
      throw new BadRequestException(
        `Contact limit reached (${status.usedCount}/${status.contactLimit}) for your ${status.tier} plan. Upgrade to unlock more contacts!`,
      );
    }

    if (existingProfile) {
      await this.prisma.contactUnlock.create({
        data: { unlockedById: userId, profileId: existingProfile.id },
      }).catch(() => null);
    }

    const devUnlockedSet = devUnlockedContactsStore.get(userId) || new Set<string>();
    devUnlockedSet.add(targetUserId);
    if (canonicalUserId) devUnlockedSet.add(canonicalUserId);
    devUnlockedContactsStore.set(userId, devUnlockedSet);

    return this.getUnlockedContacts(userId);

    return this.getUnlockedContacts(userId);
  }

  async createRazorpayOrder(userId: string, planId: string) {
    const plan = await this.prisma.membershipPlan.findUnique({ where: { id: planId } }).catch(() => null);
    const devPlan = devPlansStore.find((p) => p.id === planId) || devPlansStore[1];
    const price = plan ? Number(plan.price) : Number(String(devPlan.price).replace(/[^\d.]/g, '') || '599');

    const amountInPaise = Math.round(price * 100);
    const keys = await this.getRazorpayKeys();

    let razorpayOrderId = `order_mock_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    if (keys) {
      try {
        const RazorpayClass = typeof Razorpay === 'function' ? Razorpay : (Razorpay as any).default || Razorpay;
        const rzp = new RazorpayClass({
          key_id: keys.keyId,
          key_secret: keys.keySecret,
        });
        const order = await rzp.orders.create({
          amount: amountInPaise,
          currency: 'INR',
          receipt: `s2s_${Date.now()}`,
        });
        razorpayOrderId = order.id;
      } catch (err: any) {
        console.error('Razorpay Order Creation Notice:', err?.message || err);
      }
    }

    // Record in dev store for instant UI updates
    const devRecord = {
      id: `pay_${Date.now()}`,
      userId,
      planName: plan?.name || devPlan.name || 'Membership Upgrade',
      tier: plan?.tier || devPlan.tier || 'ELITE',
      amount: price,
      currency: 'INR',
      status: 'PENDING',
      razorpayOrderId,
      razorpayPaymentId: 'Pending Verification',
      createdAt: new Date().toISOString(),
    };
    devPaymentsStore.unshift(devRecord);

    try {
      const payment = await this.prisma.payment.create({
        data: {
          userId,
          planId: plan?.id || devPlan.id,
          amount: price,
          currency: 'INR',
          status: 'PENDING',
          razorpayOrderId,
        },
      });

      return {
        paymentId: payment.id,
        razorpayOrderId,
        amount: amountInPaise,
        currency: 'INR',
        key: keys?.keyId || 'rzp_test_XXXXXXXXXXXX',
        mock: !keys,
      };
    } catch {
      // Fallback
    }

    return {
      paymentId: `pay-${Date.now()}`,
      razorpayOrderId,
      amount: amountInPaise,
      currency: 'INR',
      key: keys?.keyId || 'rzp_test_XXXXXXXXXXXX',
      mock: !keys,
    };
  }

  async verifyPayment(userId: string, data: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }) {
    const keys = await this.getRazorpayKeys();

    if (keys && keys.keySecret && data.razorpaySignature && !data.razorpayOrderId.startsWith('order_mock_')) {
      const isValid = this.isValidRazorpaySignature(data, keys.keySecret);
      if (!isValid) {
        throw new BadRequestException('Invalid Razorpay payment signature verification failed');
      }
    }

    try {
      const payment = await this.prisma.payment.findFirst({
        where: { razorpayOrderId: data.razorpayOrderId },
        include: { plan: true },
      });

      if (payment) {
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'SUCCESS',
            razorpayPaymentId: data.razorpayPaymentId,
            razorpaySignature: data.razorpaySignature,
          },
        });

        if (payment.plan) {
          await (this.prisma.user as any).update({
            where: { id: userId },
            data: { membershipStatus: payment.plan.tier || 'ELITE' },
          }).catch(() => null);
        }
      }
    } catch {
      // Fallback
    }

    const devItem = devPaymentsStore.find((p) => p.razorpayOrderId === data.razorpayOrderId || (p.userId === userId && p.status === 'PENDING'));
    if (devItem) {
      devItem.status = 'SUCCESS';
      devItem.razorpayPaymentId = data.razorpayPaymentId;
    }

    const userDev = devStore.get(userId);
    if (userDev) {
      devStore.update(userId, { membershipTier: 'ELITE' });
    }

    return { success: true, message: 'Payment verified and plan activated successfully 🎉' };
  }

  async getUserPaymentHistory(userId: string) {
    let dbPayments: any[] = [];
    try {
      const records = await this.prisma.payment.findMany({
        where: { userId },
        include: { plan: true },
        orderBy: { createdAt: 'desc' },
      });
      if (records && records.length > 0) {
        dbPayments = records.map((p) => ({
          id: p.id,
          planName: p.plan?.name || 'Membership Upgrade',
          tier: p.plan?.tier || 'PREMIUM',
          amount: Number(p.amount),
          currency: p.currency || 'INR',
          status: p.status,
          razorpayOrderId: p.razorpayOrderId,
          razorpayPaymentId: p.razorpayPaymentId || 'N/A',
          createdAt: p.createdAt,
        }));
      }
    } catch {}

    const devUserPayments = devPaymentsStore.filter((p) => p.userId === userId);

    const merged = [...dbPayments];
    for (const dp of devUserPayments) {
      if (!merged.some((m) => m.razorpayOrderId === dp.razorpayOrderId)) {
        merged.push(dp);
      }
    }

    return merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  private isValidRazorpaySignature(
    data: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string },
    keySecret: string,
  ) {
    const expectedSignature = createHmac('sha256', keySecret)
      .update(`${data.razorpayOrderId}|${data.razorpayPaymentId}`)
      .digest('hex');

    const expected = Buffer.from(expectedSignature, 'hex');
    const received = Buffer.from(data.razorpaySignature, 'hex');
    return expected.length === received.length && timingSafeEqual(expected, received);
  }
}
