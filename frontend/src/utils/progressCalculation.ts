import type { Board } from "../types";

/**
 * Leaf-node progress calculation.
 *
 * Counts only the smallest work units:
 * - If a task has subtasks -> count the subtasks (not the task itself)
 * - If a task has no subtasks -> count the task itself
 * - Lists are never counted (they are containers only)
 */
export function calculateLeafNodeCounts(board: Board): { total: number; completed: number } {
  let total = 0;
  let completed = 0;

  const lists = board.taskLists || [];
  lists.forEach(list => {
    const tasks = list.tasks || [];
    tasks.forEach(task => {
      const subtasks = task.subtasks || [];
      if (subtasks.length > 0) {
        // Task has subtasks -> count subtasks + parent task itself
        // This ensures 100% only when both subtasks AND parent task are completed
        total += subtasks.length + 1;
        completed += subtasks.filter(s => s.isCompleted).length + (task.isCompleted ? 1 : 0);
      } else {
        // Task has no subtasks -> task itself is the leaf node
        total += 1;
        if (task.isCompleted) {
          completed += 1;
        }
      }
    });
  });

  return { total, completed };
}

export function calculateBoardProgress(board: Board): number {
  const { total, completed } = calculateLeafNodeCounts(board);
  return total > 0 ? Math.round((completed / total) * 100) : 0;
}

/**
 * Aggregate leaf-node counts across multiple boards (for profile stats).
 */
export function calculateMultiBoardLeafNodeCounts(boards: Board[]): { total: number; completed: number } {
  let total = 0;
  let completed = 0;

  boards.forEach(board => {
    const counts = calculateLeafNodeCounts(board);
    total += counts.total;
    completed += counts.completed;
  });

  return { total, completed };
}
