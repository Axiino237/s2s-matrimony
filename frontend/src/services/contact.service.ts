import { api } from './api';

export interface ContactUsPayload {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
}

export interface ContactUsResponse {
  success: boolean;
  message: string;
}

export const contactApi = {
  sendMessage: async (payload: ContactUsPayload): Promise<ContactUsResponse> => {
    const res = await api.post('/contact', payload);
    return res.data;
  },
};
