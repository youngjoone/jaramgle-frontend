"use client";

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  isLoggedIn: boolean;
  isGuestMode: boolean;
  user: {
    name: string;
    email: string;
  } | null;
  login: (user?: { name: string; email: string }) => void;
  logout: () => void;
  enterGuestMode: () => void;
  exitGuestMode: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isLoggedIn: false,
      isGuestMode: false,
      user: null,
      login: (user) => set({
        isLoggedIn: true,
        isGuestMode: false,
        user: user || { name: '사용자', email: 'user@example.com' }
      }),
      logout: () => set({
        isLoggedIn: false,
        isGuestMode: false,
        user: null
      }),
      enterGuestMode: () => set({ isGuestMode: true }),
      exitGuestMode: () => set({ isGuestMode: false }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
