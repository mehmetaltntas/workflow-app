import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  userId: number | null;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  deletionScheduledAt: string | null;
  isAuthenticated: boolean;
  login: (data: { token: string; refreshToken: string; id: number; username: string; firstName?: string | null; lastName?: string | null; deletionScheduledAt?: string | null }) => void;
  logout: () => void;
  updateToken: (token: string) => void;
  updateUsername: (username: string) => void;
  setDeletionScheduledAt: (date: string | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      userId: null,
      username: null,
      firstName: null,
      lastName: null,
      deletionScheduledAt: null,
      isAuthenticated: false,
      login: (data) => set({
        token: data.token,
        refreshToken: data.refreshToken,
        userId: data.id,
        username: data.username,
        firstName: data.firstName || null,
        lastName: data.lastName || null,
        deletionScheduledAt: data.deletionScheduledAt || null,
        isAuthenticated: true,
      }),
      logout: () => set({
        token: null,
        refreshToken: null,
        userId: null,
        username: null,
        firstName: null,
        lastName: null,
        deletionScheduledAt: null,
        isAuthenticated: false,
      }),
      updateToken: (token) => set({ token }),
      updateUsername: (username) => set({ username }),
      setDeletionScheduledAt: (date) => set({ deletionScheduledAt: date }),
    }),
    { name: 'workflow-auth' }
  )
);
