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
  DURDURULDU: 'Durduruldu',
  BIRAKILDI: 'Bırakıldı',
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

// Re-export colors for convenience
export { colors };
