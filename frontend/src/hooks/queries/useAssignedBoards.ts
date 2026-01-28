import { useQuery } from '@tanstack/react-query';
import { boardService } from '../../services/api';
import { queryKeys } from '../../lib/queryClient';

export const useAssignedBoardsQuery = () => {
  return useQuery({
    queryKey: queryKeys.boards.assigned,
    queryFn: () => boardService.getAssignedBoards(),
  });
};

export const useMyTeamBoardsQuery = () => {
  return useQuery({
    queryKey: queryKeys.boards.myTeamBoards,
    queryFn: () => boardService.getMyTeamBoards(),
  });
};
