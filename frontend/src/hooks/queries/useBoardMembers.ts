import { useMutation, useQueryClient } from '@tanstack/react-query';
import { boardMemberService } from '../../services/api';
import { queryKeys } from '../../lib/queryClient';
import toast from 'react-hot-toast';

export const useAddBoardMember = (boardId: number, slug: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: number) => boardMemberService.addMember(boardId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.boards.detail(slug) });
      queryClient.invalidateQueries({ queryKey: queryKeys.boardMembers.list(boardId) });
      toast.success('Üye eklendi');
    },
    onError: (error) => {
      const err = error as { response?: { status?: number; data?: string } };
      if (err.response?.status === 409) {
        toast.error('Bu kullanıcı zaten üye');
      } else {
        toast.error(err.response?.data || 'Üye eklenemedi');
      }
    },
  });
};

export const useRemoveBoardMember = (boardId: number, slug: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (memberId: number) => boardMemberService.removeMember(boardId, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.boards.detail(slug) });
      queryClient.invalidateQueries({ queryKey: queryKeys.boardMembers.list(boardId) });
      toast.success('Üye kaldırıldı');
    },
    onError: (error) => {
      const err = error as { response?: { data?: string } };
      toast.error(err.response?.data || 'Üye kaldırılamadı');
    },
  });
};

export const useCreateAssignment = (boardId: number, slug: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ memberId, targetType, targetId }: { memberId: number; targetType: string; targetId: number }) =>
      boardMemberService.createAssignment(boardId, memberId, { targetType, targetId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.boards.detail(slug) });
      queryClient.invalidateQueries({ queryKey: queryKeys.boardMembers.list(boardId) });
      toast.success('Atama yapıldı');
    },
    onError: (error) => {
      const err = error as { response?: { status?: number; data?: string } };
      if (err.response?.status === 409) {
        toast.error('Bu atama zaten mevcut');
      } else {
        toast.error(err.response?.data || 'Atama yapılamadı');
      }
    },
  });
};

export const useRemoveAssignment = (boardId: number, slug: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ memberId, assignmentId }: { memberId: number; assignmentId: number }) =>
      boardMemberService.removeAssignment(boardId, memberId, assignmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.boards.detail(slug) });
      queryClient.invalidateQueries({ queryKey: queryKeys.boardMembers.list(boardId) });
      toast.success('Atama kaldırıldı');
    },
    onError: (error) => {
      const err = error as { response?: { data?: string } };
      toast.error(err.response?.data || 'Atama kaldırılamadı');
    },
  });
};
