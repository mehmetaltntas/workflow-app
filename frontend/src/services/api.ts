import axios from "axios";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";

// 1. Temel Ayarlar
const apiClient = axios.create({
  baseURL: "http://localhost:8080", // Backend adresi
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
};

// 4. Board (Pano) İşlemleri
export const boardService = {
  getUserBoards: (userId: number) => {
    return apiClient.get(`/boards/user/${userId}`);
  },
  createBoard: (data: { name: string; userId: number; status?: string; link?: string; description?: string; deadline?: string }) => {
    return apiClient.post("/boards", data);
  },
  getBoardDetails: (slug: string) => {
    return apiClient.get(`/boards/${slug}/details`);
  },
  deleteBoard: (boardId: number) => apiClient.delete(`/boards/${boardId}`),
  updateBoard: (boardId: number, data: { name?: string; status?: string; link?: string; description?: string; deadline?: string }) =>
    apiClient.put(`/boards/${boardId}`, data),
  updateBoardStatus: (boardId: number, status: string) =>
    apiClient.put(`/boards/${boardId}/status`, status, {
      headers: { "Content-Type": "text/plain" },
    }),
};

// 5. Görev ve Liste İşlemleri
export const taskService = {
  createTaskList: (data: { name: string; boardId: number; link?: string }) => {
    return apiClient.post("/lists", data);
  },
  createTask: (data: {
    title: string;
    description: string;
    taskListId: number;
    link?: string;
    dueDate?: string;
    priority?: string;
  }) => {
    return apiClient.post("/tasks", data);
  },

  deleteTaskList: (listId: number) => apiClient.delete(`/lists/${listId}`),
  updateTaskList: (listId: number, data: { name?: string; link?: string; isCompleted?: boolean }) =>
    apiClient.put(`/lists/${listId}`, data),
  deleteTask: (taskId: number) => apiClient.delete(`/tasks/${taskId}`),
  updateTask: (taskId: number, data: { title?: string; description?: string; link?: string; isCompleted?: boolean; dueDate?: string | null; priority?: string; labelIds?: number[]; }) =>
    apiClient.put(`/tasks/${taskId}`, data),

  // Drag & Drop İşlemleri
  reorderTask: (taskId: number, data: { targetListId: number; newPosition: number }) =>
    apiClient.put(`/tasks/${taskId}/reorder`, data),

  batchReorder: (data: { listId: number; taskPositions: Array<{ taskId: number; position: number }> }) =>
    apiClient.put("/tasks/batch-reorder", data),
};

// 6. Alt Görev İşlemleri
export const subtaskService = {
  // Alt görev oluştur
  createSubtask: (data: { title: string; taskId: number }) =>
    apiClient.post("/subtasks", data),

  // Alt görevi güncelle
  updateSubtask: (subtaskId: number, data: { title?: string; isCompleted?: boolean }) =>
    apiClient.put(`/subtasks/${subtaskId}`, data),

  // Alt görevi sil
  deleteSubtask: (subtaskId: number) =>
    apiClient.delete(`/subtasks/${subtaskId}`),

  // Tamamlanma durumunu değiştir
  toggleSubtask: (subtaskId: number) =>
    apiClient.patch(`/subtasks/${subtaskId}/toggle`),

  // Görevin alt görevlerini getir
  getSubtasksByTask: (taskId: number) =>
    apiClient.get(`/subtasks/task/${taskId}`),
};

// 7. Etiket İşlemleri
export const labelService = {
  // Panoya ait etiketleri getir
  getLabelsByBoard: (boardId: number) => apiClient.get(`/labels/board/${boardId}`),

  // Yeni etiket oluştur
  createLabel: (data: { name: string; color: string; boardId: number }) =>
    apiClient.post("/labels", data),

  // Etiket güncelle
  updateLabel: (labelId: number, data: { name?: string; color?: string }) =>
    apiClient.put(`/labels/${labelId}`, data),

  // Etiket sil
  deleteLabel: (labelId: number) => apiClient.delete(`/labels/${labelId}`),
};

// 7. Kullanıcı Profil İşlemleri
export const userService = {
  getUser: (userId: number) => {
    return apiClient.get(`/users/${userId}`);
  },
  updateProfile: (userId: number, data: { username?: string; profilePicture?: string }) => {
    return apiClient.put(`/users/${userId}/profile`, data);
  },
  updatePassword: (userId: number, data: { currentPassword: string; newPassword: string }) => {
    return apiClient.put(`/users/${userId}/password`, data);
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
