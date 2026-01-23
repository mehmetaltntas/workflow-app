// Theme-aware color utilities
// Returns appropriate colors based on theme (light/dark)

export const getThemeColors = (theme: 'light' | 'dark') => {
  const isLight = theme === 'light';

  return {
    // Text colors
    textPrimary: isLight ? '#1a1b1e' : 'rgba(255,255,255,0.9)',
    textSecondary: isLight ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)',
    textTertiary: isLight ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)',
    textMuted: isLight ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)',
    textSubtle: isLight ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.35)',
    textFaint: isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)',
    textDisabled: isLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)',

    // Background colors
    bgPrimary: isLight ? '#ffffff' : 'rgba(20, 21, 24, 0.6)',
    bgSecondary: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.04)',
    bgTertiary: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)',
    bgElevated: isLight ? 'rgba(255,255,255,0.95)' : 'rgba(0, 0, 0, 0.4)',
    bgHover: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)',
    bgActive: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)',
    bgHeader: isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(13, 14, 16, 0.8)',
    bgCard: isLight ? 'rgba(255, 255, 255, 0.9)' : 'rgba(20, 21, 24, 0.6)',
    bgInput: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)',
    bgListHeader: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(0, 0, 0, 0.25)',

    // Border colors
    borderDefault: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)',
    borderSubtle: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.03)',
    borderStrong: isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.08)',
    borderDashed: isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.1)',

    // Divider
    divider: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)',

    // Task states
    taskBg: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255, 255, 255, 0.04)',
    taskBorder: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255, 255, 255, 0.06)',
    taskCompletedBg: isLight ? 'rgba(64, 192, 87, 0.06)' : 'rgba(81, 207, 102, 0.03)',
    taskCompletedBorder: isLight ? 'rgba(64, 192, 87, 0.12)' : 'rgba(81, 207, 102, 0.08)',

    // List states
    listBg: isLight ? 'rgba(255, 255, 255, 0.9)' : 'rgba(20, 21, 24, 0.6)',
    listBorder: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255, 255, 255, 0.05)',
    listCompletedBg: isLight ? 'rgba(64, 192, 87, 0.05)' : 'rgba(81, 207, 102, 0.03)',
    listCompletedBorder: isLight ? 'rgba(64, 192, 87, 0.1)' : 'rgba(81, 207, 102, 0.1)',

    // Scroll indicator gradient
    scrollGradient: isLight
      ? 'linear-gradient(transparent, rgba(248, 249, 250, 0.98))'
      : 'linear-gradient(transparent, rgba(20, 21, 24, 0.98))',
  };
};

export type ThemeColors = ReturnType<typeof getThemeColors>;
