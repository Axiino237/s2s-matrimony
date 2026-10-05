import api from './api';

export const paymentsApi = {
  getPlans: async () => {
    const res = await api.get('/payments/plans');
    return res.data;
  },

  createPlan: async (data: any) => {
    const res = await api.post('/payments/plans', data);
    return res.data;
  },

  updatePlan: async (planId: string, patch: any) => {
    const res = await api.put(`/payments/plans/${planId}`, patch);
    return res.data;
  },

  deletePlan: async (planId: string) => {
    const res = await api.delete(`/payments/plans/${planId}`);
    return res.data;
  },

  getEntitlements: async () => {
    try {
      const res = await api.get('/payments/entitlements');
      return res.data;
    } catch {
      return null;
    }
  },

  getUnlockedContacts: async () => {
    try {
      const res = await api.get('/payments/contacts/unlocked');
      return res.data;
    } catch {
      return { tier: 'FREE', planName: 'Free Plan', contactLimit: 0, usedCount: 0, remaining: 0, unlockedIds: [] };
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

  activateFreePlan: async (planId?: string) => {
    const res = await api.post('/payments/activate-free', { planId });
    return res.data;
  },

  createOrder: async (input: string | { planId?: string; amount?: number; currency?: string; receipt?: string }) => {
    const payload = typeof input === 'string' ? { planId: input } : input;
    const res = await api.post('/payments/create-order', payload);
    return res.data;
  },

  verifyPayment: async (data: {
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
    order_id?: string;
    payment_id?: string;
    signature?: string;
  }) => {
    const res = await api.post('/payments/verify-payment', data);
    return res.data;
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
