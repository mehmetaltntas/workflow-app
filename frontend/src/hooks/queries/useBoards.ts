import { useQuery } from '@tanstack/react-query';
import { boardService } from '../../services/api';
import { queryKeys } from '../../lib/queryClient';
import { useAuthStore } from '../../stores/authStore';
import type { Board } from '../../types';

/**
 * Hook to fetch all boards for the current user
 */
export const useBoardsQuery = () => {
  const userId = useAuthStore((state) => state.userId);

  return useQuery({
    queryKey: queryKeys.boards.list(userId || 0),
    queryFn: async () => {
      if (!userId) {
        return { content: [] as Board[], totalElements: 0 };
      }
      return boardService.getUserBoards(userId);
    },
    enabled: !!userId, // Only run query if userId exists
    select: (data) => data.content, // Transform to just return the boards array
  });
};

/**
 * Hook to fetch board details by slug
 */
export const useBoardDetailQuery = (slug: string | undefined) => {
  return useQuery({
    queryKey: queryKeys.boards.detail(slug || ''),
    queryFn: async () => {
      if (!slug) throw new Error('Slug is required');
      return boardService.getBoardDetails(slug);
    },
    enabled: !!slug && slug !== 'null' && slug !== 'undefined',
  });
};
