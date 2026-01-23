import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useBoards } from '../useBoards'
import { boardService } from '../../services/api'
import toast from 'react-hot-toast'

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

describe('useBoards', () => {
  const mockBoards = [
    {
      id: 1,
      name: 'Test Board',
      slug: 'test-board',
      status: 'PLANLANDI',
      ownerName: 'testuser',
    },
    {
      id: 2,
      name: 'Another Board',
      slug: 'another-board',
      status: 'DEVAM_EDIYOR',
      ownerName: 'testuser',
    },
  ]

  const mockPaginatedResponse = {
    data: {
      content: mockBoards,
      page: 0,
      size: 10,
      totalElements: 2,
      totalPages: 1,
      first: true,
      last: true,
    },
  }

  let localStorageMock: Record<string, string>

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset localStorage mock data
    localStorageMock = { userId: '1' }
    // Mock localStorage using Object.defineProperty
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn((key: string) => localStorageMock[key] ?? null),
        setItem: vi.fn((key: string, value: string) => { localStorageMock[key] = value }),
        removeItem: vi.fn((key: string) => { delete localStorageMock[key] }),
        clear: vi.fn(() => { localStorageMock = {} }),
      },
      writable: true,
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
    const newBoard = {
      id: 3,
      name: 'New Board',
      slug: 'new-board',
      status: 'PLANLANDI',
      ownerName: 'testuser',
    }

    vi.mocked(boardService.getUserBoards).mockResolvedValue(mockPaginatedResponse)
    vi.mocked(boardService.createBoard).mockResolvedValue({ data: newBoard })

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
    vi.mocked(boardService.deleteBoard).mockResolvedValue({ data: {} })

    const { result } = renderHook(() => useBoards())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Delete a board
    vi.mocked(boardService.getUserBoards).mockResolvedValue({
      data: { content: mockBoards.filter(b => b.id !== 1) },
    })

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
    vi.mocked(boardService.updateBoard).mockResolvedValue({ data: mockBoards[0] })

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
    vi.mocked(boardService.updateBoardStatus).mockResolvedValue({ data: mockBoards[0] })

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
    // Override localStorage to return null for userId
    localStorageMock = {}

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
