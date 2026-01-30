import { useQuery } from '@tanstack/react-query';
import { subtaskService } from '../../services/api';
import { queryKeys } from '../../lib/queryClient';

export function useSubtasksByTask(taskId: number | null) {
    return useQuery({
        queryKey: queryKeys.subtasks.byTask(taskId!),
        queryFn: () => subtaskService.getSubtasksByTask(taskId!),
        enabled: !!taskId,
    });
}
