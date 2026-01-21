import axios from "axios";

// 1. Temel Ayarlar
const apiClient = axios.create({
  baseURL: "http://localhost:8080", // Backend adresi
  headers: {
    "Content-Type": "application/json",
  },
  // Cookie taşıyabilmesi için (İleride HttpOnly cookie'ye geçersek lazım olur)
  withCredentials: true,
});

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
  }) => {
    return apiClient.post("/tasks", data);
  },

  deleteTaskList: (listId: number) => apiClient.delete(`/lists/${listId}`),
  updateTaskList: (listId: number, data: { name?: string; link?: string; isCompleted?: boolean }) =>
    apiClient.put(`/lists/${listId}`, data),
  // ... taskService içine ...
  deleteTask: (taskId: number) => apiClient.delete(`/tasks/${taskId}`),
  updateTask: (taskId: number, data: { title?: string; description?: string; link?: string; isCompleted?: boolean; }) => 
    apiClient.put(`/tasks/${taskId}`, data),
};

// 6. Kullanıcı Profil İşlemleri
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

// ... Request Interceptor'ın altına ...

// RESPONSE INTERCEPTOR (Cevap Kontrolü)
apiClient.interceptors.response.use(
  (response) => {
    // Her şey yolundaysa cevabı olduğu gibi dön
    return response;
  },
  (error) => {
    // 401 (Yetkisiz) veya 403 (Yasak/Süre Doldu) hatalarını yakala
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.error(`Yetkilendirme hatası (${error.response.status}):`, error.response.data);
      
      // Eğer kullanıcı zaten login'de değilse yönlendir
      if (!window.location.pathname.startsWith("/login")) {
        console.warn("Oturum süresi doldu veya yetkisiz erişim! Çıkış yapılıyor...");
        localStorage.clear();
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

// ... export default apiClient ...

export default apiClient;
