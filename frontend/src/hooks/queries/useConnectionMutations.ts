import { useMutation, useQueryClient } from '@tanstack/react-query';
import { connectionService } from '../../services/api';
import { queryKeys } from '../../lib/queryClient';
import type { Notification } from '../../types';
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
    onMutate: async (connectionId: number) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.all });
      const previous = queryClient.getQueryData<Notification[]>(queryKeys.notifications.all);
      queryClient.setQueryData<Notification[]>(queryKeys.notifications.all, (old) =>
        old?.filter(n => !(n.type === 'CONNECTION_REQUEST' && n.referenceId === connectionId)) ?? []
      );
      return { previous };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.connections.pending });
      queryClient.invalidateQueries({ queryKey: queryKeys.connections.count });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      toast.success('Baglanti kabul edildi');
    },
    onError: (error, _connectionId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.notifications.all, context.previous);
      }
      const err = error as { response?: { data?: string } };
      toast.error(err.response?.data || 'Baglanti kabul edilemedi');
    },
  });
};

export const useRejectConnectionRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (connectionId: number) => connectionService.rejectRequest(connectionId),
    onMutate: async (connectionId: number) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.all });
      const previous = queryClient.getQueryData<Notification[]>(queryKeys.notifications.all);
      queryClient.setQueryData<Notification[]>(queryKeys.notifications.all, (old) =>
        old?.filter(n => !(n.type === 'CONNECTION_REQUEST' && n.referenceId === connectionId)) ?? []
      );
      return { previous };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.connections.pending });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      toast.success('Baglanti reddedildi');
    },
    onError: (error, _connectionId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.notifications.all, context.previous);
      }
      const err = error as { response?: { data?: string } };
      toast.error(err.response?.data || 'Baglanti reddedilemedi');
    },
  });
};
