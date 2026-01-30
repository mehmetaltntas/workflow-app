import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,       // 1 dakika
      gcTime: 5 * 60 * 1000,      // 5 dakika
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
});

// Query keys - Type-safe query key management
export const queryKeys = {
  boards: {
    all: ['boards'] as const,
    list: (userId: number) => ['boards', 'list', userId] as const,
    detail: (slug: string) => ['boards', 'detail', slug] as const,
    assigned: ['boards', 'assigned'] as const,
    myTeamBoards: ['boards', 'myTeamBoards'] as const,
  },
  profile: {
    stats: (userId: number) => ['profile', 'stats', userId] as const,
  },
  userSearch: (query: string) => ['userSearch', query] as const,
  userProfile: (username: string) => ['userProfile', username] as const,
  userProfileStats: (username: string) => ['userProfileStats', username] as const,
  subtasks: {
    byTask: (taskId: number) => ['subtasks', taskId] as const,
  },
  boardMembers: {
    list: (boardId: number) => ['boardMembers', boardId] as const,
  },
  connections: {
    pending: ['connections', 'pending'] as const,
    count: ['connections', 'count'] as const,
    accepted: ['connections', 'accepted'] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    unreadCount: ['notifications', 'unreadCount'] as const,
  },
};
