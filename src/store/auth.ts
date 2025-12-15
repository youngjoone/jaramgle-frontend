"use client";

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserProfile {
  id: number;
  email: string;
  name?: string;
  nickname?: string;
  provider: string;
  role: string;
}

interface AuthState {
  isLoggedIn: boolean;
  isGuestMode: boolean;
  user: UserProfile | null;
  login: (user: UserProfile) => void;
  logout: () => void;
  enterGuestMode: () => void;
  exitGuestMode: () => void;
  setUser: (user: UserProfile | null) => void;
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
        user
      }),
      logout: () => set({
        isLoggedIn: false,
        isGuestMode: false,
        user: null
      }),
      enterGuestMode: () => set({ isGuestMode: true }),
      exitGuestMode: () => set({ isGuestMode: false }),
      setUser: (user) => set((state) => ({
        user,
        isLoggedIn: !!user && !state.isGuestMode
      })),
    }),
    {
      name: 'auth-storage',
    }
  )
);
