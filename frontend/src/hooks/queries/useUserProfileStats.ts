import { useQuery } from '@tanstack/react-query';
import { userService } from '../../services/api';
import { queryKeys } from '../../lib/queryClient';
import type { ConnectionStatus } from '../../types';

export const useUserProfileStats = (
  username: string | undefined,
  connectionStatus: ConnectionStatus | undefined,
  isProfilePublic: boolean | undefined
) => {
  const canView =
    connectionStatus === 'SELF' ||
    connectionStatus === 'ACCEPTED' ||
    isProfilePublic === true;

  return useQuery({
    queryKey: queryKeys.userProfileStats(username || ''),
    queryFn: () => userService.getUserProfileStats(username!),
    enabled: !!username && canView,
  });
};
