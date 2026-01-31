import { useState, useCallback } from "react";
import {
  AlertCircle,
  Trash2,
} from "lucide-react";
import { userService } from "../../services/api";
import toast from "react-hot-toast";
import { typography, spacing, radius, colors, cssVars, animation } from '../../styles/tokens';

interface AccountSectionProps {
  userId: number;
  deletionScheduledAt: string | null;
  onDeletionScheduled: (date: string | null) => void;
}

const AccountSection = ({ userId, deletionScheduledAt, onDeletionScheduled }: AccountSectionProps) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeletionLoading, setIsDeletionLoading] = useState(false);

  const handleScheduleDeletion = useCallback(async () => {
    setIsDeletionLoading(true);
    try {
      const result = await userService.scheduleDeletion(userId);
      const scheduledAt = result.deletionScheduledAt;
      onDeletionScheduled(scheduledAt || null);
      setShowDeleteConfirm(false);
      if (scheduledAt) {
        const deleteDate = new Date(scheduledAt);
        deleteDate.setDate(deleteDate.getDate() + 30);
        toast.success(`Hesabınız ${deleteDate.toLocaleDateString('tr-TR')} tarihinde silinecek`);
      }
    } catch {
      toast.error("Hesap silme zamanlanamadı");
    } finally {
      setIsDeletionLoading(false);
    }
  }, [userId, onDeletionScheduled]);

  const handleCancelDeletion = useCallback(async () => {
    setIsDeletionLoading(true);
    try {
      await userService.cancelDeletion(userId);
      onDeletionScheduled(null);
      toast.success("Hesap silme işlemi iptal edildi");
    } catch {
      toast.error("Hesap silme iptali başarısız");
    } finally {
      setIsDeletionLoading(false);
    }
  }, [userId, onDeletionScheduled]);

  return (
    <div style={{ padding: spacing[8] }}>
      {/* Section Header */}
      <div style={{
        marginBottom: spacing[8],
        paddingBottom: spacing[6],
        borderBottom: `1px solid ${cssVars.border}`,
      }}>
        <h2 style={{
          fontSize: typography.fontSize["2xl"],
          fontWeight: typography.fontWeight.semibold,
          color: cssVars.textMain,
          margin: 0,
          marginBottom: spacing[1],
        }}>
          Hesap
        </h2>
        <p style={{
          fontSize: typography.fontSize.base,
          color: cssVars.textMuted,
          margin: 0,
        }}>
          Hesabınızı kalıcı olarak silebilirsiniz
        </p>
      </div>

      {deletionScheduledAt ? (
        // Deletion scheduled state
        <div>
          <div style={{
            padding: spacing[5],
            background: `${colors.semantic.danger}10`,
            borderRadius: radius.lg,
            border: `1px solid ${colors.semantic.danger}30`,
            marginBottom: spacing[6],
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: spacing[3],
              marginBottom: spacing[3],
            }}>
              <AlertCircle size={20} color={colors.semantic.danger} />
              <span style={{
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.semibold,
                color: colors.semantic.danger,
              }}>
                Hesabınız silinmek üzere zamanlandı
              </span>
            </div>
            <p style={{
              fontSize: typography.fontSize.base,
              color: cssVars.textMuted,
              margin: 0,
              marginBottom: spacing[4],
              lineHeight: typography.lineHeight.normal,
            }}>
              {(() => {
                const scheduledDate = new Date(deletionScheduledAt);
                const deleteDate = new Date(scheduledDate);
                deleteDate.setDate(deleteDate.getDate() + 30);
                const now = new Date();
                const diffTime = deleteDate.getTime() - now.getTime();
                const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
                return `Hesabınız ${diffDays} gün içinde (${deleteDate.toLocaleDateString('tr-TR')}) kalıcı olarak silinecektir. Bu süre içinde iptal edebilirsiniz.`;
              })()}
            </p>
            <button
              onClick={handleCancelDeletion}
              disabled={isDeletionLoading}
              style={{
                padding: `${spacing[2.5]} ${spacing[5]}`,
                fontSize: typography.fontSize.base,
                fontWeight: typography.fontWeight.semibold,
                color: cssVars.textInverse,
                background: colors.semantic.danger,
                border: "none",
                borderRadius: radius.md,
                cursor: isDeletionLoading ? "not-allowed" : "pointer",
                opacity: isDeletionLoading ? 0.6 : 1,
                transition: `all ${animation.duration.normal} ${animation.easing.smooth}`,
              }}
              onMouseEnter={(e) => {
                if (!isDeletionLoading) e.currentTarget.style.opacity = "0.9";
              }}
              onMouseLeave={(e) => {
                if (!isDeletionLoading) e.currentTarget.style.opacity = "1";
              }}
            >
              {isDeletionLoading ? "İptal ediliyor..." : "Silme İşlemini İptal Et"}
            </button>
          </div>
        </div>
      ) : (
        // Deletion not scheduled state
        <div>
          <div style={{
            padding: spacing[5],
            background: cssVars.bgHover,
            borderRadius: radius.lg,
            marginBottom: spacing[6],
          }}>
            <div style={{
              fontSize: typography.fontSize.lg,
              fontWeight: typography.fontWeight.semibold,
              color: cssVars.textMain,
              marginBottom: spacing[2],
            }}>
              Hesabı Sil
            </div>
            <p style={{
              fontSize: typography.fontSize.base,
              color: cssVars.textMuted,
              margin: 0,
              marginBottom: spacing[4],
              lineHeight: typography.lineHeight.normal,
            }}>
              Hesabınızı sildiğinizde 30 gün içinde geri alabilirsiniz. Bu süre sonunda tüm verileriniz kalıcı olarak silinecektir.
            </p>

            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                style={{
                  padding: `${spacing[2.5]} ${spacing[5]}`,
                  fontSize: typography.fontSize.base,
                  fontWeight: typography.fontWeight.semibold,
                  color: colors.semantic.danger,
                  background: `${colors.semantic.danger}10`,
                  border: `1px solid ${colors.semantic.danger}30`,
                  borderRadius: radius.md,
                  cursor: "pointer",
                  transition: `all ${animation.duration.normal} ${animation.easing.smooth}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `${colors.semantic.danger}20`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = `${colors.semantic.danger}10`;
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: spacing[2] }}>
                  <Trash2 size={16} />
                  Hesabı Sil
                </span>
              </button>
            ) : (
              <div style={{
                padding: spacing[4],
                background: `${colors.semantic.danger}08`,
                borderRadius: radius.md,
                border: `1px solid ${colors.semantic.danger}20`,
              }}>
                <p style={{
                  fontSize: typography.fontSize.base,
                  fontWeight: typography.fontWeight.semibold,
                  color: colors.semantic.danger,
                  margin: 0,
                  marginBottom: spacing[3],
                }}>
                  Emin misiniz? Hesabınız 30 gün sonra kalıcı olarak silinecektir.
                </p>
                <div style={{ display: "flex", gap: spacing[3] }}>
                  <button
                    onClick={handleScheduleDeletion}
                    disabled={isDeletionLoading}
                    style={{
                      padding: `${spacing[2]} ${spacing[4]}`,
                      fontSize: typography.fontSize.base,
                      fontWeight: typography.fontWeight.semibold,
                      color: cssVars.textInverse,
                      background: colors.semantic.danger,
                      border: "none",
                      borderRadius: radius.md,
                      cursor: isDeletionLoading ? "not-allowed" : "pointer",
                      opacity: isDeletionLoading ? 0.6 : 1,
                    }}
                  >
                    {isDeletionLoading ? "İşleniyor..." : "Evet, Hesabımı Sil"}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeletionLoading}
                    style={{
                      padding: `${spacing[2]} ${spacing[4]}`,
                      fontSize: typography.fontSize.base,
                      fontWeight: typography.fontWeight.medium,
                      color: cssVars.textMuted,
                      background: "transparent",
                      border: `1px solid ${cssVars.border}`,
                      borderRadius: radius.md,
                      cursor: "pointer",
                    }}
                  >
                    Vazgeç
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountSection;
