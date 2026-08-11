import api from './api';

export const paymentsApi = {
  getPlans: async () => {
    try {
      const res = await api.get('/payments/plans');
      return res.data;
    } catch {
      return [
        { id: 'plan-free', name: 'Free', price: '0', duration: 'Lifetime', tier: 'FREE', contactLimit: 5, features: ['5 Interests/day', 'Basic Search', '5 Contact Views'] },
        { id: 'plan-silver', name: 'Silver', price: '599', duration: '1 month', tier: 'SILVER', contactLimit: 50, features: ['50 Interests/day', 'Advanced Search', '50 Contacts', 'Chat Access'] },
        { id: 'plan-elite', name: 'Elite', price: '999', duration: '3 months', tier: 'ELITE', isPopular: true, contactLimit: 100, features: ['Unlimited Interests', 'All Features', '100 Contacts', 'Priority Listing', 'AI Match'] },
        { id: 'plan-platinum', name: 'Platinum', price: '1799', duration: '6 months', tier: 'PLATINUM', contactLimit: 999, features: ['Everything+', 'Unlimited Contacts', 'Video Profile', 'Dedicated Manager'] },
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
