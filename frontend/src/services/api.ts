/// <reference types="vite/client" />
import axios from 'axios';
import { useAuthStore } from '../store/auth.store';
import { useSettingsStore } from '../store/settings.store';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor — attach access token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — auto refresh token
let isRefreshing = false;
let failedQueue: Array<{ resolve: (value: string) => void; reject: (error: unknown) => void }> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token!);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const newToken = res.data?.accessToken || res.data?.data?.accessToken;
        if (newToken) {
          useAuthStore.getState().setAccessToken(newToken);
          processQueue(null, newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (
      error.response?.status === 503 &&
      (error.response?.data?.maintenance || String(error.response?.data?.message || '').toLowerCase().includes('maintenance'))
    ) {
      useSettingsStore.getState().setSettings({ maintenanceMode: true });
      const currentUser = useAuthStore.getState().user;
      const roleStr = (
        currentUser?.role ||
        (Array.isArray(currentUser?.roles) ? currentUser?.roles[0] : currentUser?.roles) ||
        (currentUser as any)?.userRoles?.[0]?.role?.name ||
        ''
      ).toString().toUpperCase();
      const allRoles: string[] = Array.isArray(currentUser?.roles)
        ? currentUser.roles.map((r: any) => (typeof r === 'string' ? r : r?.name || '').toUpperCase())
        : [roleStr];
      const isAdminOrSuperAdmin = roleStr === 'ADMIN' || roleStr === 'SUPER_ADMIN' || allRoles.includes('ADMIN') || allRoles.includes('SUPER_ADMIN');

      if (!isAdminOrSuperAdmin && useAuthStore.getState().isAuthenticated) {
        useAuthStore.getState().logout();
      }
    }

    return Promise.reject(error);
  }
);

export default api;
