/**
 * Design Tokens - Workflow App Design System
 *
 * Merkezi token sistemi - tüm renk, tipografi, spacing ve diğer değerler burada tanımlanır.
 * Component'lar doğrudan bu token'ları kullanmalıdır.
 */

// ==================== COLOR TOKENS ====================

export const colors = {
  // Brand Colors
  brand: {
    primary: '#4dabf7',
    primaryHover: '#339af0',
    primaryLight: 'rgba(77, 171, 247, 0.15)',
    primaryDark: '#228be6',
  },

  // Semantic Colors
  semantic: {
    success: '#51cf66',
    successLight: 'rgba(81, 207, 102, 0.15)',
    successDark: '#40c057',

    danger: '#ff6b6b',
    dangerLight: 'rgba(255, 107, 107, 0.15)',
    dangerDark: '#fa5252',

    warning: '#ffd43b',
    warningLight: 'rgba(255, 212, 59, 0.15)',
    warningDark: '#fab005',

    info: '#74c0fc',
    infoLight: 'rgba(116, 192, 252, 0.15)',
  },

  // Status Colors (Task/Board statuses)
  status: {
    planned: '#9ca3af',
    inProgress: '#22c55e',
    completed: '#3b82f6',
    paused: '#f97316',
    abandoned: '#ef4444',
  },

  // Priority Colors
  priority: {
    high: '#ef4444',
    highBg: 'rgba(239, 68, 68, 0.15)',
    medium: '#f59e0b',
    mediumBg: 'rgba(245, 158, 11, 0.15)',
    low: '#22c55e',
    lowBg: 'rgba(34, 197, 94, 0.15)',
  },

  // Neutral Colors (Dark Theme)
  dark: {
    bg: {
      body: '#0d0e10',
      card: 'rgba(25, 27, 31, 0.7)',
      elevated: 'rgba(20, 21, 24, 0.6)',
      input: '#151618',
      secondary: '#1a1b1e',
      hover: 'rgba(255, 255, 255, 0.05)',
      active: 'rgba(255, 255, 255, 0.08)',
      overlay: 'rgba(0, 0, 0, 0.6)',
    },
    text: {
      primary: '#f3f5f7',
      secondary: 'rgba(255, 255, 255, 0.7)',
      tertiary: 'rgba(255, 255, 255, 0.5)',
      muted: '#9ba1a6',
      subtle: 'rgba(255, 255, 255, 0.35)',
      disabled: 'rgba(255, 255, 255, 0.2)',
      inverse: '#1a1b1e',
    },
    border: {
      default: 'rgba(255, 255, 255, 0.08)',
      subtle: 'rgba(255, 255, 255, 0.05)',
      strong: 'rgba(255, 255, 255, 0.15)',
      focus: 'rgba(77, 171, 247, 0.4)',
    },
    glass: {
      bg: 'rgba(255, 255, 255, 0.03)',
      border: 'rgba(255, 255, 255, 0.07)',
    },
  },

  // Neutral Colors (Light Theme)
  light: {
    bg: {
      body: '#f8f9fa',
      card: 'rgba(255, 255, 255, 0.9)',
      elevated: '#ffffff',
      input: '#ffffff',
      secondary: '#e9ecef',
      hover: 'rgba(0, 0, 0, 0.04)',
      active: 'rgba(0, 0, 0, 0.06)',
      overlay: 'rgba(0, 0, 0, 0.4)',
    },
    text: {
      primary: '#1a1b1e',
      secondary: 'rgba(0, 0, 0, 0.7)',
      tertiary: 'rgba(0, 0, 0, 0.5)',
      muted: '#6c757d',
      subtle: 'rgba(0, 0, 0, 0.35)',
      disabled: 'rgba(0, 0, 0, 0.2)',
      inverse: '#f3f5f7',
    },
    border: {
      default: 'rgba(0, 0, 0, 0.08)',
      subtle: 'rgba(0, 0, 0, 0.05)',
      strong: 'rgba(0, 0, 0, 0.15)',
      focus: 'rgba(34, 139, 230, 0.4)',
    },
    glass: {
      bg: 'rgba(255, 255, 255, 0.7)',
      border: 'rgba(0, 0, 0, 0.08)',
    },
  },
} as const;

// ==================== TYPOGRAPHY TOKENS ====================

export const typography = {
  fontFamily: {
    base: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    mono: '"JetBrains Mono", "Fira Code", "SF Mono", Consolas, monospace',
  },

  fontSize: {
    xs: '10px',
    sm: '11px',
    md: '12px',
    base: '13px',
    lg: '14px',
    xl: '15px',
    '2xl': '18px',
    '3xl': '20px',
    '4xl': '24px',
    '5xl': '32px',
  },

  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },

  lineHeight: {
    tight: '1.2',
    normal: '1.5',
    relaxed: '1.6',
  },

  letterSpacing: {
    tighter: '-0.02em',
    tight: '-0.01em',
    normal: '0',
    wide: '0.03em',
    wider: '0.05em',
  },
} as const;

// ==================== SPACING TOKENS ====================

export const spacing = {
  // Base unit: 4px
  0: '0',
  0.5: '2px',
  1: '4px',
  1.5: '6px',
  2: '8px',
  2.5: '10px',
  3: '12px',
  3.5: '14px',
  4: '16px',
  5: '20px',
  6: '24px',
  7: '28px',
  8: '32px',
  9: '36px',
  10: '40px',
  12: '48px',
  14: '56px',
  16: '64px',
  20: '80px',
  24: '96px',
} as const;

// ==================== BORDER RADIUS TOKENS ====================

export const radius = {
  none: '0',
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '20px',
  full: '9999px',
} as const;

// ==================== SHADOW TOKENS ====================

export const shadows = {
  none: 'none',
  sm: '0 2px 4px rgba(0, 0, 0, 0.1)',
  md: '0 4px 12px rgba(0, 0, 0, 0.15)',
  lg: '0 12px 24px rgba(0, 0, 0, 0.2)',
  xl: '0 20px 40px rgba(0, 0, 0, 0.25)',

  // Component specific
  card: '0 4px 20px rgba(0, 0, 0, 0.08)',
  cardHover: '0 8px 32px rgba(0, 0, 0, 0.12)',
  dropdown: '0 12px 40px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.04)',
  modal: '0 24px 48px rgba(0, 0, 0, 0.3)',

  // Focus rings
  focusPrimary: '0 0 0 3px rgba(77, 171, 247, 0.15)',
  focusDanger: '0 0 0 3px rgba(255, 107, 107, 0.15)',
  focusSuccess: '0 0 0 3px rgba(81, 207, 102, 0.15)',
} as const;

// ==================== ANIMATION TOKENS ====================

export const animation = {
  duration: {
    instant: '0ms',
    fast: '100ms',
    normal: '200ms',
    slow: '300ms',
    slower: '400ms',
  },

  easing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
    spring: 'cubic-bezier(0.16, 1, 0.3, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
} as const;

// ==================== Z-INDEX TOKENS ====================

export const zIndex = {
  hide: -1,
  base: 0,
  dropdown: 100,
  sticky: 200,
  overlay: 300,
  modal: 400,
  popover: 500,
  toast: 600,
  tooltip: 700,
} as const;

// ==================== BREAKPOINT TOKENS ====================

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// ==================== COMPONENT SIZE TOKENS ====================

export const sizes = {
  // Input & Button heights
  inputSm: '32px',
  inputMd: '40px',
  inputLg: '48px',

  // Avatar sizes
  avatarSm: '24px',
  avatarMd: '36px',
  avatarLg: '48px',
  avatarXl: '64px',

  // Icon sizes
  iconSm: '14px',
  iconMd: '18px',
  iconLg: '24px',
  iconXl: '32px',

  // Layout
  navbarHeight: '64px',
  sidebarWidth: '280px',
  maxContentWidth: '1400px',
} as const;

// ==================== THEME HELPER ====================

export type ThemeMode = 'light' | 'dark';

export const getThemeTokens = (theme: ThemeMode) => {
  const isDark = theme === 'dark';
  const palette = isDark ? colors.dark : colors.light;

  return {
    // Colors
    ...palette,
    brand: colors.brand,
    semantic: colors.semantic,
    status: colors.status,
    priority: colors.priority,

    // Other tokens
    typography,
    spacing,
    radius,
    shadows: {
      ...shadows,
      // Theme-specific shadows
      dropdown: isDark
        ? '0 12px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.04)'
        : '0 12px 40px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)',
    },
    animation,
    zIndex,
    breakpoints,
    sizes,
  };
};

// ==================== CSS VARIABLE HELPERS ====================

export const cssVar = (name: string) => `var(--${name})`;

export const cssVars = {
  // Colors
  bgBody: cssVar('bg-body'),
  bgCard: cssVar('bg-card'),
  bgInput: cssVar('bg-input'),
  bgSecondary: cssVar('bg-secondary'),
  textMain: cssVar('text-main'),
  textMuted: cssVar('text-muted'),
  textInverse: cssVar('text-inverse'),
  primary: cssVar('primary'),
  primaryHover: cssVar('primary-hover'),
  danger: cssVar('danger'),
  success: cssVar('success'),
  warning: cssVar('warning'),
  border: cssVar('border'),
  borderStrong: cssVar('border-strong'),

  // Radius
  radiusSm: cssVar('radius-sm'),
  radiusMd: cssVar('radius-md'),
  radiusLg: cssVar('radius-lg'),

  // Shadows
  shadowSm: cssVar('shadow-sm'),
  shadowMd: cssVar('shadow-md'),
  shadowLg: cssVar('shadow-lg'),

  // Glass
  glassBg: cssVar('glass-bg'),
  glassBorder: cssVar('glass-border'),

  // Overlay
  overlayBg: cssVar('overlay-bg'),
} as const;

// Default export for convenience
export default {
  colors,
  typography,
  spacing,
  radius,
  shadows,
  animation,
  zIndex,
  breakpoints,
  sizes,
  getThemeTokens,
  cssVar,
  cssVars,
};
