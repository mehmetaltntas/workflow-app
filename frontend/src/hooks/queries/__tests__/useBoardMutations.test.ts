import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { useCreateBoard, useUpdateBoard, useDeleteBoard, useUpdateBoardStatus } from '../useBoardMutations';

// Mock dependencies
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../../../services/api', () => ({
  boardService: {
    createBoard: vi.fn(),
    updateBoard: vi.fn(),
    deleteBoard: vi.fn(),
    updateBoardStatus: vi.fn(),
  },
}));

vi.mock('../../../stores/authStore', () => ({
  useAuthStore: vi.fn((selector: (state: { userId: number; username: string }) => unknown) =>
    selector({ userId: 1, username: 'testuser' })
  ),
}));

vi.mock('../../../lib/queryClient', () => ({
  queryKeys: {
    boards: {
      all: ['boards'],
      list: (userId: number) => ['boards', 'list', userId],
    },
    userProfileStats: (username: string) => ['userProfileStats', username],
  },
}));

import { boardService } from '../../../services/api';
import toast from 'react-hot-toast';

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const createWrapper = (queryClient: QueryClient) => {
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useBoardMutations', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  describe('useCreateBoard', () => {
    it('should call boardService.createBoard with correct data', async () => {
      const mockBoard = { id: 1, name: 'New Board', status: 'PLANLANDI' };
      vi.mocked(boardService.createBoard).mockResolvedValue(mockBoard);

      const { result } = renderHook(() => useCreateBoard(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate({ name: 'New Board' });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(boardService.createBoard).toHaveBeenCalledWith({
        name: 'New Board',
        status: 'PLANLANDI',
      });
      expect(toast.success).toHaveBeenCalledWith('Pano oluşturuldu');
    });

    it('should show conflict error for duplicate board name', async () => {
      vi.mocked(boardService.createBoard).mockRejectedValue({
        response: { status: 409 },
      });

      const { result } = renderHook(() => useCreateBoard(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate({ name: 'Existing Board' });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(toast.error).toHaveBeenCalledWith('Bu isimde bir pano zaten mevcut');
    });

    it('should show generic error for non-409 errors', async () => {
      vi.mocked(boardService.createBoard).mockRejectedValue({
        response: { status: 500 },
      });

      const { result } = renderHook(() => useCreateBoard(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate({ name: 'Board' });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(toast.error).toHaveBeenCalledWith('Pano oluşturulamadı');
    });
  });

  describe('useUpdateBoard', () => {
    it('should optimistically update the cache', async () => {
      const boards = {
        content: [
          { id: 1, name: 'Board 1', status: 'PLANLANDI' },
          { id: 2, name: 'Board 2', status: 'PLANLANDI' },
        ],
        totalElements: 2,
      };

      queryClient.setQueryData(['boards', 'list', 1], boards);

      vi.mocked(boardService.updateBoard).mockResolvedValue({
        ...boards.content[0],
        name: 'Updated Board',
      });

      const { result } = renderHook(() => useUpdateBoard(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate({ boardId: 1, data: { name: 'Updated Board' } });

      // Check optimistic update was applied
      await waitFor(() => {
        const cached = queryClient.getQueryData<{ content: { name: string }[] }>(['boards', 'list', 1]);
        expect(cached?.content[0].name).toBe('Updated Board');
      });
    });

    it('should rollback on error', async () => {
      const boards = {
        content: [{ id: 1, name: 'Original', status: 'PLANLANDI' }],
        totalElements: 1,
      };

      queryClient.setQueryData(['boards', 'list', 1], boards);

      vi.mocked(boardService.updateBoard).mockRejectedValue({
        response: { status: 500, data: { message: 'Server error' } },
      });

      const { result } = renderHook(() => useUpdateBoard(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate({ boardId: 1, data: { name: 'Updated' } });

      await waitFor(() => expect(result.current.isError).toBe(true));

      // Should rollback to original
      const cached = queryClient.getQueryData<{ content: { name: string }[] }>(['boards', 'list', 1]);
      expect(cached?.content[0].name).toBe('Original');
    });

    it('should show conflict error for 409 status', async () => {
      vi.mocked(boardService.updateBoard).mockRejectedValue({
        response: { status: 409 },
      });

      const { result } = renderHook(() => useUpdateBoard(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate({ boardId: 1, data: { name: 'Dup' } });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(toast.error).toHaveBeenCalledWith('Bu isimde bir pano zaten mevcut');
    });
  });

  describe('useDeleteBoard', () => {
    it('should optimistically remove board from cache', async () => {
      const boards = {
        content: [
          { id: 1, name: 'Board 1' },
          { id: 2, name: 'Board 2' },
        ],
        totalElements: 2,
      };

      queryClient.setQueryData(['boards', 'list', 1], boards);

      vi.mocked(boardService.deleteBoard).mockResolvedValue(undefined);

      const { result } = renderHook(() => useDeleteBoard(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate(1);

      await waitFor(() => {
        const cached = queryClient.getQueryData<{ content: { id: number }[]; totalElements: number }>(['boards', 'list', 1]);
        expect(cached?.content).toHaveLength(1);
        expect(cached?.content[0].id).toBe(2);
        expect(cached?.totalElements).toBe(1);
      });
    });

    it('should rollback on deletion error', async () => {
      const boards = {
        content: [{ id: 1, name: 'Board 1' }],
        totalElements: 1,
      };

      queryClient.setQueryData(['boards', 'list', 1], boards);

      vi.mocked(boardService.deleteBoard).mockRejectedValue(new Error('Failed'));

      const { result } = renderHook(() => useDeleteBoard(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate(1);

      await waitFor(() => expect(result.current.isError).toBe(true));

      const cached = queryClient.getQueryData<{ content: { id: number }[] }>(['boards', 'list', 1]);
      expect(cached?.content).toHaveLength(1);
      expect(toast.error).toHaveBeenCalledWith('Pano silinemedi');
    });
  });

  describe('useUpdateBoardStatus', () => {
    it('should optimistically update board status', async () => {
      const boards = {
        content: [{ id: 1, name: 'Board 1', status: 'PLANLANDI' }],
        totalElements: 1,
      };

      queryClient.setQueryData(['boards', 'list', 1], boards);

      vi.mocked(boardService.updateBoardStatus).mockResolvedValue({
        ...boards.content[0],
        status: 'DEVAM_EDIYOR',
      });

      const { result } = renderHook(() => useUpdateBoardStatus(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate({ boardId: 1, status: 'DEVAM_EDIYOR' });

      await waitFor(() => {
        const cached = queryClient.getQueryData<{ content: { status: string }[] }>(['boards', 'list', 1]);
        expect(cached?.content[0].status).toBe('DEVAM_EDIYOR');
      });

      expect(toast.success).toHaveBeenCalledWith('Statü güncellendi');
    });

    it('should rollback status on error', async () => {
      const boards = {
        content: [{ id: 1, name: 'Board 1', status: 'PLANLANDI' }],
        totalElements: 1,
      };

      queryClient.setQueryData(['boards', 'list', 1], boards);

      vi.mocked(boardService.updateBoardStatus).mockRejectedValue(new Error('Failed'));

      const { result } = renderHook(() => useUpdateBoardStatus(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate({ boardId: 1, status: 'TAMAMLANDI' });

      await waitFor(() => expect(result.current.isError).toBe(true));

      const cached = queryClient.getQueryData<{ content: { status: string }[] }>(['boards', 'list', 1]);
      expect(cached?.content[0].status).toBe('PLANLANDI');
      expect(toast.error).toHaveBeenCalledWith('Statü güncellenemedi');
    });
  });
});
