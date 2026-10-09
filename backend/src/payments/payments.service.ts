import { Injectable, NotFoundException, BadRequestException, ForbiddenException, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Razorpay = require('razorpay');
import { createHmac, timingSafeEqual } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { EntitlementsService } from '../common/entitlements.service';

export function sanitizePlanFeatures(
  rawFeatures: any,
  maxInterests?: number,
  hasChat?: boolean,
  hasAiMatch?: boolean,
): string[] {
  const list: string[] = Array.isArray(rawFeatures)
    ? rawFeatures
    : typeof rawFeatures === 'string'
    ? JSON.parse(rawFeatures || '[]')
    : [];

  const forbidden = [
    'whatsapp connect',
    'dedicated manager',
    'dedicated match manager',
    'dedicated relationship manager',
    'video profile',
    'video profile highlight',
    'video highlight',
    'advanced search',
    'chat messaging',
    'chat message',
  ];

  const result: string[] = [];
  const seen = new Set<string>();
  let hasInterest = false;

  for (const item of list) {
    if (!item || typeof item !== 'string') continue;
    const trimmed = item.trim();
    const lower = trimmed.toLowerCase();
    if (forbidden.some((k) => lower.includes(k) || k.includes(lower))) continue;

    let norm = trimmed;
    if (lower === 'direct chat' || lower === 'live chat') {
      norm = 'Direct Live Chat';
    } else if (lower === 'ai-match recommendations' || lower === 'ai match recommendations') {
      norm = 'AI Match Score';
    } else if (lower === 'horoscope matching report') {
      norm = 'Horoscope matching';
    }

    if (norm.toLowerCase().includes('interest')) {
      if (hasInterest) continue;
      if (maxInterests === -1) {
        norm = 'Unlimited Interests';
      } else if (maxInterests !== undefined && maxInterests <= 0) {
        continue;
      } else if (lower === 'send interest' || lower === 'send interests') {
        norm = 'Send interests';
      }
      hasInterest = true;
    }

    const key = norm.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(norm);
    }
  }

  if (hasChat !== undefined) {
    const chatKey = 'direct live chat';
    if (hasChat) {
      if (!seen.has(chatKey)) {
        seen.add(chatKey);
        result.push('Direct Live Chat');
      }
    } else {
      const idx = result.findIndex((f) => f.toLowerCase().includes('chat'));
      if (idx !== -1) result.splice(idx, 1);
    }
  }

  if (hasAiMatch !== undefined) {
    const aiKey = 'ai match score';
    if (hasAiMatch) {
      if (!seen.has(aiKey)) {
        seen.add(aiKey);
        result.push('AI Match Score');
      }
    } else {
      const idx = result.findIndex((f) => f.toLowerCase().includes('ai match'));
      if (idx !== -1) result.splice(idx, 1);
    }
  }

  return result;
}

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly entitlementsService: EntitlementsService,
  ) { }

  private get isProduction() {
    return this.configService.get<string>('NODE_ENV') === 'production';
  }

  private get allowMockPayments() {
    return !this.isProduction && this.configService.get<string>('ALLOW_MOCK_PAYMENTS', 'true') === 'true';
  }

  private async getRazorpayKeys() {
    let keyId = this.configService.get<string>('RAZORPAY_KEY_ID');
    let keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET');
    let source = 'env';

    if (!keyId || keyId.includes('XXXXXXXX') || !keySecret || keySecret.includes('your-')) {
      try {
        const rec = await this.prisma.setting.findUnique({ where: { key: 'system_settings' } });
        if (rec?.value) {
          const parsed = JSON.parse(rec.value);
          if (parsed.razorpayKeyId && parsed.razorpayKeySecret) {
            keyId = parsed.razorpayKeyId;
            keySecret = parsed.razorpayKeySecret;
            source = 'db';
          }
        }
      } catch { }
    }

    const hasRealKeys = !!keyId && !keyId.includes('XXXXXXXX') && keyId.startsWith('rzp_');
    if (hasRealKeys) {
      console.log(`[Razorpay] Using key from ${source}: ${keyId?.substring(0, 20)}...`);
    } else {
      console.warn('[Razorpay] No valid Razorpay keys found in env or DB!');
    }
    return hasRealKeys ? { keyId: keyId!, keySecret: keySecret || '' } : null;
  }

  async getPlans(includeInactive = false, category?: string) {
    const whereClause: any = includeInactive ? {} : { isActive: true };
    if (category) {
      whereClause.category = category.toUpperCase();
    }
    const plans = await this.prisma.membershipPlan.findMany({
      where: whereClause,
      orderBy: { displayOrder: 'asc' },
    });

    const resultPlans = plans.map((p) => {
      const tier = (p.tier as string).toUpperCase();
      const hasChat = Boolean(p.hasChat);
      const hasAiMatch = Boolean(p.hasAiMatch);
      const maxInterests = p.maxInterests ?? 0;
      return {
        ...p,
        category: (p as any).category || 'GENERAL',
        tier,
        price: Number(p.price),
        originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
        contactLimit: p.maxContacts ?? 0,
        contactViewLimit: p.maxContacts ?? 0,
        maxContacts: p.maxContacts ?? 0,
        maxInterests,
        hasChat,
        hasAiMatch,
        hasVideoProfile: Boolean(p.hasVideoProfile),
        features: sanitizePlanFeatures(p.features, maxInterests, hasChat, hasAiMatch),
        isActive: p.isActive,
        isPopular: p.isPopular,
      };
    });

    const getPlanRank = (plan: any): number => {
      const tier = (plan.tier || '').toUpperCase();
      const name = (plan.name || '').toLowerCase();

      if (tier === 'FREE' || name.includes('free')) return 1;
      if (tier === 'SILVER' || name.includes('silver')) return 2;
      if (tier === 'GOLD' || name.includes('gold')) return 3;
      if (tier === 'PLATINUM' || name.includes('platinum')) return 4;
      if (tier === 'ELITE' || name.includes('elite')) return 5;
      if (tier === 'DIAMOND' || name.includes('diamond')) return 6;
      return 100;
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
    const tier = (data.tier || 'SILVER').toUpperCase();
    const category = (data.category || 'GENERAL').toUpperCase();

    if (category === 'ELITE' && tier === 'FREE') {
      throw new BadRequestException('Elite category cannot have a Free plan');
    }

    const price = Number(data.price ?? 999);
    const durationMonths = Number(data.durationMonths || 3);
    const contactLimit = Number(data.contactViewLimit ?? data.contactLimit ?? data.maxContacts ?? 0);
    const maxInterests = Number(data.maxInterests ?? 0);
    const hasChat = Boolean(data.hasChat);
    const hasAiMatch = Boolean(data.hasAiMatch);
    const hasVideoProfile = Boolean(data.hasVideoProfile);
    const rawFeatures = Array.isArray(data.features) ? data.features : ['Contact Views', 'Direct Live Chat'];
    const features = sanitizePlanFeatures(rawFeatures, maxInterests, hasChat, hasAiMatch);
    const isActive = data.isActive !== false;
    const isPopular = data.isPopular === true;

    const created = await this.prisma.membershipPlan.create({
      data: {
        id: planId,
        name,
        tier: tier as any,
        category,
        price,
        durationMonths,
        maxContacts: contactLimit,
        maxInterests,
        hasChat,
        hasAiMatch,
        hasVideoProfile,
        features,
        isActive,
        isPopular,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'PLAN_CREATED',
        entity: 'Plan',
        entityId: created.id,
        newValue: { name, tier, category, price, durationMonths },
      },
    }).catch(() => null);

    return {
      ...created,
      category: (created as any).category || category,
      price: Number(created.price),
      durationMonths,
      contactLimit: created.maxContacts,
      contactViewLimit: created.maxContacts,
      features,
    };
  }

  async updatePlan(planId: string, patch: any) {
    const name = patch.name;
    const tier = patch.tier ? String(patch.tier).toUpperCase() : undefined;
    const category = patch.category ? String(patch.category).toUpperCase() : undefined;
    const price = patch.price !== undefined ? Number(patch.price) : undefined;
    const durationMonths = patch.durationMonths !== undefined ? Number(patch.durationMonths) : undefined;
    const contactLimit = patch.contactViewLimit !== undefined
      ? Number(patch.contactViewLimit)
      : patch.contactLimit !== undefined
        ? Number(patch.contactLimit)
        : patch.maxContacts !== undefined
          ? Number(patch.maxContacts)
          : undefined;
    const maxInterests = patch.maxInterests !== undefined ? Number(patch.maxInterests) : undefined;
    const hasChat = patch.hasChat !== undefined ? Boolean(patch.hasChat) : undefined;
    const hasAiMatch = patch.hasAiMatch !== undefined ? Boolean(patch.hasAiMatch) : undefined;
    const hasVideoProfile = patch.hasVideoProfile !== undefined ? Boolean(patch.hasVideoProfile) : undefined;
    const features = Array.isArray(patch.features) ? patch.features : undefined;
    const isActive = patch.isActive !== undefined ? Boolean(patch.isActive) : undefined;
    const isPopular = patch.isPopular !== undefined ? Boolean(patch.isPopular) : undefined;

    const existing = await this.prisma.membershipPlan.findUnique({ where: { id: planId } });
    if (!existing) {
      throw new NotFoundException(`Membership plan with ID ${planId} not found`);
    }

    const targetCategory = category || (existing as any).category || 'GENERAL';
    const targetTier = tier || existing.tier;
    if (targetCategory === 'ELITE' && targetTier === 'FREE') {
      throw new BadRequestException('Elite category cannot have a Free plan');
    }

    const finalMaxInterests = maxInterests !== undefined ? maxInterests : existing.maxInterests ?? 0;
    const finalHasChat = hasChat !== undefined ? hasChat : Boolean(existing.hasChat);
    const finalHasAiMatch = hasAiMatch !== undefined ? hasAiMatch : Boolean(existing.hasAiMatch);
    const sanitizedFeatures = features !== undefined
      ? sanitizePlanFeatures(features, finalMaxInterests, finalHasChat, finalHasAiMatch)
      : undefined;

    const updated = await this.prisma.membershipPlan.update({
      where: { id: planId },
      data: {
        ...(name && { name }),
        ...(tier && { tier: tier as any }),
        ...(category && { category }),
        ...(price !== undefined && { price }),
        ...(durationMonths !== undefined && { durationMonths }),
        ...(contactLimit !== undefined && { maxContacts: contactLimit }),
        ...(maxInterests !== undefined && { maxInterests }),
        ...(hasChat !== undefined && { hasChat }),
        ...(hasAiMatch !== undefined && { hasAiMatch }),
        ...(hasVideoProfile !== undefined && { hasVideoProfile }),
        ...(sanitizedFeatures !== undefined && { features: sanitizedFeatures }),
        ...(isActive !== undefined && { isActive }),
        ...(isPopular !== undefined && { isPopular }),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'PLAN_UPDATED',
        entity: 'Plan',
        entityId: planId,
        oldValue: { name: existing.name, price: Number(existing.price), tier: existing.tier },
        newValue: { name: updated.name, price: Number(updated.price), tier: updated.tier },
      },
    }).catch(() => null);

    return {
      ...updated,
      category: (updated as any).category || targetCategory,
      price: Number(updated.price),
      contactLimit: updated.maxContacts,
      contactViewLimit: updated.maxContacts,
      maxContacts: updated.maxContacts,
      maxInterests: updated.maxInterests,
      hasChat: updated.hasChat,
      hasAiMatch: updated.hasAiMatch,
      hasVideoProfile: updated.hasVideoProfile,
      features: sanitizePlanFeatures(updated.features, updated.maxInterests ?? 0, Boolean(updated.hasChat), Boolean(updated.hasAiMatch)),
    };
  }

  async deletePlan(planId: string) {
    const existing = await this.prisma.membershipPlan.findUnique({ where: { id: planId } });
    if (!existing) {
      throw new NotFoundException(`Plan with ID ${planId} not found`);
    }
    await this.prisma.membershipPlan.delete({ where: { id: planId } });

    await this.prisma.auditLog.create({
      data: {
        action: 'PLAN_DELETED',
        entity: 'Plan',
        entityId: planId,
        oldValue: { name: existing.name, tier: existing.tier },
      },
    }).catch(() => null);

    return { success: true, message: 'Plan deleted successfully', id: planId };
  }

  async togglePlanActive(planId: string, isActive?: boolean) {
    return this.updatePlan(planId, { isActive });
  }

  async getUnlockedContacts(userId: string) {
    const entitlements = await this.entitlementsService.getUserEntitlements(userId);
    return {
      tier: entitlements.tier,
      planName: entitlements.planName,
      contactLimit: entitlements.contacts.max,
      usedCount: entitlements.contacts.used,
      remaining: entitlements.contacts.remaining,
      unlockedIds: entitlements.contacts.unlockedIds,
      entitlements,
    };
  }

  async unlockContact(userId: string, targetUserId: string) {
    const entitlements = await this.entitlementsService.getUserEntitlements(userId);

    // Dynamic Database Entitlement Gating: Check plan allowance
    if (!entitlements.contacts.enabled || entitlements.contacts.max === 0) {
      throw new ForbiddenException(
        `Viewing contact details is disabled for your active membership plan (${entitlements.planName}). Please upgrade your membership!`,
      );
    }

    const existingProfile = await this.prisma.profile.findFirst({
      where: { OR: [{ id: targetUserId }, { userId: targetUserId }] },
    }).catch(() => null);

    const canonicalProfileId = existingProfile?.id || targetUserId;
    const canonicalUserId = existingProfile?.userId;

    const isAlreadyUnlocked =
      entitlements.contacts.unlockedIds.includes(targetUserId) ||
      entitlements.contacts.unlockedIds.includes(canonicalProfileId) ||
      Boolean(canonicalUserId && entitlements.contacts.unlockedIds.includes(canonicalUserId));

    if (isAlreadyUnlocked) {
      return {
        success: true,
        alreadyUnlocked: true,
        tier: entitlements.tier,
        planName: entitlements.planName,
        contactLimit: entitlements.contacts.max,
        usedCount: entitlements.contacts.used,
        remaining: entitlements.contacts.remaining,
        unlockedIds: entitlements.contacts.unlockedIds,
        entitlements,
      };
    }

    // Check quota limit if not unlimited (-1)
    if (entitlements.contacts.max > 0 && entitlements.contacts.used >= entitlements.contacts.max) {
      throw new BadRequestException(
        `Contact limit reached (${entitlements.contacts.used}/${entitlements.contacts.max}) for your ${entitlements.planName}. Upgrade to unlock more contacts!`,
      );
    }

    if (existingProfile) {
      await this.prisma.contactUnlock.create({
        data: { unlockedById: userId, profileId: existingProfile.id },
      });
    }

    return this.getUnlockedContacts(userId);
  }

  async activateFreePlan(userId: string, planId?: string) {
    let plan: any = null;
    if (planId) {
      plan = await this.prisma.membershipPlan.findUnique({ where: { id: planId } }).catch(() => null);
      if (!plan) {
        plan = await this.prisma.membershipPlan.findFirst({
          where: { OR: [{ tier: 'FREE' }, { name: { contains: 'free', mode: 'insensitive' } }] },
        }).catch(() => null);
      }
    } else {
      plan = await this.prisma.membershipPlan.findFirst({
        where: { OR: [{ tier: 'FREE' }, { name: { contains: 'free', mode: 'insensitive' } }] },
      }).catch(() => null);
    }

    const planPrice = plan ? Number(plan.price) : 0;
    const planTier = (plan?.tier || 'FREE').toUpperCase();

    // Enforce dynamic rule: paid plans MUST go through payment flow and cannot be activated directly
    if (planPrice > 0 || (plan && planTier !== 'FREE')) {
      throw new BadRequestException('Paid membership plans cannot be activated without verified payment.');
    }

    const userProfile = await this.prisma.profile.findFirst({ where: { userId } }).catch(() => null);
    const profileId = userProfile?.id || `prof-${userId}`;

    const now = new Date();
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 5);

    const membership = await this.prisma.membership.upsert({
      where: { userId },
      create: {
        userId,
        profileId,
        planId: plan?.id || undefined,
        tier: 'FREE',
        startDate: now,
        endDate,
        isActive: true,
      },
      update: {
        planId: plan?.id || undefined,
        tier: 'FREE',
        startDate: now,
        endDate,
        isActive: true,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'PLAN_ACTIVATED',
        entity: 'Payment',
        entityId: membership.id,
        userId,
        newValue: { plan: 'FREE', status: 'ACTIVE' },
      },
    }).catch(() => null);

    return {
      success: true,
      message: 'Free membership plan activated successfully 🎉',
      membership,
    };
  }

  async createRazorpayOrder(userId?: string, input?: any) {
    let amountInPaise: number;
    let currency = 'INR';
    let receipt = `rcpt_${Date.now()}`;
    let plan: any = null;

    if (typeof input === 'string') {
      const planId = input;
      plan = await this.prisma.membershipPlan.findUnique({ where: { id: planId } });
      if (!plan) {
        const cleanTier = planId.replace(/^plan-/, '').toUpperCase();
        plan = await this.prisma.membershipPlan.findFirst({
          where: {
            OR: [
              { tier: cleanTier as any },
              { name: { contains: cleanTier, mode: 'insensitive' } },
            ],
          },
        });
      }

      if (!plan) {
        throw new NotFoundException(`Membership plan '${planId}' not found`);
      }

      const price = Number(plan.price);
      if (price <= 0 || (plan.tier as string).toUpperCase() === 'FREE') {
        throw new BadRequestException('Free plan can be activated directly without payment.');
      }

      amountInPaise = Math.round(price * 100);
      receipt = `plan_${plan.id}_${Date.now()}`;
    } else if (input && typeof input === 'object') {
      if (input.amount !== undefined && input.amount !== null) {
        const amt = Number(input.amount);
        if (isNaN(amt) || amt < 100) {
          throw new BadRequestException('Amount must be at least 100 paise (₹1.00)');
        }
        amountInPaise = Math.round(amt);
      } else if (input.planId) {
        plan = await this.prisma.membershipPlan.findUnique({ where: { id: input.planId } });
        if (!plan) {
          const cleanTier = String(input.planId).replace(/^plan-/, '').toUpperCase();
          plan = await this.prisma.membershipPlan.findFirst({
            where: {
              OR: [
                { tier: cleanTier as any },
                { name: { contains: cleanTier, mode: 'insensitive' } },
              ],
            },
          });
        }

        if (!plan) {
          throw new NotFoundException(`Membership plan '${input.planId}' not found`);
        }

        const price = Number(plan.price);
        if (price <= 0 || (plan.tier as string).toUpperCase() === 'FREE') {
          throw new BadRequestException('Free plan can be activated directly without payment.');
        }

        amountInPaise = Math.round(price * 100);
        receipt = `plan_${plan.id}_${Date.now()}`;
      } else {
        throw new BadRequestException('Either amount (in paise, min 100) or planId is required');
      }

      if (input.currency) {
        currency = String(input.currency).toUpperCase();
      }
      if (input.receipt) {
        receipt = String(input.receipt);
      }
    } else {
      throw new BadRequestException('Invalid order request body');
    }

    if (amountInPaise < 100) {
      throw new BadRequestException('Amount must be at least 100 paise (₹1.00)');
    }

    const keys = await this.getRazorpayKeys();

    if (!keys || !keys.keyId || !keys.keySecret) {
      throw new InternalServerErrorException(
        'Razorpay is not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in environment.',
      );
    }

    let razorpayOrderId: string;
    try {
      const RazorpayClass = typeof Razorpay === 'function' ? Razorpay : (Razorpay as any).default || Razorpay;
      const rzp = new RazorpayClass({
        key_id: keys.keyId,
        key_secret: keys.keySecret,
      });
      console.log(`[Razorpay] Creating order: amount=${amountInPaise} currency=${currency} receipt=${receipt}`);
      const order = await rzp.orders.create({
        amount: amountInPaise,
        currency,
        receipt,
      });
      razorpayOrderId = order?.id;
      console.log(`[Razorpay] Order created successfully: ${razorpayOrderId}`);
      if (!razorpayOrderId) {
        throw new InternalServerErrorException('Razorpay order creation returned no order ID');
      }
    } catch (err: any) {
      const statusCode = err?.statusCode || err?.error?.http_status_code;
      const description = err?.error?.description || err?.error?.reason || err?.message || 'Razorpay order creation failed';
      console.error(`[Razorpay] Order creation failed (${statusCode}): ${description}`, err?.error || err);

      const isAuthError =
        statusCode === 401 ||
        err?.error?.code === 'AUTHENTICATION_ERROR' ||
        String(err?.message || '').toLowerCase().includes('auth') ||
        String(err?.error?.description || '').toLowerCase().includes('auth');

      if (isAuthError) {
        throw new UnauthorizedException(`Razorpay authentication failed: ${description}`);
      }

      throw new InternalServerErrorException(`Payment gateway error: ${description}`);
    }

    // Optional: persist local Payment record if user exists in DB
    const effectiveUserId = userId || input?.userId;
    if (effectiveUserId) {
      try {
        const userExists = await this.prisma.user.findUnique({ where: { id: effectiveUserId } });
        if (userExists) {
          await this.prisma.payment.create({
            data: {
              userId: effectiveUserId,
              planId: plan?.id || undefined,
              amount: amountInPaise / 100,
              currency,
              status: 'PENDING',
              razorpayOrderId,
            },
          });
        }
      } catch (err) {
        console.warn('[Razorpay] Could not persist local payment record:', err);
      }
    }

    return {
      order_id: razorpayOrderId,
      id: razorpayOrderId,
      orderId: razorpayOrderId,
      amount: amountInPaise,
      currency,
      receipt,
      key: keys.keyId,
    };
  }

  async verifyPayment(
    userId?: string,
    data?: {
      order_id?: string;
      payment_id?: string;
      signature?: string;
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
      razorpayOrderId?: string;
      razorpayPaymentId?: string;
      razorpaySignature?: string;
    },
  ) {
    const orderId = data?.razorpay_order_id || data?.order_id || data?.razorpayOrderId;
    const paymentId = data?.razorpay_payment_id || data?.payment_id || data?.razorpayPaymentId;
    const signature = data?.razorpay_signature || data?.signature || data?.razorpaySignature;

    if (!orderId || !paymentId || !signature) {
      throw new BadRequestException('Missing required fields: order_id, payment_id, and signature are required');
    }

    const keys = await this.getRazorpayKeys();
    const keySecret = keys?.keySecret || this.configService.get<string>('RAZORPAY_KEY_SECRET');

    if (!keySecret) {
      throw new InternalServerErrorException('Razorpay secret key is not configured');
    }

    const expectedSignature = createHmac('sha256', keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
    const receivedBuffer = Buffer.from(signature, 'utf8');

    const isValid =
      expectedBuffer.length === receivedBuffer.length &&
      timingSafeEqual(expectedBuffer, receivedBuffer);

    if (!isValid) {
      throw new BadRequestException('Payment verification failed: signature mismatch');
    }

    // Signature matches! Now optionally update local payment & membership state if record exists
    const payment = await this.prisma.payment.findFirst({
      where: { razorpayOrderId: orderId },
      include: { plan: true },
    }).catch(() => null);

    if (payment) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'SUCCESS',
          razorpayPaymentId: paymentId,
          razorpaySignature: signature,
        },
      }).catch(() => null);

      const targetUserId = userId || payment.userId;
      if (payment.plan && targetUserId) {
        const now = new Date();
        const endDate = new Date();
        const durationMonths = payment.plan.durationMonths || 3;
        endDate.setMonth(endDate.getMonth() + durationMonths);

        const userProfile = await this.prisma.profile.findFirst({ where: { userId: targetUserId } }).catch(() => null);
        const profileId = userProfile?.id || `prof-${targetUserId}`;

        await this.prisma.membership.upsert({
          where: { userId: targetUserId },
          create: {
            userId: targetUserId,
            profileId,
            planId: payment.plan.id,
            tier: payment.plan.tier,
            startDate: now,
            endDate,
            isActive: true,
          },
          update: {
            planId: payment.plan.id,
            tier: payment.plan.tier,
            startDate: now,
            endDate,
            isActive: true,
          },
        }).catch(() => null);
      }

      await this.prisma.auditLog.create({
        data: {
          action: 'PAYMENT_COMPLETED',
          entity: 'Payment',
          entityId: payment?.id || paymentId,
          userId: targetUserId || payment.userId,
          newValue: {
            planName: payment?.plan?.name,
            tier: payment?.plan?.tier,
            amount: payment?.amount ? Number(payment.amount) : undefined,
            status: 'SUCCESS',
            paymentId,
          },
        },
      }).catch(() => null);
    }

    return {
      success: true,
      message: 'Payment verified and plan activated successfully 🎉',
      order_id: orderId,
      payment_id: paymentId,
      verified: true,
    };
  }

  async getUserPaymentHistory(userId: string) {
    const records = await this.prisma.payment.findMany({
      where: { userId },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });

    return records.map((p) => ({
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
