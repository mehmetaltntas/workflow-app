import { AxiosError } from 'axios';

/**
 * Type guard: Verilen hata bir AxiosError mi kontrol eder.
 * Kullanım:
 *   if (isAxiosError<{ message?: string }>(error)) {
 *     const status = error.response?.status;
 *   }
 */
export function isAxiosError<T = unknown>(error: unknown): error is AxiosError<T> {
  return error instanceof AxiosError;
}
