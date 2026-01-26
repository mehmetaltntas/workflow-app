import { useState, useEffect } from "react";
import { boardService } from "../services/api";
import type { Board, TaskList, Task, Subtask } from "../types";
import { useAuthStore } from "../stores/authStore";

export interface BoardStats {
  total: number;
  byStatus: {
    PLANLANDI: number;
    DEVAM_EDIYOR: number;
    TAMAMLANDI: number;
    DURDURULDU: number;
    BIRAKILDI: number;
  };
}

export interface ListStats {
  total: number;
  completed: number;
  pending: number;
}

export interface TaskStats {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  dueToday: number;
}

export interface SubtaskStats {
  total: number;
  completed: number;
  pending: number;
}

export interface CategoryStat {
  category: string;
  count: number;
}

export interface ProfileStats {
  boards: BoardStats;
  lists: ListStats;
  tasks: TaskStats;
  subtasks: SubtaskStats;
  overallProgress: number;
  topCategories: CategoryStat[];
}

const defaultStats: ProfileStats = {
  boards: {
    total: 0,
    byStatus: {
      PLANLANDI: 0,
      DEVAM_EDIYOR: 0,
      TAMAMLANDI: 0,
      DURDURULDU: 0,
      BIRAKILDI: 0,
    },
  },
  lists: {
    total: 0,
    completed: 0,
    pending: 0,
  },
  tasks: {
    total: 0,
    completed: 0,
    pending: 0,
    overdue: 0,
    dueToday: 0,
  },
  subtasks: {
    total: 0,
    completed: 0,
    pending: 0,
  },
  overallProgress: 0,
  topCategories: [],
};

export const useProfileStats = () => {
  const [stats, setStats] = useState<ProfileStats>(defaultStats);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [boards, setBoards] = useState<Board[]>([]);

  const userId = useAuthStore((state) => state.userId);

  useEffect(() => {
    const fetchStats = async () => {
      if (!userId) {
        setError("Kullanici bulunamadi");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Get all boards with nested data
        const boardsData = await boardService.getUserBoards(Number(userId));
        const boardsList = boardsData.content;

        // Fetch detailed data for each board
        const detailedBoards = await Promise.all(
          boardsList.map((board) => boardService.getBoardDetails(board.slug))
        );

        setBoards(detailedBoards);

        // Calculate statistics
        const calculatedStats = calculateStats(detailedBoards);
        setStats(calculatedStats);
      } catch (err) {
        console.error("Istatistikler yuklenirken hata:", err);
        setError("Istatistikler yuklenemedi");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [userId]);

  return { stats, isLoading, error, boards };
};

function calculateStats(boards: Board[]): ProfileStats {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const boardStats: BoardStats = {
    total: boards.length,
    byStatus: {
      PLANLANDI: 0,
      DEVAM_EDIYOR: 0,
      TAMAMLANDI: 0,
      DURDURULDU: 0,
      BIRAKILDI: 0,
    },
  };

  const listStats: ListStats = {
    total: 0,
    completed: 0,
    pending: 0,
  };

  const taskStats: TaskStats = {
    total: 0,
    completed: 0,
    pending: 0,
    overdue: 0,
    dueToday: 0,
  };

  const subtaskStats: SubtaskStats = {
    total: 0,
    completed: 0,
    pending: 0,
  };

  boards.forEach((board) => {
    // Board status
    const status = board.status as keyof typeof boardStats.byStatus;
    if (status && boardStats.byStatus[status] !== undefined) {
      boardStats.byStatus[status]++;
    }

    // Process lists
    if (board.taskLists) {
      board.taskLists.forEach((list: TaskList) => {
        listStats.total++;
        if (list.isCompleted) {
          listStats.completed++;
        } else {
          listStats.pending++;
        }

        // Process tasks
        if (list.tasks) {
          list.tasks.forEach((task: Task) => {
            taskStats.total++;
            if (task.isCompleted) {
              taskStats.completed++;
            } else {
              taskStats.pending++;

              // Check due date
              if (task.dueDate) {
                const dueDate = new Date(task.dueDate);
                dueDate.setHours(0, 0, 0, 0);

                if (dueDate.getTime() === today.getTime()) {
                  taskStats.dueToday++;
                } else if (dueDate < today) {
                  taskStats.overdue++;
                }
              }
            }

            // Process subtasks
            if (task.subtasks) {
              task.subtasks.forEach((subtask: Subtask) => {
                subtaskStats.total++;
                if (subtask.isCompleted) {
                  subtaskStats.completed++;
                } else {
                  subtaskStats.pending++;
                }
              });
            }
          });
        }
      });
    }
  });

  // Calculate category stats
  const categoryCounts: Record<string, number> = {};
  boards.forEach((board) => {
    if (board.category) {
      categoryCounts[board.category] = (categoryCounts[board.category] || 0) + 1;
    }
  });

  const topCategories: CategoryStat[] = Object.entries(categoryCounts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Calculate overall progress
  const totalItems = taskStats.total + subtaskStats.total;
  const completedItems = taskStats.completed + subtaskStats.completed;
  const overallProgress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  return {
    boards: boardStats,
    lists: listStats,
    tasks: taskStats,
    subtasks: subtaskStats,
    overallProgress,
    topCategories,
  };
}

export default useProfileStats;
