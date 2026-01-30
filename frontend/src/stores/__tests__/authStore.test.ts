import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAuthStore } from '../authStore';
import { act } from '@testing-library/react';

// Mock queryClient
vi.mock('../../lib/queryClient', () => ({
  queryClient: {
    clear: vi.fn(),
  },
}));

// Get the mocked queryClient
import { queryClient } from '../../lib/queryClient';

describe('authStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    act(() => {
      useAuthStore.setState({
        userId: null,
        username: null,
        firstName: null,
        lastName: null,
        deletionScheduledAt: null,
        isAuthenticated: false,
      });
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initial state', () => {
    it('should have null values and isAuthenticated false by default', () => {
      const state = useAuthStore.getState();
      expect(state.userId).toBeNull();
      expect(state.username).toBeNull();
      expect(state.firstName).toBeNull();
      expect(state.lastName).toBeNull();
      expect(state.deletionScheduledAt).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('login', () => {
    it('should set user data and isAuthenticated to true', () => {
      act(() => {
        useAuthStore.getState().login({
          id: 1,
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User',
          deletionScheduledAt: null,
        });
      });

      const state = useAuthStore.getState();
      expect(state.userId).toBe(1);
      expect(state.username).toBe('testuser');
      expect(state.firstName).toBe('Test');
      expect(state.lastName).toBe('User');
      expect(state.isAuthenticated).toBe(true);
    });

    it('should handle missing optional fields', () => {
      act(() => {
        useAuthStore.getState().login({
          id: 2,
          username: 'minimal',
        });
      });

      const state = useAuthStore.getState();
      expect(state.userId).toBe(2);
      expect(state.username).toBe('minimal');
      expect(state.firstName).toBeNull();
      expect(state.lastName).toBeNull();
      expect(state.deletionScheduledAt).toBeNull();
      expect(state.isAuthenticated).toBe(true);
    });
  });

  describe('logout', () => {
    it('should clear all state and query cache', async () => {
      // First login
      act(() => {
        useAuthStore.getState().login({
          id: 1,
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User',
        });
      });

      // Mock fetch for logout API call
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ message: 'ok' }), { status: 200 })
      );

      await act(async () => {
        await useAuthStore.getState().logout();
      });

      const state = useAuthStore.getState();
      expect(state.userId).toBeNull();
      expect(state.username).toBeNull();
      expect(state.firstName).toBeNull();
      expect(state.lastName).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(queryClient.clear).toHaveBeenCalled();

      fetchSpy.mockRestore();
    });

    it('should clear state even if backend logout fails', async () => {
      act(() => {
        useAuthStore.getState().login({ id: 1, username: 'testuser' });
      });

      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));

      await act(async () => {
        await useAuthStore.getState().logout();
      });

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.userId).toBeNull();
      expect(queryClient.clear).toHaveBeenCalled();

      fetchSpy.mockRestore();
    });
  });

  describe('updateUsername', () => {
    it('should update only the username', () => {
      act(() => {
        useAuthStore.getState().login({ id: 1, username: 'old' });
      });

      act(() => {
        useAuthStore.getState().updateUsername('new');
      });

      const state = useAuthStore.getState();
      expect(state.username).toBe('new');
      expect(state.userId).toBe(1);
      expect(state.isAuthenticated).toBe(true);
    });
  });

  describe('setDeletionScheduledAt', () => {
    it('should set the deletion date', () => {
      act(() => {
        useAuthStore.getState().setDeletionScheduledAt('2024-12-31');
      });

      expect(useAuthStore.getState().deletionScheduledAt).toBe('2024-12-31');
    });

    it('should clear the deletion date with null', () => {
      act(() => {
        useAuthStore.getState().setDeletionScheduledAt('2024-12-31');
      });
      act(() => {
        useAuthStore.getState().setDeletionScheduledAt(null);
      });

      expect(useAuthStore.getState().deletionScheduledAt).toBeNull();
    });
  });

  describe('validateSession', () => {
    it('should do nothing when not authenticated', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch');

      await act(async () => {
        await useAuthStore.getState().validateSession();
      });

      expect(fetchSpy).not.toHaveBeenCalled();
      fetchSpy.mockRestore();
    });

    it('should clear state on 401 response', async () => {
      act(() => {
        useAuthStore.getState().login({ id: 1, username: 'testuser' });
      });

      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response('', { status: 401 })
      );

      await act(async () => {
        await useAuthStore.getState().validateSession();
      });

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.userId).toBeNull();
      expect(queryClient.clear).toHaveBeenCalled();

      fetchSpy.mockRestore();
    });

    it('should clear state on 403 response', async () => {
      act(() => {
        useAuthStore.getState().login({ id: 1, username: 'testuser' });
      });

      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response('', { status: 403 })
      );

      await act(async () => {
        await useAuthStore.getState().validateSession();
      });

      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      fetchSpy.mockRestore();
    });

    it('should update user data on success', async () => {
      act(() => {
        useAuthStore.getState().login({ id: 1, username: 'testuser' });
      });

      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({
          username: 'updated',
          firstName: 'Updated',
          lastName: 'Name',
          deletionScheduledAt: '2025-01-01',
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      await act(async () => {
        await useAuthStore.getState().validateSession();
      });

      const state = useAuthStore.getState();
      expect(state.username).toBe('updated');
      expect(state.firstName).toBe('Updated');
      expect(state.lastName).toBe('Name');
      expect(state.deletionScheduledAt).toBe('2025-01-01');
      expect(state.isAuthenticated).toBe(true);

      fetchSpy.mockRestore();
    });

    it('should keep current state on network error', async () => {
      act(() => {
        useAuthStore.getState().login({ id: 1, username: 'testuser' });
      });

      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));

      await act(async () => {
        await useAuthStore.getState().validateSession();
      });

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.username).toBe('testuser');

      fetchSpy.mockRestore();
    });
  });
});
