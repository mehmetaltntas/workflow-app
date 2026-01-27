import { useMutation, useQueryClient } from '@tanstack/react-query';
import { connectionService } from '../../services/api';
import { queryKeys } from '../../lib/queryClient';
import toast from 'react-hot-toast';

export const useSendConnectionRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (targetUserId: number) => connectionService.sendRequest(targetUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.connections.pending });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      toast.success('Baglanti istegi gonderildi');
    },
    onError: (error) => {
      const err = error as { response?: { data?: string } };
      toast.error(err.response?.data || 'Baglanti istegi gonderilemedi');
    },
  });
};

export const useAcceptConnectionRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (connectionId: number) => connectionService.acceptRequest(connectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.connections.pending });
      queryClient.invalidateQueries({ queryKey: queryKeys.connections.count });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      toast.success('Baglanti kabul edildi');
    },
    onError: (error) => {
      const err = error as { response?: { data?: string } };
      toast.error(err.response?.data || 'Baglanti kabul edilemedi');
    },
  });
};

export const useRejectConnectionRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (connectionId: number) => connectionService.rejectRequest(connectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.connections.pending });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      toast.success('Baglanti reddedildi');
    },
    onError: (error) => {
      const err = error as { response?: { data?: string } };
      toast.error(err.response?.data || 'Baglanti reddedilemedi');
    },
  });
};
