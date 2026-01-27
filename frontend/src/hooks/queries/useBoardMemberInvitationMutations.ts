import { useMutation, useQueryClient } from '@tanstack/react-query';
import { boardMemberService } from '../../services/api';
import { queryKeys } from '../../lib/queryClient';
import type { Notification } from '../../types';
import toast from 'react-hot-toast';

export const useAcceptBoardMemberInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (memberId: number) => boardMemberService.acceptInvitation(memberId),
    onMutate: async (memberId: number) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.all });
      const previous = queryClient.getQueryData<Notification[]>(queryKeys.notifications.all);
      queryClient.setQueryData<Notification[]>(queryKeys.notifications.all, (old) =>
        old?.filter(n => !(n.type === 'BOARD_MEMBER_INVITATION' && n.referenceId === memberId)) ?? []
      );
      return { previous };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount });
      queryClient.invalidateQueries({ queryKey: queryKeys.boards.assigned });
      toast.success('Davet kabul edildi');
    },
    onError: (error, _memberId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.notifications.all, context.previous);
      }
      const err = error as { response?: { data?: string } };
      toast.error(err.response?.data || 'Davet kabul edilemedi');
    },
  });
};

export const useRejectBoardMemberInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (memberId: number) => boardMemberService.rejectInvitation(memberId),
    onMutate: async (memberId: number) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.all });
      const previous = queryClient.getQueryData<Notification[]>(queryKeys.notifications.all);
      queryClient.setQueryData<Notification[]>(queryKeys.notifications.all, (old) =>
        old?.filter(n => !(n.type === 'BOARD_MEMBER_INVITATION' && n.referenceId === memberId)) ?? []
      );
      return { previous };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount });
      toast.success('Davet reddedildi');
    },
    onError: (error, _memberId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.notifications.all, context.previous);
      }
      const err = error as { response?: { data?: string } };
      toast.error(err.response?.data || 'Davet reddedilemedi');
    },
  });
};
