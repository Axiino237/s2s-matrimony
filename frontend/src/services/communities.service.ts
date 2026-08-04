import api from './api';

export interface CommunityData {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  memberCount: number;
  parentId?: string | null;
  children?: CommunityData[];
  parent?: CommunityData | null;
}




export const communitiesApi = {
  getCommunities: async (search?: string): Promise<CommunityData[]> => {
    const res = await api.get('/communities', { params: { search } });
    const data = Array.isArray(res.data) ? res.data : (res.data.data || []);
    return data;
  },

  createCommunity: async (data: { name: string; description?: string }): Promise<CommunityData> => {
    const res = await api.post('/communities', data);
    return res.data.data || res.data;
  },

  updateCommunity: async (id: string, data: { name?: string; description?: string; isActive?: boolean }): Promise<CommunityData> => {
    const res = await api.patch(`/communities/${id}`, data);
    return res.data.data || res.data;
  },

  deleteCommunity: async (id: string): Promise<void> => {
    await api.delete(`/communities/${id}`);
  },
};
