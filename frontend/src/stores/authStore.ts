import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  userId: number | null;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  deletionScheduledAt: string | null;
  isAuthenticated: boolean;
  login: (data: { id: number; username: string; firstName?: string | null; lastName?: string | null; deletionScheduledAt?: string | null }) => void;
  logout: () => void;
  updateUsername: (username: string) => void;
  setDeletionScheduledAt: (date: string | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      userId: null,
      username: null,
      firstName: null,
      lastName: null,
      deletionScheduledAt: null,
      isAuthenticated: false,
      login: (data) => set({
        userId: data.id,
        username: data.username,
        firstName: data.firstName || null,
        lastName: data.lastName || null,
        deletionScheduledAt: data.deletionScheduledAt || null,
        isAuthenticated: true,
      }),
      logout: () => set({
        userId: null,
        username: null,
        firstName: null,
        lastName: null,
        deletionScheduledAt: null,
        isAuthenticated: false,
      }),
      updateUsername: (username) => set({ username }),
      setDeletionScheduledAt: (date) => set({ deletionScheduledAt: date }),
    }),
    { name: 'workflow-auth' }
  )
);
