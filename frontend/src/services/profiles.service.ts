import api from './api';

export interface ProfileData {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  displayName: string;
  gender: string;
  age: number;
  heightCm?: number;
  complexion?: string;
  maritalStatus?: string;
  motherTongue?: string;
  about?: string;
  community?: { name: string; slug: string };
  education?: { degree: string; field: string };
  occupation?: { title: string; company: string; annualIncome: string };
  photos?: { id: string; url: string; isMain: boolean }[];
  isVerified: boolean;
  matchScore?: number;
}

export const profilesApi = {
  getMyProfile: async () => {
    const res = await api.get('/profiles/me');
    return res.data.data || res.data;
  },

  getProfileById: async (id: string) => {
    const res = await api.get(`/profiles/${id}`);
    return res.data.data || res.data;
  },

  updateMyProfile: async (data: Record<string, any>) => {
    const res = await api.patch('/profiles/me', data);
    return res.data.data || res.data;
  },

  searchProfiles: async (params: Record<string, any>) => {
    const res = await api.get('/search', { params });
    return res.data.data || res.data;
  },

  uploadPhoto: async (url: string, isMain: boolean = false) => {
    const res = await api.post('/profiles/photos', { url, isMain });
    return res.data.data || res.data;
  },

  deletePhoto: async (photoId: string) => {
    const res = await api.delete(`/profiles/photos/${photoId}`);
    return res.data.data || res.data;
  },

  parseBiodata: async (text: string, imageBase64?: string) => {
    const res = await api.post('/profiles/parse-biodata', { text, imageBase64 });
    return res.data.data || res.data;
  },

  saveParsedProfile: async (extractedData: any) => {
    const res = await api.post('/profiles/save-parsed-profile', { extractedData });
    return res.data.data || res.data;
  },

  getProfileViewers: async () => {
    const res = await api.get('/profiles/viewers');
    return res.data.data || res.data || [];
  },

  recordProfileView: async (ownerId: string) => {
    const res = await api.post(`/profiles/${ownerId}/view`);
    return res.data.data || res.data;
  },
};
