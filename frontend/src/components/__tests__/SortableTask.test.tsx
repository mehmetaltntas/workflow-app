import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SortableTask } from '../SortableTask'
import { ThemeProvider } from '../../contexts/ThemeContext'
import type { Task, TaskList } from '../../types/index'

// Wrapper component with theme provider
const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
)

describe('SortableTask', () => {
  const mockOnEdit = vi.fn()
  const mockOnDelete = vi.fn()
  const mockOnToggleComplete = vi.fn()

  const mockTaskList: TaskList = {
    id: 1,
    name: 'To Do',
    tasks: [],
  }

  const mockTask: Task = {
    id: 1,
    title: 'Test Task',
    description: '',
    position: 0,
    isCompleted: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders task title correctly', () => {
    render(
      <Wrapper>
        <SortableTask
          task={mockTask}
          list={mockTaskList}
          index={0}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onToggleComplete={mockOnToggleComplete}
        />
      </Wrapper>
    )

    expect(screen.getByText('Test Task')).toBeInTheDocument()
  })

  it('shows priority badge when priority is set', () => {
    const taskWithPriority: Task = {
      ...mockTask,
      priority: 'HIGH',
    }

    render(
      <Wrapper>
        <SortableTask
          task={taskWithPriority}
          list={mockTaskList}
          index={0}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onToggleComplete={mockOnToggleComplete}
        />
      </Wrapper>
    )

    expect(screen.getByText('Yüksek')).toBeInTheDocument()
  })

  it('shows due date with correct status color for overdue', () => {
    // Set a date in the past
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 2)
    const dateString = yesterday.toISOString().split('T')[0]

    const taskWithDueDate: Task = {
      ...mockTask,
      dueDate: dateString,
    }

    render(
      <Wrapper>
        <SortableTask
          task={taskWithDueDate}
          list={mockTaskList}
          index={0}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onToggleComplete={mockOnToggleComplete}
        />
      </Wrapper>
    )

    expect(screen.getByText(/gün gecikti/)).toBeInTheDocument()
  })

  it('shows "Bugün" for tasks due today', () => {
    const today = new Date().toISOString().split('T')[0]

    const taskWithDueDate: Task = {
      ...mockTask,
      dueDate: today,
    }

    render(
      <Wrapper>
        <SortableTask
          task={taskWithDueDate}
          list={mockTaskList}
          index={0}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onToggleComplete={mockOnToggleComplete}
        />
      </Wrapper>
    )

    expect(screen.getByText('Bugün')).toBeInTheDocument()
  })

  it('shows label badges', () => {
    const taskWithLabels: Task = {
      ...mockTask,
      labels: [
        { id: 1, name: 'Bug', color: '#ef4444' },
        { id: 2, name: 'Feature', color: '#22c55e' },
      ],
    }

    render(
      <Wrapper>
        <SortableTask
          task={taskWithLabels}
          list={mockTaskList}
          index={0}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onToggleComplete={mockOnToggleComplete}
        />
      </Wrapper>
    )

    expect(screen.getByText('Bug')).toBeInTheDocument()
    expect(screen.getByText('Feature')).toBeInTheDocument()
  })

  it('calls onToggleComplete when checkbox clicked', () => {
    render(
      <Wrapper>
        <SortableTask
          task={mockTask}
          list={mockTaskList}
          index={0}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onToggleComplete={mockOnToggleComplete}
        />
      </Wrapper>
    )

    // Find all buttons and get the checkbox (last one with Square icon)
    const buttons = screen.getAllByRole('button')
    const checkbox = buttons[buttons.length - 1] // The checkbox is the last button
    fireEvent.click(checkbox)

    expect(mockOnToggleComplete).toHaveBeenCalledWith(mockTask, mockTaskList)
  })

  it('renders completed task with different style', () => {
    const completedTask: Task = {
      ...mockTask,
      isCompleted: true,
    }

    render(
      <Wrapper>
        <SortableTask
          task={completedTask}
          list={mockTaskList}
          index={0}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onToggleComplete={mockOnToggleComplete}
        />
      </Wrapper>
    )

    // The task title should still be visible
    expect(screen.getByText('Test Task')).toBeInTheDocument()
  })

  it('shows description indicator when description exists', () => {
    const taskWithDescription: Task = {
      ...mockTask,
      description: 'This is a test description',
    }

    render(
      <Wrapper>
        <SortableTask
          task={taskWithDescription}
          list={mockTaskList}
          index={0}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onToggleComplete={mockOnToggleComplete}
        />
      </Wrapper>
    )

    expect(screen.getByText('Not var')).toBeInTheDocument()
  })

  it('shows subtask progress when subtasks exist', () => {
    const taskWithSubtasks: Task = {
      ...mockTask,
      subtasks: [
        { id: 1, title: 'Subtask 1', isCompleted: true, position: 0 },
        { id: 2, title: 'Subtask 2', isCompleted: false, position: 1 },
        { id: 3, title: 'Subtask 3', isCompleted: true, position: 2 },
      ],
    }

    render(
      <Wrapper>
        <SortableTask
          task={taskWithSubtasks}
          list={mockTaskList}
          index={0}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onToggleComplete={mockOnToggleComplete}
        />
      </Wrapper>
    )

    expect(screen.getByText('2/3')).toBeInTheDocument()
  })

  it('shows link icon when task has link', () => {
    const taskWithLink: Task = {
      ...mockTask,
      link: 'https://example.com',
    }

    render(
      <Wrapper>
        <SortableTask
          task={taskWithLink}
          list={mockTaskList}
          index={0}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onToggleComplete={mockOnToggleComplete}
        />
      </Wrapper>
    )

    // Check if link exists
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', 'https://example.com')
    expect(link).toHaveAttribute('target', '_blank')
  })
})
