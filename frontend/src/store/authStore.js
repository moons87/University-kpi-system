/**
 * Auth store — token is stored in an httpOnly cookie managed by the browser.
 * This store only tracks the user object (fetched via /auth/me).
 * No token is ever stored in JavaScript memory or localStorage.
 */
import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  logout: () => set({ user: null, isAuthenticated: false }),
}));

export default useAuthStore;
