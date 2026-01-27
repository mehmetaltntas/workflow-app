/**
 * Application Constants
 *
 * Bu dosya design token sistemini kullanarak sabit degerleri tanimlar.
 */

import { colors } from './styles/tokens';

// Status colors - design token sisteminden
export const STATUS_COLORS: Record<string, string> = {
  PLANLANDI: colors.status.planned,
  DEVAM_EDIYOR: colors.status.inProgress,
  TAMAMLANDI: colors.status.completed,
  DURDURULDU: colors.status.paused,
  BIRAKILDI: colors.status.abandoned,
};

export const STATUS_LABELS: Record<string, string> = {
  PLANLANDI: 'Planlandı',
  DEVAM_EDIYOR: 'Devam Ediyor',
  TAMAMLANDI: 'Tamamlandı',
  DURDURULDU: 'Beklemede',
  BIRAKILDI: 'İptal Edildi',
};

// Priority colors - design token sisteminden
export const PRIORITY_COLORS: Record<string, { text: string; bg: string }> = {
  HIGH: { text: colors.priority.high, bg: colors.priority.highBg },
  MEDIUM: { text: colors.priority.medium, bg: colors.priority.mediumBg },
  LOW: { text: colors.priority.low, bg: colors.priority.lowBg },
};

export const PRIORITY_LABELS: Record<string, string> = {
  HIGH: 'Yüksek',
  MEDIUM: 'Orta',
  LOW: 'Düşük',
};

// Category labels
export const CATEGORY_LABELS: Record<string, string> = {
  YAZILIM_GELISTIRME: 'Yazılım Geliştirme',
  PAZARLAMA: 'Pazarlama',
  TASARIM_KREATIF: 'Tasarım / Kreatif',
  URUN_YONETIMI: 'Ürün Yönetimi',
  SATIS_CRM: 'Satış / CRM',
  INSAN_KAYNAKLARI: 'İnsan Kaynakları',
  EGITIM_AKADEMIK: 'Eğitim / Akademik',
  OPERASYON: 'Operasyon',
  FINANS_MUHASEBE: 'Finans / Muhasebe',
  MUSTERI_DESTEK: 'Müşteri Destek',
  ICERIK_URETIMI: 'İçerik Üretimi',
  UI_UX_TASARIMI: 'UI/UX Tasarımı',
  ARGE_ARASTIRMA: 'Ar-Ge / Araştırma',
  ETKINLIK_YONETIMI: 'Etkinlik Yönetimi',
  HUKUK_YASAL: 'Hukuk / Yasal',
  INSAAT_MIMARI: 'İnşaat / Mimari',
  E_TICARET: 'E-Ticaret',
  SAGLIK_YASAM: 'Sağlık / Yaşam',
  KISISEL: 'Kişisel',
  DIGER: 'Diğer',
};

// Status slug mappings for URL routing
export const STATUS_SLUGS: Record<string, string> = {
  PLANLANDI: 'planlandi',
  DEVAM_EDIYOR: 'devam-ediyor',
  TAMAMLANDI: 'tamamlandi',
  DURDURULDU: 'durduruldu',
  BIRAKILDI: 'birakildi',
};

// Reverse mapping: slug -> status key
export const SLUG_TO_STATUS: Record<string, string> = Object.fromEntries(
  Object.entries(STATUS_SLUGS).map(([key, slug]) => [slug, key])
);

// Re-export colors for convenience
export { colors };
