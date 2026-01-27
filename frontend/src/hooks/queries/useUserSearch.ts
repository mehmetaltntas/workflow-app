import { useQuery } from '@tanstack/react-query';
import { searchService } from '../../services/api';
import { queryKeys } from '../../lib/queryClient';

export const useUserSearch = (query: string) => {
  const trimmed = query.trim();

  return useQuery({
    queryKey: queryKeys.userSearch(trimmed),
    queryFn: () => searchService.searchUsers(trimmed),
    enabled: trimmed.length >= 2,
    staleTime: 30 * 1000, // 30 saniye
  });
};
