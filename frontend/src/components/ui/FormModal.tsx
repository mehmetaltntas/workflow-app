import React from 'react';
import { X, Save } from 'lucide-react';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { colors, typography, spacing, radius, shadows, zIndex, animation } from '../../styles/tokens';

interface FormModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    onSubmit: (e: React.FormEvent) => void;
    isSubmitting: boolean;
    submitLabel: string;
    children: React.ReactNode;
}

export function FormModal({ isOpen, onClose, title, onSubmit, isSubmitting, submitLabel, children }: FormModalProps) {
    const containerRef = useFocusTrap(isOpen);

    if (!isOpen) return null;

    return (
        <div
            onClick={onClose}
            onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: colors.dark.bg.modalOverlay,
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: zIndex.modal,
            }}
        >
            <div
                ref={containerRef}
                role="dialog"
                aria-modal="true"
                aria-label={title}
                style={{
                    width: '520px',
                    maxHeight: '80vh',
                    borderRadius: radius['2xl'],
                    padding: spacing[8],
                    display: 'flex',
                    flexDirection: 'column',
                    gap: spacing[6],
                    position: 'relative',
                    background: colors.dark.bg.card,
                    boxShadow: '0 24px 48px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${colors.dark.border.strong}`,
                    animation: `modalFadeIn ${animation.duration.slow} ${animation.easing.smooth}`,
                    overflow: 'hidden',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{
                        margin: 0,
                        fontSize: typography.fontSize['2xl'],
                        fontWeight: typography.fontWeight.bold,
                        color: 'var(--text-main)',
                        letterSpacing: typography.letterSpacing.tighter,
                    }}>
                        {title}
                    </h3>
                    <button
                        onClick={onClose}
                        aria-label="Kapat"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '36px',
                            height: '36px',
                            borderRadius: radius.full,
                            border: 'none',
                            background: 'transparent',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                        }}
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: spacing[6], flex: 1, overflow: 'auto' }}>
                    {children}

                    {/* Footer */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: spacing[4],
                        paddingTop: spacing[4],
                        borderTop: '1px solid var(--border)',
                    }}>
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn btn-ghost"
                            style={{ padding: `${spacing[3]} ${spacing[6]}`, fontWeight: typography.fontWeight.semibold }}
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="btn btn-primary"
                            style={{
                                padding: `${spacing[3]} ${spacing[7]}`,
                                fontWeight: typography.fontWeight.bold,
                                display: 'flex',
                                alignItems: 'center',
                                gap: spacing[2.5],
                                boxShadow: shadows.focusPrimary,
                            }}
                        >
                            {isSubmitting ? (
                                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                            ) : (
                                <Save size={18} />
                            )}
                            {isSubmitting ? 'Kaydediliyor...' : submitLabel}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
