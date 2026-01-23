import axios from "axios";
import type { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from "axios";
import type { PagedResponse, Board, Task, TaskList, Label, Subtask, User, PageMetadata } from "../types";

// 1. Temel Ayarlar
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

// HATEOAS yanıt işleme yardımcı fonksiyonları
export interface ExtractedPagedData<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

// PagedModel yanıtından veri çıkart
export function extractPagedData<T>(response: AxiosResponse<PagedResponse<T>>): ExtractedPagedData<T> {
  const data = response.data;

  // _embedded içinden veriyi al (boards, tasks, labels vs.)
  let content: T[] = [];
  if (data._embedded) {
    // İlk bulunan array'i al
    const embeddedKeys = Object.keys(data._embedded);
    if (embeddedKeys.length > 0) {
      content = data._embedded[embeddedKeys[0]] || [];
    }
  }

  const pageInfo: PageMetadata = data.page || {
    size: content.length,
    number: 0,
    totalElements: content.length,
    totalPages: 1
  };

  return {
    content,
    page: pageInfo.number,
    size: pageInfo.size,
    totalElements: pageInfo.totalElements,
    totalPages: pageInfo.totalPages,
    first: pageInfo.number === 0,
    last: pageInfo.number >= pageInfo.totalPages - 1
  };
}

// Tek entity yanıtından veri çıkart (_links'i kaldır)
export function extractEntity<T>(response: AxiosResponse<T>): T {
  return response.data;
}

// CollectionModel yanıtından veri çıkart
export function extractCollection<T>(response: AxiosResponse<PagedResponse<T>>): T[] {
  const data = response.data;
  if (data._embedded) {
    const embeddedKeys = Object.keys(data._embedded);
    if (embeddedKeys.length > 0) {
      return data._embedded[embeddedKeys[0]] || [];
    }
  }
  // Eğer _embedded yoksa, direkt array olarak dönebilir
  if (Array.isArray(data)) {
    return data as unknown as T[];
  }
  return [];
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  // Cookie taşıyabilmesi için (İleride HttpOnly cookie'ye geçersek lazım olur)
  withCredentials: true,
});

// Token yenileme durumu için flag
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
  config: InternalAxiosRequestConfig;
}> = [];

// Bekleyen istekleri işle
const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.config.headers.Authorization = `Bearer ${token}`;
      prom.resolve(apiClient(prom.config));
    }
  });
  failedQueue = [];
};

// 2. TOKEN INTERCEPTOR (ÖNEMLİ KISIM)
// Her istekten önce çalışır ve token'ı ekler
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// 3. Auth (Kimlik) İşlemleri
export const authService = {
  login: (data: { username: string; password: string }) => {
    return apiClient.post("/auth/login", data);
  },
  register: (data: { username: string; email: string; password: string }) => {
    return apiClient.post("/auth/register", data);
  },
  // Refresh token ile yeni access token al
  refreshToken: (refreshToken: string) => {
    return apiClient.post("/auth/refresh", { refreshToken });
  },
  // Logout - refresh token'ı sil
  logout: () => {
    return apiClient.post("/auth/logout");
  },
  // Sifremi Unuttum - Email'e kod gonder
  forgotPassword: (email: string) => {
    return apiClient.post("/auth/forgot-password", { email });
  },
  // Dogrulama kodunu kontrol et
  verifyCode: (email: string, code: string) => {
    return apiClient.post("/auth/verify-code", { email, code });
  },
  // Yeni sifre belirle
  resetPassword: (email: string, code: string, newPassword: string) => {
    return apiClient.post("/auth/reset-password", { email, code, newPassword });
  },
  // Google ile giris/kayit
  googleAuth: (idToken: string) => {
    return apiClient.post("/auth/google", { idToken });
  },
};

// 4. Board (Pano) İşlemleri
export const boardService = {
  getUserBoards: async (userId: number): Promise<ExtractedPagedData<Board>> => {
    const response = await apiClient.get<PagedResponse<Board>>(`/boards/user/${userId}`);
    return extractPagedData<Board>(response);
  },
  createBoard: async (data: { name: string; userId: number; status?: string; link?: string; description?: string; deadline?: string }): Promise<Board> => {
    const response = await apiClient.post<Board>("/boards", data);
    return extractEntity<Board>(response);
  },
  getBoardDetails: async (slug: string): Promise<Board> => {
    const response = await apiClient.get<Board>(`/boards/${slug}/details`);
    return extractEntity<Board>(response);
  },
  deleteBoard: (boardId: number) => apiClient.delete(`/boards/${boardId}`),
  updateBoard: async (boardId: number, data: { name?: string; status?: string; link?: string; description?: string; deadline?: string }): Promise<Board> => {
    const response = await apiClient.put<Board>(`/boards/${boardId}`, data);
    return extractEntity<Board>(response);
  },
  updateBoardStatus: async (boardId: number, status: string): Promise<Board> => {
    const response = await apiClient.put<Board>(`/boards/${boardId}/status`, status, {
      headers: { "Content-Type": "text/plain" },
    });
    return extractEntity<Board>(response);
  },
};

// 5. Görev ve Liste İşlemleri
export const taskService = {
  createTaskList: async (data: {
    name: string;
    boardId: number;
    description?: string;
    link?: string;
    dueDate?: string;
    priority?: string;
    labelIds?: number[];
  }): Promise<TaskList> => {
    const response = await apiClient.post<TaskList>("/lists", data);
    return extractEntity<TaskList>(response);
  },
  createTask: async (data: {
    title: string;
    description: string;
    taskListId: number;
    link?: string;
    dueDate?: string;
    priority?: string;
  }): Promise<Task> => {
    const response = await apiClient.post<Task>("/tasks", data);
    return extractEntity<Task>(response);
  },

  deleteTaskList: (listId: number) => apiClient.delete(`/lists/${listId}`),
  updateTaskList: async (listId: number, data: {
    name?: string;
    description?: string;
    link?: string;
    isCompleted?: boolean;
    dueDate?: string | null;
    priority?: string;
    labelIds?: number[];
  }): Promise<TaskList> => {
    const response = await apiClient.put<TaskList>(`/lists/${listId}`, data);
    return extractEntity<TaskList>(response);
  },
  deleteTask: (taskId: number) => apiClient.delete(`/tasks/${taskId}`),
  updateTask: async (taskId: number, data: { title?: string; description?: string; link?: string; isCompleted?: boolean; dueDate?: string | null; priority?: string; labelIds?: number[]; }): Promise<Task> => {
    const response = await apiClient.put<Task>(`/tasks/${taskId}`, data);
    return extractEntity<Task>(response);
  },

  // Drag & Drop İşlemleri
  reorderTask: async (taskId: number, data: { targetListId: number; newPosition: number }): Promise<Task> => {
    const response = await apiClient.put<Task>(`/tasks/${taskId}/reorder`, data);
    return extractEntity<Task>(response);
  },

  batchReorder: async (data: { listId: number; taskPositions: Array<{ taskId: number; position: number }> }): Promise<Task[]> => {
    const response = await apiClient.put<PagedResponse<Task>>("/tasks/batch-reorder", data);
    return extractCollection<Task>(response);
  },
};

// 6. Alt Görev İşlemleri
export const subtaskService = {
  // Alt görev oluştur
  createSubtask: async (data: {
    title: string;
    taskId: number;
    description?: string;
    link?: string;
    dueDate?: string;
    priority?: string;
    labelIds?: number[];
  }): Promise<Subtask> => {
    const response = await apiClient.post<Subtask>("/subtasks", data);
    return extractEntity<Subtask>(response);
  },

  // Alt görevi güncelle
  updateSubtask: async (subtaskId: number, data: {
    title?: string;
    description?: string;
    link?: string;
    isCompleted?: boolean;
    dueDate?: string | null;
    priority?: string;
    labelIds?: number[];
  }): Promise<Subtask> => {
    const response = await apiClient.put<Subtask>(`/subtasks/${subtaskId}`, data);
    return extractEntity<Subtask>(response);
  },

  // Alt görevi sil
  deleteSubtask: (subtaskId: number) =>
    apiClient.delete(`/subtasks/${subtaskId}`),

  // Tamamlanma durumunu değiştir
  toggleSubtask: async (subtaskId: number): Promise<Subtask> => {
    const response = await apiClient.patch<Subtask>(`/subtasks/${subtaskId}/toggle`);
    return extractEntity<Subtask>(response);
  },

  // Görevin alt görevlerini getir
  getSubtasksByTask: async (taskId: number): Promise<Subtask[]> => {
    const response = await apiClient.get<PagedResponse<Subtask>>(`/subtasks/task/${taskId}`);
    return extractCollection<Subtask>(response);
  },
};

// 7. Etiket İşlemleri
export const labelService = {
  // Panoya ait etiketleri getir
  getLabelsByBoard: async (boardId: number): Promise<Label[]> => {
    const response = await apiClient.get<PagedResponse<Label>>(`/labels/board/${boardId}`);
    return extractCollection<Label>(response);
  },

  // Yeni etiket oluştur
  createLabel: async (data: { name: string; color: string; boardId: number }): Promise<Label> => {
    const response = await apiClient.post<Label>("/labels", data);
    return extractEntity<Label>(response);
  },

  // Etiket güncelle
  updateLabel: async (labelId: number, data: { name?: string; color?: string }): Promise<Label> => {
    const response = await apiClient.put<Label>(`/labels/${labelId}`, data);
    return extractEntity<Label>(response);
  },

  // Etiket sil
  deleteLabel: (labelId: number) => apiClient.delete(`/labels/${labelId}`),
};

// 8. Kullanıcı Profil İşlemleri
export const userService = {
  getUser: async (userId: number): Promise<User> => {
    const response = await apiClient.get<User>(`/users/${userId}`);
    return extractEntity<User>(response);
  },
  updateProfile: async (userId: number, data: { username?: string; profilePicture?: string }): Promise<User> => {
    const response = await apiClient.put<User>(`/users/${userId}/profile`, data);
    return extractEntity<User>(response);
  },
  updatePassword: async (userId: number, data: { currentPassword: string; newPassword: string }): Promise<void> => {
    await apiClient.put(`/users/${userId}/password`, data);
  },
};

// RESPONSE INTERCEPTOR (Cevap Kontrolü + Token Yenileme)
apiClient.interceptors.response.use(
  (response) => {
    // Her şey yolundaysa cevabı olduğu gibi dön
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // 401 hatası ve henüz retry yapılmamışsa
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Login veya refresh endpoint'iyse direkt hata dön
      if (
        originalRequest.url?.includes("/auth/login") ||
        originalRequest.url?.includes("/auth/refresh") ||
        originalRequest.url?.includes("/auth/register")
      ) {
        return Promise.reject(error);
      }

      // Refresh işlemi zaten devam ediyorsa, kuyruğa ekle
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject, config: originalRequest });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem("refreshToken");

      // Refresh token yoksa logout yap
      if (!refreshToken) {
        isRefreshing = false;
        console.warn("Refresh token bulunamadı, çıkış yapılıyor...");
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        // Yeni access token al
        const response = await apiClient.post("/auth/refresh", { refreshToken });
        const { accessToken } = response.data;

        // Yeni token'ı kaydet
        localStorage.setItem("token", accessToken);

        // Bekleyen istekleri işle
        processQueue(null, accessToken);

        // Orijinal isteği yeni token ile tekrarla
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh başarısız - logout yap
        processQueue(refreshError as AxiosError, null);
        console.warn("Token yenileme başarısız, çıkış yapılıyor...");
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // 403 hatası - yetkisiz erişim
    if (error.response?.status === 403) {
      console.error("Yetkisiz erişim (403):", error.response.data);
      if (!window.location.pathname.startsWith("/login")) {
        localStorage.clear();
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
