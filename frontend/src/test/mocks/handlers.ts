import { http, HttpResponse } from 'msw'
import { mockUser, mockPaginatedBoards, mockBoard } from './fixtures'

const API_URL = 'http://localhost:8080'

export const handlers = [
  // Auth handlers
  http.post(`${API_URL}/auth/login`, async ({ request }) => {
    const body = await request.json() as { username: string; password: string }

    if (body.username === 'testuser' && body.password === 'password') {
      return HttpResponse.json(mockUser)
    }

    return HttpResponse.json(
      { message: 'Invalid credentials' },
      { status: 401 }
    )
  }),

  http.post(`${API_URL}/auth/register`, async () => {
    return HttpResponse.json(mockUser, { status: 201 })
  }),

  http.post(`${API_URL}/auth/refresh`, async () => {
    return HttpResponse.json({
      accessToken: 'new-access-token',
      refreshToken: 'mock-refresh-token',
    })
  }),

  http.post(`${API_URL}/auth/logout`, async () => {
    return HttpResponse.json({ message: 'Logged out' })
  }),

  // Board handlers
  http.get(`${API_URL}/boards/user/:userId`, async () => {
    return HttpResponse.json(mockPaginatedBoards)
  }),

  http.get(`${API_URL}/boards/:slug/details`, async ({ params }) => {
    const { slug } = params

    if (slug === 'test-board') {
      return HttpResponse.json(mockBoard)
    }

    return HttpResponse.json(
      { message: 'Board not found' },
      { status: 404 }
    )
  }),

  http.post(`${API_URL}/boards`, async ({ request }) => {
    const body = await request.json() as { name: string; status?: string }

    return HttpResponse.json({
      id: 3,
      name: body.name,
      slug: body.name.toLowerCase().replace(/\s+/g, '-'),
      status: body.status || 'PLANLANDI',
      description: null,
      link: null,
      deadline: null,
      ownerName: 'testuser',
      taskLists: [],
      labels: [],
    })
  }),

  http.put(`${API_URL}/boards/:id`, async ({ params, request }) => {
    const body = await request.json() as { name?: string; status?: string }

    return HttpResponse.json({
      ...mockBoard,
      id: Number(params.id),
      ...body,
    })
  }),

  http.delete(`${API_URL}/boards/:id`, async () => {
    return new HttpResponse(null, { status: 204 })
  }),

  // Task handlers
  http.post(`${API_URL}/tasks`, async ({ request }) => {
    const body = await request.json() as { title: string; description?: string }

    return HttpResponse.json({
      id: 100,
      title: body.title,
      description: body.description || null,
      position: 0,
      isCompleted: false,
      createdAt: new Date().toISOString(),
      dueDate: null,
      priority: null,
      labels: [],
      subtasks: [],
      link: null,
    })
  }),

  http.put(`${API_URL}/tasks/:id`, async ({ params, request }) => {
    const body = await request.json() as { title?: string; isCompleted?: boolean }

    return HttpResponse.json({
      id: Number(params.id),
      title: body.title || 'Updated Task',
      isCompleted: body.isCompleted ?? false,
      position: 0,
      createdAt: new Date().toISOString(),
    })
  }),

  http.delete(`${API_URL}/tasks/:id`, async () => {
    return new HttpResponse(null, { status: 204 })
  }),

  // TaskList handlers
  http.post(`${API_URL}/lists`, async ({ request }) => {
    const body = await request.json() as { name: string }

    return HttpResponse.json({
      id: 100,
      name: body.name,
      link: null,
      isCompleted: false,
      tasks: [],
    })
  }),

  http.put(`${API_URL}/lists/:id`, async ({ params, request }) => {
    const body = await request.json() as { name?: string; isCompleted?: boolean }

    return HttpResponse.json({
      id: Number(params.id),
      name: body.name || 'Updated List',
      isCompleted: body.isCompleted ?? false,
      tasks: [],
    })
  }),

  http.delete(`${API_URL}/lists/:id`, async () => {
    return new HttpResponse(null, { status: 204 })
  }),

  // Label handlers
  http.get(`${API_URL}/labels/board/:boardId`, async () => {
    return HttpResponse.json(mockBoard.labels)
  }),

  http.post(`${API_URL}/labels`, async ({ request }) => {
    const body = await request.json() as { name: string; color: string }

    return HttpResponse.json({
      id: 100,
      name: body.name,
      color: body.color,
    })
  }),
]
