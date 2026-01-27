import { useQuery } from '@tanstack/react-query';
import { userService } from '../../services/api';
import { queryKeys } from '../../lib/queryClient';

export const useUserProfile = (username: string | undefined) => {
  return useQuery({
    queryKey: queryKeys.userProfile(username || ''),
    queryFn: () => userService.getUserProfile(username!),
    enabled: !!username,
  });
};
