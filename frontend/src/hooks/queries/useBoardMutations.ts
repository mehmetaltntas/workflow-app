import { useMutation, useQueryClient } from '@tanstack/react-query';
import { boardService } from '../../services/api';
import { queryKeys } from '../../lib/queryClient';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';
import type { Board } from '../../types';

interface BoardListResponse {
  content: Board[];
  totalElements: number;
}

/**
 * Hook for creating a new board
 */
export const useCreateBoard = () => {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.userId);

  return useMutation({
    mutationFn: async (data: {
      name: string;
      status?: string;
      link?: string;
      description?: string;
      deadline?: string;
      category?: string;
    }) => {
      if (!userId) throw new Error('User not authenticated');
      return boardService.createBoard({
        ...data,
        status: data.status || 'PLANLANDI',
      });
    },
    onSuccess: () => {
      // Invalidate and refetch boards list
      queryClient.invalidateQueries({ queryKey: queryKeys.boards.all });
      toast.success('Pano oluşturuldu');
    },
    onError: (error) => {
      console.error('Board creation error:', error);
      const axiosError = error as { response?: { status?: number } };
      if (axiosError.response?.status === 409) {
        toast.error('Bu isimde bir pano zaten mevcut');
      } else {
        toast.error('Pano oluşturulamadı');
      }
    },
  });
};

/**
 * Hook for updating a board
 */
export const useUpdateBoard = () => {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.userId);

  return useMutation({
    mutationFn: async ({
      boardId,
      data,
    }: {
      boardId: number;
      data: {
        name?: string;
        status?: string;
        link?: string;
        description?: string;
        deadline?: string;
        category?: string;
      };
    }) => {
      if (!userId) throw new Error('User not authenticated');
      return boardService.updateBoard(boardId, data);
    },
    onMutate: async ({ boardId, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.boards.all });

      // Snapshot the previous value (raw cache is { content: Board[], totalElements })
      const previousData = queryClient.getQueryData<BoardListResponse>(
        queryKeys.boards.list(userId || 0)
      );

      // Optimistically update the cache
      if (previousData?.content) {
        queryClient.setQueryData<BoardListResponse>(
          queryKeys.boards.list(userId || 0),
          {
            ...previousData,
            content: previousData.content.map((board) =>
              board.id === boardId ? { ...board, ...data } : board
            ),
          }
        );
      }

      return { previousData };
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(
          queryKeys.boards.list(userId || 0),
          context.previousData
        );
      }
      const axiosError = error as { response?: { status?: number; data?: { message?: string } } };
      console.error('Board update error:', error, 'Response:', axiosError.response?.data);
      if (axiosError.response?.status === 409) {
        toast.error('Bu isimde bir pano zaten mevcut');
      } else {
        toast.error(axiosError.response?.data?.message || 'Pano güncellenemedi');
      }
    },
    onSuccess: () => {
      toast.success('Pano güncellendi');
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.boards.all });
    },
  });
};

/**
 * Hook for deleting a board
 */
export const useDeleteBoard = () => {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.userId);

  return useMutation({
    mutationFn: async (boardId: number) => {
      return boardService.deleteBoard(boardId);
    },
    onMutate: async (boardId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.boards.all });

      // Snapshot the previous value (raw cache is { content: Board[], totalElements })
      const previousData = queryClient.getQueryData<BoardListResponse>(
        queryKeys.boards.list(userId || 0)
      );

      // Optimistically remove from cache
      if (previousData?.content) {
        queryClient.setQueryData<BoardListResponse>(
          queryKeys.boards.list(userId || 0),
          {
            ...previousData,
            content: previousData.content.filter((board) => board.id !== boardId),
            totalElements: previousData.totalElements - 1,
          }
        );
      }

      return { previousData };
    },
    onError: (error, _boardId, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(
          queryKeys.boards.list(userId || 0),
          context.previousData
        );
      }
      console.error('Board deletion error:', error);
      toast.error('Pano silinemedi');
    },
    onSuccess: () => {
      toast.success('Pano silindi');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.boards.all });
    },
  });
};

/**
 * Hook for updating board status quickly
 */
export const useUpdateBoardStatus = () => {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.userId);

  return useMutation({
    mutationFn: async ({
      boardId,
      status,
    }: {
      boardId: number;
      status: string;
    }) => {
      return boardService.updateBoardStatus(boardId, status);
    },
    onMutate: async ({ boardId, status }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.boards.all });

      const previousData = queryClient.getQueryData<BoardListResponse>(
        queryKeys.boards.list(userId || 0)
      );

      if (previousData?.content) {
        queryClient.setQueryData<BoardListResponse>(
          queryKeys.boards.list(userId || 0),
          {
            ...previousData,
            content: previousData.content.map((board) =>
              board.id === boardId ? { ...board, status } : board
            ),
          }
        );
      }

      return { previousData };
    },
    onError: (error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          queryKeys.boards.list(userId || 0),
          context.previousData
        );
      }
      console.error('Status update error:', error);
      toast.error('Statü güncellenemedi');
    },
    onSuccess: () => {
      toast.success('Statü güncellendi');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.boards.all });
    },
  });
};
