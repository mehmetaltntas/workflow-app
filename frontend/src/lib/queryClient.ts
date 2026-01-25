import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,  // 5 dakika
      gcTime: 10 * 60 * 1000,    // 10 dakika (eski adıyla cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Query keys - Type-safe query key management
export const queryKeys = {
  boards: {
    all: ['boards'] as const,
    list: (userId: number) => ['boards', 'list', userId] as const,
    detail: (slug: string) => ['boards', 'detail', slug] as const,
  },
  profile: {
    stats: (userId: number) => ['profile', 'stats', userId] as const,
  },
};
