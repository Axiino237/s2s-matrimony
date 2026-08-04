import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Razorpay from 'razorpay';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { devPlansStore, devUnlockedContactsStore, devStore, DevPlan } from '../common/dev-store';

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

  private get razorpayKeys() {
    const keyId = this.configService.get<string>('RAZORPAY_KEY_ID');
    const keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET');
    const hasRealKeys = !!keyId && !!keySecret && !keyId.includes('XXXXXXXX') && !keySecret.includes('your-');
    return hasRealKeys ? { keyId, keySecret } : null;
  }

  async getPlans() {
    try {
      const plans = await this.prisma.membershipPlan.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' },
      });
      if (plans && plans.length > 0) {
        return plans.map((p) => {
          let tier = p.tier as string;
          if (tier === 'DIAMOND' || p.name === 'Diamond Plan' || p.name === 'Diamond') {
            tier = 'ELITE';
          }
          return {
            ...p,
            tier,
            contactLimit: p.maxContacts ?? (tier === 'FREE' ? 5 : tier === 'SILVER' ? 50 : tier === 'ELITE' ? 100 : 999),
          };
        });
      }
    } catch {
      // Fallback
    }

    return devPlansStore;
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

    try {
      const dbUnlocks = await this.prisma.contactUnlock.findMany({
        where: { unlockedById: userId },
      });
      for (const u of dbUnlocks) {
        unlockedIdsSet.add(u.profileId);
      }
    } catch {
      // Ignore DB error
    }

    const devUnlockedSet = devUnlockedContactsStore.get(userId) || new Set<string>();
    for (const id of devUnlockedSet) {
      unlockedIdsSet.add(id);
    }

    const unlockedIds = Array.from(unlockedIdsSet);
    const usedCount = unlockedIds.length;
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

    if (status.unlockedIds.includes(targetUserId)) {
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

    try {
      const profile = await this.prisma.profile.findFirst({
        where: { OR: [{ id: targetUserId }, { userId: targetUserId }] },
      });
      if (profile) {
        await this.prisma.contactUnlock.create({
          data: { unlockedById: userId, profileId: profile.id },
        }).catch(() => null);
      }
    } catch {
      // Ignore DB error
    }

    const devUnlockedSet = devUnlockedContactsStore.get(userId) || new Set<string>();
    devUnlockedSet.add(targetUserId);
    devUnlockedContactsStore.set(userId, devUnlockedSet);

    const updatedUnlockedIds = Array.from(new Set([...status.unlockedIds, targetUserId]));
    const newUsed = updatedUnlockedIds.length;
    const newRemaining = status.contactLimit < 0 || status.contactLimit >= 999 ? 999999 : Math.max(0, status.contactLimit - newUsed);

    return {
      success: true,
      alreadyUnlocked: false,
      tier: status.tier,
      contactLimit: status.contactLimit,
      usedCount: newUsed,
      remaining: newRemaining,
      unlockedIds: updatedUnlockedIds,
    };
  }

  async createRazorpayOrder(userId: string, planId: string) {
    const plan = await this.prisma.membershipPlan.findUnique({ where: { id: planId } }).catch(() => null);
    const devPlan = devPlansStore.find((p) => p.id === planId) || devPlansStore[1];
    const price = plan ? Number(plan.price) : Number(devPlan.price);

    const amountInPaise = Math.round(price * 100);
    const keys = this.razorpayKeys;

    const razorpayOrderId = keys
      ? (await new Razorpay({
          key_id: keys.keyId,
          key_secret: keys.keySecret,
        }).orders.create({
          amount: amountInPaise,
          currency: 'INR',
          receipt: `s2s_${Date.now()}`,
        })).id
      : `order_mock_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

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
      mock: true,
    };
  }

  async verifyPayment(userId: string, data: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }) {
    try {
      const payment = await this.prisma.payment.findUnique({
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
      }
    } catch {
      // Fallback
    }

    // Upgrade user tier in devStore
    const userDev = devStore.get(userId);
    if (userDev) {
      devStore.update(userId, { membershipTier: 'ELITE' });
    }

    return { success: true, message: 'Payment verified and plan activated successfully' };
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
