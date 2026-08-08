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

  // Helpers
  hasRole: (role: Role) => boolean;
  hasAnyRole: (...roles: Role[]) => boolean;
  hasPermission: (permission: string) => boolean;
  isAdmin: () => boolean;
  isSuperAdmin: () => boolean;
  isPremium: () => boolean;
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
          const user = res.data;
          if (user && user.membershipTier && !user.membershipStatus) {
            user.membershipStatus = user.membershipTier;
          }
          set({ user, isAuthenticated: true });
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

        if (mainRole === 'SUPER_ADMIN') return true;

        const savedMapStr = localStorage.getItem('s2s_role_permissions');
        if (savedMapStr) {
          try {
            const map = JSON.parse(savedMapStr);
            const rolePerms = map[mainRole];
            if (Array.isArray(rolePerms)) {
              return rolePerms.includes(perm);
            }
          } catch {
            // fallback
          }
        }

        if (user.permissions && Array.isArray(user.permissions)) {
          return user.permissions.includes(perm);
        }

        return false;
      },

      isAdmin: () => get().hasAnyRole('ADMIN', 'SUPER_ADMIN'),
      isSuperAdmin: () => get().hasRole('SUPER_ADMIN'),
      isPremium: () => ['SILVER', 'GOLD', 'ELITE', 'PLATINUM'].includes(get().user?.membershipStatus ?? ''),
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
