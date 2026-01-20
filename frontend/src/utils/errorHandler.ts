import toast from "react-hot-toast";
import { AxiosError } from "axios";

// Backend'den dönecek hata objesinin tipi (tahmini)
interface ApiErrorResponse {
  message?: string;
}

export const handleError = (error: unknown, customMessage?: string) => {
  // 1. Geliştirme ortamında detaylı log
  const isDev = import.meta.env.DEV;

  if (isDev) {
    console.group("❌ HATA DETAYI");
    console.error(error);
    console.groupEnd();
  }

  let message = customMessage || "Beklenmedik bir hata oluştu";

  // 2. Hata Tipini Kontrol Et (Type Narrowing)

  // Durum A: Bu bir Axios (API) Hatası mı?
  if (error instanceof AxiosError) {
    const apiError = error.response?.data as ApiErrorResponse;

    // Backend'den { message: "..." } geldiyse onu göster
    if (apiError && apiError.message) {
      message = apiError.message;
    }
    // Yoksa Axios'un standart mesajını göster (örn: Network Error)
    else if (error.message) {
      message = error.message;
    }
  }
  // Durum B: Bu standart bir JS Hatası mı? (örn: null pointer)
  else if (error instanceof Error) {
    message = error.message;
  }

  // 3. Kullanıcıya Bildir
  toast.error(message);
};
