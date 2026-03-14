import { create } from "zustand";
import type { User } from "../types";

const LOGGED_IN_KEY = "isLoggedIn";

function getInitialAuth(): boolean {
  if (typeof localStorage === "undefined") return false;
  return localStorage.getItem(LOGGED_IN_KEY) === "true";
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setAuth: (user: User) => void;
  setUser: (user: User) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: getInitialAuth(),
  isLoading: true,

  setAuth: (user) => {
    localStorage.setItem(LOGGED_IN_KEY, "true");
    set({ user, isAuthenticated: true });
  },

  setUser: (user) => set({ user }),

  clearAuth: () => {
    localStorage.removeItem(LOGGED_IN_KEY);
    set({ user: null, isAuthenticated: false });
  },

  setLoading: (loading) => set({ isLoading: loading }),
}));
