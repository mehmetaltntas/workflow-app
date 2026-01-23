/**
 * Email validasyon fonksiyonu
 */
export const isValidEmail = (email: string): boolean => {
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(email);
};

/**
 * Sifre guc kontrol fonksiyonu
 * En az 8 karakter, 1 buyuk harf, 1 kucuk harf, 1 rakam
 */
export const getPasswordStrength = (password: string): {
  score: number;
  label: string;
  color: string;
} => {
  let score = 0;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 2) return { score, label: 'Zayif', color: '#ef4444' };
  if (score <= 4) return { score, label: 'Orta', color: '#f59e0b' };
  return { score, label: 'Guclu', color: '#22c55e' };
};

/**
 * Kullanici adi validasyonu
 * En az 3 karakter, sadece harf, rakam ve alt cizgi
 */
export const isValidUsername = (username: string): boolean => {
  const regex = /^[a-zA-Z0-9_]{3,50}$/;
  return regex.test(username);
};
