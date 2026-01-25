import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  userId: number | null;
  username: string | null;
  isAuthenticated: boolean;
  login: (data: { token: string; refreshToken: string; id: number; username: string }) => void;
  logout: () => void;
  updateToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      userId: null,
      username: null,
      isAuthenticated: false,
      login: (data) => set({
        token: data.token,
        refreshToken: data.refreshToken,
        userId: data.id,
        username: data.username,
        isAuthenticated: true,
      }),
      logout: () => set({
        token: null,
        refreshToken: null,
        userId: null,
        username: null,
        isAuthenticated: false,
      }),
      updateToken: (token) => set({ token }),
    }),
    { name: 'workflow-auth' }
  )
);
