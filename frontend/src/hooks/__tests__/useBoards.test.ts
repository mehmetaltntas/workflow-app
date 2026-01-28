import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useBoards } from '../useBoards'
import { boardService } from '../../services/api'
import type { ExtractedPagedData } from '../../services/api'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../stores/authStore'
import type { Board } from '../../types'

// Mock the api service
vi.mock('../../services/api', () => ({
  boardService: {
    getUserBoards: vi.fn(),
    createBoard: vi.fn(),
    updateBoard: vi.fn(),
    deleteBoard: vi.fn(),
    updateBoardStatus: vi.fn(),
  },
}))

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock Zustand store
vi.mock('../../stores/authStore', () => ({
  useAuthStore: vi.fn(),
}))

describe('useBoards', () => {
  const mockBoards: Board[] = [
    {
      id: 1,
      name: 'Test Board',
      slug: 'test-board',
      status: 'PLANLANDI',
      ownerName: 'testuser',
      taskLists: [],
    },
    {
      id: 2,
      name: 'Another Board',
      slug: 'another-board',
      status: 'DEVAM_EDIYOR',
      ownerName: 'testuser',
      taskLists: [],
    },
  ]

  const mockPaginatedResponse: ExtractedPagedData<Board> = {
    content: mockBoards,
    page: 0,
    size: 10,
    totalElements: 2,
    totalPages: 1,
    first: true,
    last: true,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Default: user is logged in with userId = 1
    vi.mocked(useAuthStore).mockImplementation((selector) => {
      const state = {
        userId: 1,
        username: 'testuser',
        firstName: null,
        lastName: null,
        deletionScheduledAt: null,
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
        updateUsername: vi.fn(),
        setDeletionScheduledAt: vi.fn(),
      }
      if (typeof selector === 'function') {
        return selector(state)
      }
      return state
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('loadBoards fetches boards from API', async () => {
    vi.mocked(boardService.getUserBoards).mockResolvedValue(mockPaginatedResponse)

    renderHook(() => useBoards())

    // Just verify the API was called with the correct userId
    await waitFor(() => {
      expect(boardService.getUserBoards).toHaveBeenCalledWith(1)
    })
  })

  it('createBoard calls API and shows success toast', async () => {
    const newBoard: Board = {
      id: 3,
      name: 'New Board',
      slug: 'new-board',
      status: 'PLANLANDI',
      ownerName: 'testuser',
      taskLists: [],
    }

    vi.mocked(boardService.getUserBoards).mockResolvedValue(mockPaginatedResponse)
    vi.mocked(boardService.createBoard).mockResolvedValue(newBoard)

    const { result } = renderHook(() => useBoards())

    // Wait for initial load
    await waitFor(() => {
      expect(boardService.getUserBoards).toHaveBeenCalled()
    })

    // Create the board
    await act(async () => {
      await result.current.createBoard('New Board', 'PLANLANDI')
    })

    expect(boardService.createBoard).toHaveBeenCalled()
    expect(toast.success).toHaveBeenCalledWith('Pano oluşturuldu')
  })

  it('deleteBoard removes board from list', async () => {
    vi.mocked(boardService.getUserBoards).mockResolvedValue(mockPaginatedResponse)
    vi.mocked(boardService.deleteBoard).mockResolvedValue({} as never)

    const { result } = renderHook(() => useBoards())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Delete a board
    vi.mocked(boardService.getUserBoards).mockResolvedValue({
      content: mockBoards.filter(b => b.id !== 1),
      page: 0,
      size: 10,
      totalElements: 1,
      totalPages: 1,
      first: true,
      last: true,
    } as ExtractedPagedData<Board>)

    let success: boolean | undefined
    await act(async () => {
      success = await result.current.deleteBoard(1)
    })

    expect(success).toBe(true)
    expect(boardService.deleteBoard).toHaveBeenCalledWith(1)
    expect(toast.success).toHaveBeenCalledWith('Pano silindi')
  })

  it('shows toast on error when loading boards fails', async () => {
    vi.mocked(boardService.getUserBoards).mockRejectedValue(new Error('API Error'))

    renderHook(() => useBoards())

    // Wait for the error toast to be called
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Panolar yüklenirken bir hata oluştu')
    })
  })

  it('updateBoard updates board and refreshes list', async () => {
    vi.mocked(boardService.getUserBoards).mockResolvedValue(mockPaginatedResponse)
    vi.mocked(boardService.updateBoard).mockResolvedValue(mockBoards[0] as Board)

    const { result } = renderHook(() => useBoards())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    let success: boolean | undefined
    await act(async () => {
      success = await result.current.updateBoard(1, { name: 'Updated Name' })
    })

    expect(success).toBe(true)
    expect(boardService.updateBoard).toHaveBeenCalledWith(1, { name: 'Updated Name' })
    expect(toast.success).toHaveBeenCalledWith('Pano güncellendi')
  })

  it('updateBoardStatus updates status and refreshes list', async () => {
    vi.mocked(boardService.getUserBoards).mockResolvedValue(mockPaginatedResponse)
    vi.mocked(boardService.updateBoardStatus).mockResolvedValue(mockBoards[0] as Board)

    const { result } = renderHook(() => useBoards())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    let success: boolean | undefined
    await act(async () => {
      success = await result.current.updateBoardStatus(1, 'TAMAMLANDI')
    })

    expect(success).toBe(true)
    expect(boardService.updateBoardStatus).toHaveBeenCalledWith(1, 'TAMAMLANDI')
    expect(toast.success).toHaveBeenCalledWith('Statü güncellendi')
  })

  it('does not load boards when userId is not set', async () => {
    // Override the mock to return null userId
    vi.mocked(useAuthStore).mockImplementation((selector) => {
      const state = {
        userId: null,
        username: null,
        firstName: null,
        lastName: null,
        deletionScheduledAt: null,
        isAuthenticated: false,
        login: vi.fn(),
        logout: vi.fn(),
        updateUsername: vi.fn(),
        setDeletionScheduledAt: vi.fn(),
      }
      if (typeof selector === 'function') {
        return selector(state)
      }
      return state
    })

    const { result } = renderHook(() => useBoards())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(boardService.getUserBoards).not.toHaveBeenCalled()
    expect(result.current.boards).toEqual([])
  })

  it('createBoard shows error toast on failure', async () => {
    vi.mocked(boardService.getUserBoards).mockResolvedValue(mockPaginatedResponse)
    vi.mocked(boardService.createBoard).mockRejectedValue(new Error('Creation failed'))

    const { result } = renderHook(() => useBoards())

    // Wait for initial load
    await waitFor(() => {
      expect(boardService.getUserBoards).toHaveBeenCalled()
    })

    // Try to create a board - should fail
    await act(async () => {
      await result.current.createBoard('New Board')
    })

    expect(toast.error).toHaveBeenCalledWith('Pano oluşturulamadı')
  })

  it('createBoard returns false for empty name', async () => {
    vi.mocked(boardService.getUserBoards).mockResolvedValue(mockPaginatedResponse)

    const { result } = renderHook(() => useBoards())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    let success: boolean | undefined
    await act(async () => {
      success = await result.current.createBoard('  ')
    })

    expect(success).toBe(false)
    expect(boardService.createBoard).not.toHaveBeenCalled()
  })
})
