import { useMutation, useQueryClient } from '@tanstack/react-query';
import { boardMemberService } from '../../services/api';
import { queryKeys } from '../../lib/queryClient';
import toast from 'react-hot-toast';
import type { Board, BoardMember } from '../../types';

export const useAddBoardMember = (boardId: number, slug: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: number) => boardMemberService.addMember(boardId, userId),
    onSuccess: (data: BoardMember) => {
      // Immediately update board detail cache with the new member
      queryClient.setQueryData(queryKeys.boards.detail(slug), (oldBoard: Board | undefined) => {
        if (!oldBoard) return oldBoard;
        const members = [...(oldBoard.members || [])];
        const existingIdx = members.findIndex((m) => m.userId === data.userId);
        if (existingIdx >= 0) {
          members[existingIdx] = data;
        } else {
          members.push(data);
        }
        return { ...oldBoard, members };
      });
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

export const useCreateBulkAssignment = (boardId: number, slug: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ memberId, assignments }: { memberId: number; assignments: { targetType: string; targetId: number }[] }) =>
      boardMemberService.createBulkAssignment(boardId, memberId, assignments),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.boards.detail(slug) });
      queryClient.invalidateQueries({ queryKey: queryKeys.boardMembers.list(boardId) });
      toast.success('Toplu atama yapıldı');
    },
    onError: (error) => {
      const err = error as { response?: { status?: number; data?: string } };
      if (err.response?.status === 409) {
        toast.error('Bazı atamalar zaten mevcut');
      } else {
        toast.error(err.response?.data || 'Toplu atama yapılamadı');
      }
    },
  });
};

export const useUpdateBoardMemberRole = (boardId: number, slug: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ memberId, role }: { memberId: number; role: 'MEMBER' | 'MODERATOR' }) =>
      boardMemberService.updateMemberRole(boardId, memberId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.boards.detail(slug) });
      queryClient.invalidateQueries({ queryKey: queryKeys.boardMembers.list(boardId) });
      toast.success('Üye rolü güncellendi');
    },
    onError: (error) => {
      const err = error as { response?: { data?: string } };
      toast.error(err.response?.data || 'Rol güncellenemedi');
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
