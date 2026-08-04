import api from './api';

export const interestsApi = {
  sendInterest: async (receiverUserId: string, message?: string) => {
    const res = await api.post('/interests/send', { receiverUserId, message });
    return res.data.data || res.data;
  },

  respondToInterest: async (interestId: string, status: 'ACCEPTED' | 'REJECTED') => {
    const res = await api.patch(`/interests/${interestId}/respond`, { status });
    return res.data.data || res.data;
  },

  getReceivedInterests: async () => {
    const res = await api.get('/interests/received');
    return res.data.data || res.data;
  },

  getSentInterests: async () => {
    const res = await api.get('/interests/sent');
    return res.data.data || res.data;
  },
};
