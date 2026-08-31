import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import api from '../services/api';

export interface SystemSettingsState {
  logoUrl: string;
  faviconUrl: string;
  siteName: string;
  tagline: string;
  primaryColor: string;
  secondaryColor: string;
  supportEmail: string;
  supportPhone: string;
  enableBiodataForm: boolean;
  
  // Actions
  setSettings: (settings: Partial<SystemSettingsState>) => void;
  setLogoUrl: (url: string) => void;
  fetchSettings: () => Promise<void>;
}

export const useSettingsStore = create<SystemSettingsState>()(
  persist(
    (set) => ({
      logoUrl: '/images/logo.png',
      faviconUrl: '/favicon.ico',
      siteName: 'S2S Community Matrimony',
      tagline: 'Find Your Perfect Match',
      primaryColor: '#E11D48',
      secondaryColor: '#0D9488',
      supportEmail: 's2smdoffice@gmail.com',
      supportPhone: '+91 84380 11191',
      enableBiodataForm: true,

      setSettings: (newSettings) => set((state) => ({ ...state, ...newSettings })),
      setLogoUrl: (logoUrl) => set({ logoUrl }),

      fetchSettings: async () => {
        try {
          const res = await api.get('/super-admin/settings');
          const data = res.data?.data || res.data;
          if (data && typeof data === 'object') {
            set((state) => ({
              ...state,
              logoUrl: data.logoUrl || state.logoUrl,
              faviconUrl: data.faviconUrl || state.faviconUrl,
              siteName: data.siteName || state.siteName,
              tagline: data.tagline || state.tagline,
              primaryColor: data.primaryColor || state.primaryColor,
              secondaryColor: data.secondaryColor || state.secondaryColor,
              supportEmail: data.supportEmail || state.supportEmail,
              supportPhone: data.supportPhone || state.supportPhone,
              enableBiodataForm: data.enableBiodataForm !== undefined ? (data.enableBiodataForm === true || data.enableBiodataForm === 'true') : state.enableBiodataForm,
            }));
          }
        } catch {
          // Keep current/cached settings
        }
      },
    }),
    {
      name: 's2s-settings-store',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
