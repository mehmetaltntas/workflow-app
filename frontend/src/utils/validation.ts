/**
 * Email validasyon fonksiyonu
 */
export const isValidEmail = (email: string): boolean => {
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(email);
};

/**
 * Şifre güç kontrol fonksiyonu
 * En az 8 karakter, 1 büyük harf, 1 küçük harf, 1 rakam
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

  if (score <= 2) return { score, label: 'Zayıf', color: '#ef4444' };
  if (score <= 4) return { score, label: 'Orta', color: '#f59e0b' };
  return { score, label: 'Güçlü', color: '#22c55e' };
};

/**
 * Kullanıcı adı validasyonu
 * 3-30 karakter, sadece harf (a-z), rakam (0-9), nokta (.) ve alt tire (_)
 * Nokta ile baslayamaz veya bitemez, ardisik nokta kullanilamaz
 */
export const isValidUsername = (username: string): boolean => {
  return getUsernameError(username) === null;
};

/**
 * Kullanıcı adı hata mesajı döner, geçerliyse null döner
 */
export const getUsernameError = (username: string): string | null => {
  if (!username) return null;

  if (username.length < 3) {
    return "Kullanıcı adı en az 3 karakter olmalıdır";
  }

  if (username.length > 30) {
    return "Kullanıcı adı en fazla 30 karakter olabilir";
  }

  if (!/^[a-zA-Z0-9._]+$/.test(username)) {
    return "Sadece harf (a-z), rakam, nokta (.) ve alt tire (_) kullanılabilir";
  }

  if (username.startsWith('.')) {
    return "Kullanıcı adı nokta ile başlayamaz";
  }

  if (username.endsWith('.')) {
    return "Kullanıcı adı nokta ile bitemez";
  }

  if (/\.{2,}/.test(username)) {
    return "Ardışık nokta kullanılamaz";
  }

  return null;
};
