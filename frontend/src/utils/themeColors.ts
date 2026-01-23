/**
 * Theme-aware color utilities
 *
 * Returns appropriate colors based on theme (light/dark).
 * This utility bridges the design tokens with component usage.
 */

import { colors, cssVars } from '../styles/tokens';

export type ThemeMode = 'light' | 'dark';

export const getThemeColors = (theme: ThemeMode) => {
  const isDark = theme === 'dark';
  const palette = isDark ? colors.dark : colors.light;

  return {
    // Text colors
    textPrimary: palette.text.primary,
    textSecondary: palette.text.secondary,
    textTertiary: palette.text.tertiary,
    textMuted: palette.text.muted,
    textSubtle: palette.text.subtle,
    textFaint: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
    textDisabled: palette.text.disabled,

    // Background colors
    bgPrimary: isDark ? 'rgba(20, 21, 24, 0.6)' : '#ffffff',
    bgSecondary: palette.bg.hover,
    bgTertiary: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
    bgElevated: palette.bg.elevated,
    bgHover: palette.bg.hover,
    bgActive: palette.bg.active,
    bgHeader: isDark ? 'rgba(13, 14, 16, 0.8)' : 'rgba(255, 255, 255, 0.95)',
    bgCard: palette.bg.card,
    bgInput: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
    bgListHeader: isDark ? 'rgba(0, 0, 0, 0.25)' : 'rgba(0,0,0,0.03)',

    // Border colors
    borderDefault: palette.border.default,
    borderSubtle: palette.border.subtle,
    borderStrong: palette.border.strong,
    borderDashed: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.15)',

    // Divider
    divider: palette.border.default,

    // Task states
    taskBg: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0,0,0,0.02)',
    taskBorder: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0,0,0,0.06)',
    taskCompletedBg: isDark ? 'rgba(81, 207, 102, 0.03)' : 'rgba(64, 192, 87, 0.06)',
    taskCompletedBorder: isDark ? 'rgba(81, 207, 102, 0.08)' : 'rgba(64, 192, 87, 0.12)',

    // List states
    listBg: isDark ? 'rgba(20, 21, 24, 0.6)' : 'rgba(255, 255, 255, 0.9)',
    listBorder: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0,0,0,0.08)',
    listCompletedBg: isDark ? 'rgba(81, 207, 102, 0.03)' : 'rgba(64, 192, 87, 0.05)',
    listCompletedBorder: isDark ? 'rgba(81, 207, 102, 0.1)' : 'rgba(64, 192, 87, 0.1)',

    // Scroll indicator gradient
    scrollGradient: isDark
      ? 'linear-gradient(transparent, rgba(20, 21, 24, 0.98))'
      : 'linear-gradient(transparent, rgba(248, 249, 250, 0.98))',

    // Brand colors (theme-aware)
    primary: isDark ? colors.brand.primary : colors.brand.primaryDark,
    primaryHover: isDark ? colors.brand.primaryHover : '#1c7ed6',
    primaryLight: colors.brand.primaryLight,

    // Semantic colors
    success: isDark ? colors.semantic.success : colors.semantic.successDark,
    danger: isDark ? colors.semantic.danger : colors.semantic.dangerDark,
    warning: isDark ? colors.semantic.warning : colors.semantic.warningDark,

    // Status colors
    statusPlanned: colors.status.planned,
    statusInProgress: colors.status.inProgress,
    statusCompleted: colors.status.completed,
    statusPaused: colors.status.paused,
    statusAbandoned: colors.status.abandoned,

    // Priority colors
    priorityHigh: colors.priority.high,
    priorityHighBg: colors.priority.highBg,
    priorityMedium: colors.priority.medium,
    priorityMediumBg: colors.priority.mediumBg,
    priorityLow: colors.priority.low,
    priorityLowBg: colors.priority.lowBg,
  };
};

export type ThemeColors = ReturnType<typeof getThemeColors>;

// CSS variable helpers for inline styles
export { cssVars };

// Export colors for direct access
export { colors };
