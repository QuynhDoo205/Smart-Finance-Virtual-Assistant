import type { UserProfile } from '../utils/api';

// Simple auth store using localStorage (không cần Zustand)
// Sẽ nâng cấp lên Zustand nếu cần

const TOKEN_KEY = 'nova_token';
const USER_KEY = 'nova_user';

export const authStore = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  getUser(): UserProfile | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as UserProfile;
    } catch {
      return null;
    }
  },

  setAuth(token: string, user: UserProfile): void {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  clearAuth(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  isAuthenticated(): boolean {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return false;
    
    // Decode JWT to check expiry (without verifying signature)
    try {
      const payload = JSON.parse(atob(token.split('.')[1] ?? ''));
      const exp = (payload as { exp?: number }).exp;
      if (exp && exp * 1000 < Date.now()) {
        authStore.clearAuth();
        return false;
      }
      return true;
    } catch {
      return !!token;
    }
  },
};

export default authStore;
