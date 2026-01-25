import { useMutation, useQueryClient } from '@tanstack/react-query';
import { boardService } from '../../services/api';
import { queryKeys } from '../../lib/queryClient';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';
import type { Board } from '../../types';

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
    }) => {
      if (!userId) throw new Error('User not authenticated');
      return boardService.createBoard({
        ...data,
        userId,
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
      toast.error('Pano oluşturulamadı');
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
      };
    }) => {
      if (!userId) throw new Error('User not authenticated');
      return boardService.updateBoard(boardId, { ...data, userId });
    },
    onMutate: async ({ boardId, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.boards.all });

      // Snapshot the previous value
      const previousBoards = queryClient.getQueryData<Board[]>(
        queryKeys.boards.list(userId || 0)
      );

      // Optimistically update the cache
      if (previousBoards) {
        queryClient.setQueryData<Board[]>(
          queryKeys.boards.list(userId || 0),
          previousBoards.map((board) =>
            board.id === boardId ? { ...board, ...data } : board
          )
        );
      }

      return { previousBoards };
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousBoards) {
        queryClient.setQueryData(
          queryKeys.boards.list(userId || 0),
          context.previousBoards
        );
      }
      console.error('Board update error:', error);
      toast.error('Pano güncellenemedi');
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

      // Snapshot the previous value
      const previousBoards = queryClient.getQueryData<Board[]>(
        queryKeys.boards.list(userId || 0)
      );

      // Optimistically remove from cache
      if (previousBoards) {
        queryClient.setQueryData<Board[]>(
          queryKeys.boards.list(userId || 0),
          previousBoards.filter((board) => board.id !== boardId)
        );
      }

      return { previousBoards };
    },
    onError: (error, _boardId, context) => {
      // Rollback on error
      if (context?.previousBoards) {
        queryClient.setQueryData(
          queryKeys.boards.list(userId || 0),
          context.previousBoards
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

      const previousBoards = queryClient.getQueryData<Board[]>(
        queryKeys.boards.list(userId || 0)
      );

      if (previousBoards) {
        queryClient.setQueryData<Board[]>(
          queryKeys.boards.list(userId || 0),
          previousBoards.map((board) =>
            board.id === boardId ? { ...board, status } : board
          )
        );
      }

      return { previousBoards };
    },
    onError: (error, _variables, context) => {
      if (context?.previousBoards) {
        queryClient.setQueryData(
          queryKeys.boards.list(userId || 0),
          context.previousBoards
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
