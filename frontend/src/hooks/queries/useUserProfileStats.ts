import { useQuery } from '@tanstack/react-query';
import { userService } from '../../services/api';
import { queryKeys } from '../../lib/queryClient';
import type { ConnectionStatus, PrivacyMode } from '../../types';

export const useUserProfileStats = (
  username: string | undefined,
  connectionStatus: ConnectionStatus | undefined,
  privacyMode: PrivacyMode | undefined
) => {
  const canView =
    connectionStatus === 'SELF' ||
    connectionStatus === 'ACCEPTED' ||
    privacyMode === 'PUBLIC' ||
    privacyMode === 'PRIVATE';

  return useQuery({
    queryKey: queryKeys.userProfileStats(username || ''),
    queryFn: () => userService.getUserProfileStats(username!),
    enabled: !!username && canView,
  });
};
