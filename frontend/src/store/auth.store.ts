import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { JwtPayload, Role } from '../types';
import api from '../services/api';

interface AuthStore {
  user: JwtPayload | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setAccessToken: (token: string) => void;
  setUser: (user: JwtPayload) => void;
  login: (email: string, password: string) => Promise<JwtPayload>;
  loginWithOtp: (phone: string, otp: string) => Promise<JwtPayload>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;

  updateEntitlements: (entitlements: any) => void;

  // Helpers
  hasRole: (role: Role) => boolean;
  hasAnyRole: (...roles: Role[]) => boolean;
  hasPermission: (permission: string) => boolean;
  isAdmin: () => boolean;
  isSuperAdmin: () => boolean;
  isPremium: () => boolean;
  isElite: () => boolean;
  getMembershipTier: () => string;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,

      setAccessToken: (token) => set({ accessToken: token }),
      setUser: (user) => set({ user, isAuthenticated: true }),

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          // Real Backend API Call
          const res = await api.post('/auth/login', { email, password });
          const user = res.data.user || res.data.data?.user;
          if (user && user.membershipTier && !user.membershipStatus) {
            user.membershipStatus = user.membershipTier;
          }
          if (user?.entitlements?.category) {
            user.membershipCategory = user.entitlements.category;
            user.isElite = user.entitlements.isElite;
          }
          const accessToken = res.data.accessToken || res.data.data?.accessToken;
          set({ user, accessToken, isAuthenticated: true });
          return user;
        } finally {
          set({ isLoading: false });
        }
      },

      loginWithOtp: async (phone, otp) => {
        set({ isLoading: true });
        try {
          const res = await api.post('/auth/verify-otp', { phone, otp });
          const user = res.data.user || res.data.data?.user;
          if (user && user.membershipTier && !user.membershipStatus) {
            user.membershipStatus = user.membershipTier;
          }
          if (user?.entitlements?.category) {
            user.membershipCategory = user.entitlements.category;
            user.isElite = user.entitlements.isElite;
          }
          const accessToken = res.data.accessToken || res.data.data?.accessToken;
          set({ user, accessToken, isAuthenticated: true });
          return user;
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        try {
          await api.post('/auth/logout');
        } catch {
          // Fail silently
        } finally {
          set({ user: null, accessToken: null, isAuthenticated: false });
        }
      },

      fetchMe: async () => {
        try {
          const res = await api.get('/auth/me');
          const data = res.data;
          const user = data.user || data;
          if (user && user.membershipTier && !user.membershipStatus) {
            user.membershipStatus = user.membershipTier;
          }
          if (user?.entitlements?.category) {
            user.membershipCategory = user.entitlements.category;
            user.isElite = user.entitlements.isElite;
          }
          const accessToken = data.accessToken || user.accessToken || get().accessToken;
          set({ user, accessToken, isAuthenticated: true });
        } catch {
          // If token fails or is invalid, clear state
          set({ user: null, accessToken: null, isAuthenticated: false });
        }
      },

      hasRole: (role) => {
        const user = get().user;
        if (!user) return false;
        const mainRole = (
          user.role ||
          user.roles?.[0] ||
          (user as any).userRoles?.[0]?.role?.name ||
          'MEMBER'
        ).toString().toUpperCase();
        if (mainRole === 'SUPER_ADMIN') return true;
        return mainRole === role.toUpperCase();
      },

      hasAnyRole: (...roles) => {
        const user = get().user;
        if (!user) return false;
        const mainRole = (
          user.role ||
          user.roles?.[0] ||
          (user as any).userRoles?.[0]?.role?.name ||
          'MEMBER'
        ).toString().toUpperCase();
        if (mainRole === 'SUPER_ADMIN') return true;
        return roles.some((r) => r.toUpperCase() === mainRole);
      },

      hasPermission: (perm) => {
        const user = get().user;
        if (!user) return false;

        const mainRole = (
          user.role ||
          user.roles?.[0] ||
          (user as any).userRoles?.[0]?.role?.name ||
          'MEMBER'
        ).toString().toUpperCase();

        const allRoles: string[] = Array.isArray(user.roles)
          ? user.roles.map((r: any) => (typeof r === 'string' ? r : r?.name || '').toUpperCase())
          : [mainRole];

        if (allRoles.includes('SUPER_ADMIN') || mainRole === 'SUPER_ADMIN') return true;

        if (user.permissions && Array.isArray(user.permissions)) {
          return user.permissions.includes(perm);
        }

        return false;
      },

      updateEntitlements: (entitlements: any) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: {
              ...currentUser,
              membershipStatus: entitlements?.tier || currentUser.membershipStatus,
              membershipTier: entitlements?.tier || currentUser.membershipTier,
              membershipCategory: entitlements?.category || currentUser.membershipCategory,
              isElite: entitlements?.isElite ?? currentUser.isElite,
              entitlements,
            },
          });
        }
      },

      isAdmin: () => get().hasAnyRole('ADMIN', 'SUPER_ADMIN'),
      isSuperAdmin: () => get().hasRole('SUPER_ADMIN'),
      isPremium: () => {
        const user = get().user;
        if (!user) return false;
        const ent = user.entitlements;
        if (ent?.isStaff) return true;
        const tier = (ent?.tier || user.membershipTier || user.membershipStatus || 'FREE').toUpperCase();
        if (tier === 'FREE' || tier === 'NONE' || !tier) return false;
        if (ent && ent.isActive === false) return false;
        return true;
      },
      isElite: () => {
        const user = get().user;
        if (!user) return false;
        if (get().isAdmin()) return true;
        const ent = user.entitlements;
        if (ent?.isStaff || ent?.isElite || ent?.category === 'ELITE') return true;
        if (user.membershipCategory === 'ELITE' || user.isElite === true) return true;
        const tier = (ent?.tier || user.membershipTier || user.membershipStatus || '').toUpperCase();
        return tier === 'ELITE';
      },
      getMembershipTier: () => {
        const user = get().user;
        if (!user) return 'FREE';
        const tier = (user.entitlements?.tier || user.membershipTier || user.membershipStatus || 'FREE').toUpperCase();
        return tier;
      },
    }),
    {
      name: 's2s-auth-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
