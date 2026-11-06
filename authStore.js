import { create } from 'zustand';
import { authAPI } from '../api';

export const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('makeupi_admin_user') || 'null'),
  token: localStorage.getItem('makeupi_admin_token') || null,
  isAuthenticated: !!localStorage.getItem('makeupi_admin_token'),
  isLoading: false,

  login: async (username, password) => {
    set({ isLoading: true });
    try {
      const res = await authAPI.login({ username, password });
      if (res.success && res.data?.token) {
        localStorage.setItem('makeupi_admin_token', res.data.token);
        localStorage.setItem('makeupi_admin_user', JSON.stringify(res.data.user));
        set({
          user: res.data.user,
          token: res.data.token,
          isAuthenticated: true,
          isLoading: false,
        });
        return { success: true };
      }
      set({ isLoading: false });
      return { success: false, message: res.message || 'فشل تسجيل الدخول' };
    } catch (error) {
      set({ isLoading: false });
      return { success: false, message: error.message };
    }
  },

  logout: async () => {
    try {
      await authAPI.logout();
    } catch {
      // Ignore
    } finally {
      localStorage.removeItem('makeupi_admin_token');
      localStorage.removeItem('makeupi_admin_user');
      set({ user: null, token: null, isAuthenticated: false });
    }
  },

  checkAuth: async () => {
    const token = localStorage.getItem('makeupi_admin_token');
    if (!token) {
      set({ user: null, token: null, isAuthenticated: false });
      return;
    }
    try {
      const res = await authAPI.getMe();
      if (res.success && res.data) {
        set({ user: res.data, isAuthenticated: true });
      }
    } catch {
      localStorage.removeItem('makeupi_admin_token');
      localStorage.removeItem('makeupi_admin_user');
      set({ user: null, token: null, isAuthenticated: false });
    }
  },
}));
