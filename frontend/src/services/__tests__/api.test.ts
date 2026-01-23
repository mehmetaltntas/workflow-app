import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { authService, boardService, taskService, labelService } from '../api'

const API_URL = 'http://localhost:8080'

// Setup MSW server
const server = setupServer()

describe('API Services', () => {
  beforeEach(() => {
    server.listen({ onUnhandledRequest: 'bypass' })
    // Mock localStorage
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
      if (key === 'token') return 'mock-token'
      if (key === 'refreshToken') return 'mock-refresh-token'
      return null
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {})
    vi.spyOn(Storage.prototype, 'clear').mockImplementation(() => {})
  })

  afterEach(() => {
    server.resetHandlers()
    vi.restoreAllMocks()
  })

  afterAll(() => {
    server.close()
  })

  describe('authService', () => {
    it('login returns tokens on success', async () => {
      const mockResponse = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        token: 'access-token',
        refreshToken: 'refresh-token',
      }

      server.use(
        http.post(`${API_URL}/auth/login`, () => {
          return HttpResponse.json(mockResponse)
        })
      )

      const response = await authService.login({
        username: 'testuser',
        password: 'password123',
      })

      expect(response.data).toEqual(mockResponse)
      expect(response.data.token).toBe('access-token')
    })

    it('register creates user and returns tokens', async () => {
      const mockResponse = {
        id: 1,
        username: 'newuser',
        email: 'new@example.com',
        token: 'access-token',
        refreshToken: 'refresh-token',
      }

      server.use(
        http.post(`${API_URL}/auth/register`, () => {
          return HttpResponse.json(mockResponse, { status: 201 })
        })
      )

      const response = await authService.register({
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
      })

      expect(response.data.username).toBe('newuser')
    })

    it('refreshToken returns new access token', async () => {
      const mockResponse = {
        accessToken: 'new-access-token',
        refreshToken: 'mock-refresh-token',
      }

      server.use(
        http.post(`${API_URL}/auth/refresh`, () => {
          return HttpResponse.json(mockResponse)
        })
      )

      const response = await authService.refreshToken('mock-refresh-token')

      expect(response.data.accessToken).toBe('new-access-token')
    })
  })

  describe('boardService', () => {
    it('getUserBoards returns paginated boards', async () => {
      const mockResponse = {
        content: [
          { id: 1, name: 'Board 1', slug: 'board-1' },
          { id: 2, name: 'Board 2', slug: 'board-2' },
        ],
        page: 0,
        size: 10,
        totalElements: 2,
        totalPages: 1,
        first: true,
        last: true,
      }

      server.use(
        http.get(`${API_URL}/boards/user/1`, () => {
          return HttpResponse.json(mockResponse)
        })
      )

      const response = await boardService.getUserBoards(1)

      expect(response.data.content).toHaveLength(2)
      expect(response.data.totalElements).toBe(2)
    })

    it('createBoard returns new board', async () => {
      const mockResponse = {
        id: 3,
        name: 'New Board',
        slug: 'new-board',
        status: 'PLANLANDI',
      }

      server.use(
        http.post(`${API_URL}/boards`, () => {
          return HttpResponse.json(mockResponse)
        })
      )

      const response = await boardService.createBoard({
        name: 'New Board',
        userId: 1,
        status: 'PLANLANDI',
      })

      expect(response.data.name).toBe('New Board')
      expect(response.data.slug).toBe('new-board')
    })

    it('getBoardDetails returns board with details', async () => {
      const mockResponse = {
        id: 1,
        name: 'Test Board',
        slug: 'test-board',
        taskLists: [
          { id: 1, name: 'To Do', tasks: [] },
        ],
        labels: [
          { id: 1, name: 'Bug', color: '#ff0000' },
        ],
      }

      server.use(
        http.get(`${API_URL}/boards/test-board/details`, () => {
          return HttpResponse.json(mockResponse)
        })
      )

      const response = await boardService.getBoardDetails('test-board')

      expect(response.data.name).toBe('Test Board')
      expect(response.data.taskLists).toHaveLength(1)
      expect(response.data.labels).toHaveLength(1)
    })

    it('deleteBoard returns 204', async () => {
      server.use(
        http.delete(`${API_URL}/boards/1`, () => {
          return new HttpResponse(null, { status: 204 })
        })
      )

      const response = await boardService.deleteBoard(1)

      expect(response.status).toBe(204)
    })
  })

  describe('taskService', () => {
    it('createTask returns new task', async () => {
      const mockResponse = {
        id: 1,
        title: 'New Task',
        position: 0,
        isCompleted: false,
      }

      server.use(
        http.post(`${API_URL}/tasks`, () => {
          return HttpResponse.json(mockResponse)
        })
      )

      const response = await taskService.createTask({
        title: 'New Task',
        description: 'Description',
        taskListId: 1,
      })

      expect(response.data.title).toBe('New Task')
      expect(response.data.position).toBe(0)
    })

    it('updateTask returns updated task', async () => {
      const mockResponse = {
        id: 1,
        title: 'Updated Task',
        isCompleted: true,
      }

      server.use(
        http.put(`${API_URL}/tasks/1`, () => {
          return HttpResponse.json(mockResponse)
        })
      )

      const response = await taskService.updateTask(1, {
        title: 'Updated Task',
        isCompleted: true,
      })

      expect(response.data.title).toBe('Updated Task')
      expect(response.data.isCompleted).toBe(true)
    })

    it('deleteTask returns 204', async () => {
      server.use(
        http.delete(`${API_URL}/tasks/1`, () => {
          return new HttpResponse(null, { status: 204 })
        })
      )

      const response = await taskService.deleteTask(1)

      expect(response.status).toBe(204)
    })

    it('batchReorder returns reordered tasks', async () => {
      const mockResponse = [
        { id: 1, title: 'Task 1', position: 0 },
        { id: 2, title: 'Task 2', position: 1 },
      ]

      server.use(
        http.put(`${API_URL}/tasks/batch-reorder`, () => {
          return HttpResponse.json(mockResponse)
        })
      )

      const response = await taskService.batchReorder({
        listId: 1,
        taskPositions: [
          { taskId: 1, position: 0 },
          { taskId: 2, position: 1 },
        ],
      })

      expect(response.data).toHaveLength(2)
      expect(response.data[0].position).toBe(0)
    })
  })

  describe('labelService', () => {
    it('getLabelsByBoard returns labels', async () => {
      const mockResponse = [
        { id: 1, name: 'Bug', color: '#ff0000' },
        { id: 2, name: 'Feature', color: '#00ff00' },
      ]

      server.use(
        http.get(`${API_URL}/labels/board/1`, () => {
          return HttpResponse.json(mockResponse)
        })
      )

      const response = await labelService.getLabelsByBoard(1)

      expect(response.data).toHaveLength(2)
    })

    it('createLabel returns new label', async () => {
      const mockResponse = {
        id: 3,
        name: 'New Label',
        color: '#0000ff',
      }

      server.use(
        http.post(`${API_URL}/labels`, () => {
          return HttpResponse.json(mockResponse)
        })
      )

      const response = await labelService.createLabel({
        name: 'New Label',
        color: '#0000ff',
        boardId: 1,
      })

      expect(response.data.name).toBe('New Label')
    })
  })

  describe('Error Handling', () => {
    it('handles 401 error appropriately', async () => {
      server.use(
        http.get(`${API_URL}/boards/user/1`, () => {
          return HttpResponse.json(
            { message: 'Unauthorized' },
            { status: 401 }
          )
        }),
        http.post(`${API_URL}/auth/refresh`, () => {
          return HttpResponse.json(
            { message: 'Invalid refresh token' },
            { status: 401 }
          )
        })
      )

      // This should trigger the refresh token flow and eventually fail
      try {
        await boardService.getUserBoards(1)
      } catch (error) {
        expect(error).toBeDefined()
      }
    })

    it('handles network errors', async () => {
      server.use(
        http.get(`${API_URL}/boards/user/1`, () => {
          return HttpResponse.error()
        })
      )

      await expect(boardService.getUserBoards(1)).rejects.toThrow()
    })
  })
})
