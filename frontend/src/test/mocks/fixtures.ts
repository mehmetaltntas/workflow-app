import type { Board, Task, TaskList, Label, Priority } from '../../types/index'

export const mockUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  token: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
}

export const mockLabel: Label = {
  id: 1,
  name: 'Bug',
  color: '#ef4444',
}

export const mockLabels: Label[] = [
  { id: 1, name: 'Bug', color: '#ef4444' },
  { id: 2, name: 'Feature', color: '#22c55e' },
  { id: 3, name: 'Enhancement', color: '#3b82f6' },
]

export const mockTask: Task = {
  id: 1,
  title: 'Test Task',
  description: 'Test description',
  position: 0,
  isCompleted: false,
  createdAt: '2024-01-15T10:00:00Z',
  dueDate: undefined,
  priority: undefined,
  labels: [],
  subtasks: [],
  link: undefined,
}

export const mockTaskWithLabels: Task = {
  ...mockTask,
  id: 2,
  title: 'Task with Labels',
  labels: mockLabels.slice(0, 2),
  priority: 'HIGH' as Priority,
  dueDate: '2024-01-20',
}

export const mockTaskCompleted: Task = {
  ...mockTask,
  id: 3,
  title: 'Completed Task',
  isCompleted: true,
}

export const mockTaskList: TaskList = {
  id: 1,
  name: 'To Do',
  link: undefined,
  isCompleted: false,
  tasks: [mockTask, mockTaskWithLabels],
}

export const mockTaskListDone: TaskList = {
  id: 2,
  name: 'Done',
  link: undefined,
  isCompleted: true,
  tasks: [mockTaskCompleted],
}

export const mockBoard: Board = {
  id: 1,
  name: 'Test Board',
  slug: 'test-board',
  status: 'PLANLANDI',
  description: 'Test board description',
  link: undefined,
  deadline: undefined,
  ownerName: 'testuser',
  taskLists: [mockTaskList, mockTaskListDone],
  labels: mockLabels,
}

export const mockBoards: Board[] = [
  mockBoard,
  {
    id: 2,
    name: 'Another Board',
    slug: 'another-board',
    status: 'DEVAM_EDIYOR',
    description: 'Another description',
    link: undefined,
    deadline: '2024-02-01',
    ownerName: 'testuser',
    taskLists: [],
    labels: [],
  },
]

export const mockPaginatedBoards = {
  content: mockBoards,
  page: 0,
  size: 10,
  totalElements: 2,
  totalPages: 1,
  first: true,
  last: true,
}
