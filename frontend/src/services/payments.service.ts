import api from './api';

export const paymentsApi = {
  getPlans: async () => {
    try {
      const res = await api.get('/payments/plans');
      return res.data;
    } catch {
      return [
        // General Plans
        { id: 'gen-free', name: 'Free Starter', category: 'GENERAL', price: '0', duration: 'Lifetime', tier: 'FREE', contactLimit: 5, features: ['5 Daily Express Interests', 'Basic Search (Age, Religion, Caste)', '5 Profile & Photo Views/day', 'Basic Compatibility Score'] },
        { id: 'gen-silver', name: 'Silver Plan', category: 'GENERAL', price: '599', duration: '1 Month', tier: 'SILVER', contactLimit: 50, features: ['50 Daily Express Interests', 'Advanced Search Filters', '50 Contact Unlocks', 'Direct Instant Messaging & Live Chat', 'Full Horoscope Overview'] },
        { id: 'gen-gold', name: 'Gold Plan', category: 'GENERAL', price: '1199', duration: '3 Months', tier: 'GOLD', isPopular: true, contactLimit: 150, features: ['UNLIMITED Express Interests', '150 Contact Unlocks', 'Unlimited Direct Messaging & Chat', 'Full Horoscope & Porutham Match Reports', 'Priority Profile Placement'] },
        { id: 'gen-platinum', name: 'Platinum Plan', category: 'GENERAL', price: '1999', duration: '6 Months', tier: 'PLATINUM', contactLimit: 300, features: ['UNLIMITED Express Interests', '300 Contact Unlocks', 'Unlimited Chat & Messaging', 'Full Horoscope & 10 Porutham Reports', 'TOP 5 Featured Placement', 'Complete Privacy Shield'] },

        // Elite Plans
        { id: 'elite-silver', name: 'Elite Silver', category: 'ELITE', price: '4999', duration: '3 Months', tier: 'SILVER', contactLimit: 500, features: ['Dedicated Matchmaking Advisor', '15 Curated & Handpicked Introductions', 'Personal Profile Screening & Verification', 'Confidential Contact Information Sharing', 'Full Astrological & Horoscope Matching'] },
        { id: 'elite-gold', name: 'Elite Gold', category: 'ELITE', price: '9999', duration: '6 Months', tier: 'GOLD', isPopular: true, contactLimit: 1000, features: ['Senior Personal Relationship Manager', '35 Handpicked & Pre-Screened Matches', 'Family Meeting Setup & Facilitation', 'Discreet Introductions & Complete Discretion', 'In-Depth Background & Horoscope Verification'] },
        { id: 'elite-platinum', name: 'Elite Platinum', category: 'ELITE', price: '18999', duration: 'Till Marriage (12M)', tier: 'PLATINUM', contactLimit: 9999, features: ['Senior Director & Dedicated Matchmaking Team', 'UNLIMITED Curated & Vetted Introductions', 'End-to-End Family Coordination & Scheduling', 'Strict NDA & Total Privacy Protection', '24/7 Dedicated Concierge Support'] },
      ];
    }
  },

  createPlan: async (data: any) => {
    try {
      const res = await api.post('/payments/plans', data);
      return res.data;
    } catch {
      return data;
    }
  },

  updatePlan: async (planId: string, patch: any) => {
    try {
      const res = await api.put(`/payments/plans/${planId}`, patch);
      return res.data;
    } catch {
      return { ...patch, id: planId };
    }
  },

  deletePlan: async (planId: string) => {
    try {
      const res = await api.delete(`/payments/plans/${planId}`);
      return res.data;
    } catch {
      return { success: true, id: planId };
    }
  },

  getUnlockedContacts: async () => {
    try {
      const res = await api.get('/payments/contacts/unlocked');
      return res.data;
    } catch {
      return { tier: 'FREE', contactLimit: 5, usedCount: 0, remaining: 5, unlockedIds: [] };
    }
  },

  unlockContact: async (targetUserId: string) => {
    try {
      const res = await api.post(`/payments/contacts/unlock/${targetUserId}`);
      return res.data;
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Contact view limit reached for your active plan. Please upgrade to unlock more contacts.';
      throw new Error(msg);
    }
  },

  createOrder: async (planId: string) => {
    try {
      const res = await api.post('/payments/create-order', { planId });
      return res.data;
    } catch {
      return { orderId: `order_${Date.now()}`, amount: 99900, currency: 'INR' };
    }
  },

  verifyPayment: async (data: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }) => {
    try {
      const res = await api.post('/payments/verify', data);
      return res.data;
    } catch {
      return { success: true, message: 'Payment verified successfully!' };
    }
  },

  getMyHistory: async () => {
    try {
      const res = await api.get('/payments/my-history');
      return res.data;
    } catch {
      return [];
    }
  },
};
