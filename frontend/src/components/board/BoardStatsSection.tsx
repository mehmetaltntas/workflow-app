import { StatsBar } from "../StatsBar";
import type { Board, Task, TaskList, Subtask } from "../../types";

export interface BoardStatsSectionProps {
  board: Board;
  selectedList: TaskList | null;
  selectedTask: Task | null;
  subtasks: Subtask[] | undefined;
}

export const BoardStatsSection = ({
  board,
  selectedList,
  selectedTask,
  subtasks,
}: BoardStatsSectionProps) => {
  return (
    <StatsBar
      board={board}
      selectedList={selectedList}
      selectedTask={selectedTask}
      subtasks={subtasks}
    />
  );
};
