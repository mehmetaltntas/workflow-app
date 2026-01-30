import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { typography, spacing, radius, colors, cssVars, animation } from '../../styles/tokens';

interface ErrorFallbackProps {
  error?: Error;
  onReset?: () => void;
  variant?: 'page' | 'section' | 'minimal';
}

export const ErrorFallback = ({
  error,
  onReset,
  variant = 'page',
}: ErrorFallbackProps) => {

  if (variant === 'minimal') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing[2],
          padding: spacing[3],
          background: `${colors.semantic.danger}10`,
          borderRadius: radius.md,
          color: colors.semantic.danger,
          fontSize: typography.fontSize.sm,
        }}
      >
        <AlertTriangle size={16} />
        <span>Bir hata oluştu</span>
        {onReset && (
          <button
            onClick={onReset}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              color: colors.semantic.danger,
              cursor: 'pointer',
              padding: spacing[1],
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <RefreshCw size={14} />
          </button>
        )}
      </div>
    );
  }

  if (variant === 'section') {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: spacing[8],
          gap: spacing[4],
          background: cssVars.bgCard,
          borderRadius: radius.xl,
          border: `1px solid ${cssVars.border}`,
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: radius.full,
            background: `${colors.semantic.danger}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AlertTriangle size={28} color={colors.semantic.danger} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <h3
            style={{
              fontSize: typography.fontSize.lg,
              fontWeight: typography.fontWeight.semibold,
              color: cssVars.textMain,
              margin: 0,
              marginBottom: spacing[1],
            }}
          >
            Bu bölüm yüklenemedi
          </h3>
          <p
            style={{
              fontSize: typography.fontSize.sm,
              color: cssVars.textMuted,
              margin: 0,
            }}
          >
            {error?.message || 'Beklenmeyen bir hata oluştu'}
          </p>
        </div>
        {onReset && (
          <button
            onClick={onReset}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing[2],
              padding: `${spacing[2]} ${spacing[4]}`,
              borderRadius: radius.md,
              border: `1px solid ${cssVars.border}`,
              background: cssVars.bgSecondary,
              color: cssVars.textMain,
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.medium,
              cursor: 'pointer',
              transition: `all ${animation.duration.normal}`,
            }}
          >
            <RefreshCw size={14} />
            Tekrar Dene
          </button>
        )}
      </div>
    );
  }

  // variant === 'page'
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: cssVars.bgBody,
        padding: spacing[4],
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: spacing[6],
          maxWidth: '400px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: radius.full,
            background: `linear-gradient(135deg, ${colors.semantic.danger}20, ${colors.semantic.danger}10)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `1px solid ${colors.semantic.danger}30`,
          }}
        >
          <AlertTriangle size={40} color={colors.semantic.danger} />
        </div>

        <div>
          <h1
            style={{
              fontSize: typography.fontSize['3xl'],
              fontWeight: typography.fontWeight.bold,
              color: cssVars.textMain,
              margin: 0,
              marginBottom: spacing[2],
            }}
          >
            Bir Hata Oluştu
          </h1>
          <p
            style={{
              fontSize: typography.fontSize.md,
              color: cssVars.textMuted,
              margin: 0,
              lineHeight: typography.lineHeight.relaxed,
            }}
          >
            {error?.message || 'Beklenmeyen bir hata meydana geldi. Lütfen sayfayı yenileyin veya daha sonra tekrar deneyin.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: spacing[3] }}>
          {onReset && (
            <button
              onClick={onReset}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing[2],
                padding: `${spacing[3]} ${spacing[5]}`,
                borderRadius: radius.lg,
                border: 'none',
                background: `linear-gradient(135deg, ${colors.brand.primary}, ${colors.brand.primaryDark})`,
                color: '#fff',
                fontSize: typography.fontSize.md,
                fontWeight: typography.fontWeight.semibold,
                cursor: 'pointer',
                transition: `all ${animation.duration.normal}`,
                boxShadow: `0 4px 12px ${colors.brand.primary}30`,
              }}
            >
              <RefreshCw size={18} />
              Tekrar Dene
            </button>
          )}
          <button
            onClick={() => { window.location.href = '/home'; }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing[2],
              padding: `${spacing[3]} ${spacing[5]}`,
              borderRadius: radius.lg,
              border: `1px solid ${cssVars.border}`,
              background: cssVars.bgCard,
              color: cssVars.textMain,
              fontSize: typography.fontSize.md,
              fontWeight: typography.fontWeight.medium,
              cursor: 'pointer',
              transition: `all ${animation.duration.normal}`,
            }}
          >
            <Home size={18} />
            Ana Sayfa
          </button>
        </div>

        {error && process.env.NODE_ENV === 'development' && (
          <details
            style={{
              marginTop: spacing[4],
              padding: spacing[4],
              background: cssVars.bgSecondary,
              borderRadius: radius.md,
              width: '100%',
              textAlign: 'left',
            }}
          >
            <summary
              style={{
                fontSize: typography.fontSize.sm,
                color: cssVars.textMuted,
                cursor: 'pointer',
              }}
            >
              Hata Detayları (Geliştirici)
            </summary>
            <pre
              style={{
                marginTop: spacing[2],
                fontSize: typography.fontSize.xs,
                color: colors.semantic.danger,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
};

export default ErrorFallback;
