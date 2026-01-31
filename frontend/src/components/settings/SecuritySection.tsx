import { useState } from "react";
import {
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Check,
} from "lucide-react";
import { AxiosError } from "axios";
import { userService } from "../../services/api";
import toast from "react-hot-toast";
import { typography, spacing, radius, colors, cssVars, animation } from '../../styles/tokens';

interface SecuritySectionProps {
  userId: number;
}

const SecuritySection = ({ userId }: SecuritySectionProps) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  const passwordsMatch = newPassword === confirmPassword;
  const isNewPasswordValid = newPassword.length >= 4;
  const canSubmitPassword = currentPassword && newPassword && confirmPassword && passwordsMatch && isNewPasswordValid;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmitPassword) return;

    setIsSubmittingPassword(true);
    const loadingToast = toast.loading("Şifre değiştiriliyor...");

    try {
      await userService.updatePassword(userId, {
        currentPassword,
        newPassword,
      });

      toast.success("Şifre başarıyla değiştirildi!", { id: loadingToast });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: unknown) {
      console.error("Şifre değiştirilemedi:", error);
      if (error instanceof AxiosError) {
        toast.error(error.response?.data || "Şifre değiştirilemedi", { id: loadingToast });
      } else {
        toast.error("Şifre değiştirilemedi", { id: loadingToast });
      }
    } finally {
      setIsSubmittingPassword(false);
    }
  };

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
          Şifre Değiştir
        </h2>
        <p style={{
          fontSize: typography.fontSize.base,
          color: cssVars.textMuted,
          margin: 0,
        }}>
          Hesabınız için yeni bir şifre belirleyin
        </p>
      </div>

      {/* Password Form */}
      <form onSubmit={handleChangePassword} style={{
        display: "flex",
        flexDirection: "column",
        gap: spacing[6],
      }}>
        {/* Current Password */}
        <div>
          <label style={{
            display: "flex",
            alignItems: "center",
            gap: spacing[2],
            fontSize: typography.fontSize.base,
            fontWeight: typography.fontWeight.semibold,
            color: cssVars.textMuted,
            marginBottom: spacing[2],
          }}>
            <Lock size={14} />
            Mevcut Şifre
          </label>
          <div style={{ position: "relative" }}>
            <input
              type={showCurrentPassword ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Mevcut şifrenizi girin"
              style={{
                width: "100%",
                padding: `${spacing[3]} ${spacing[12]} ${spacing[3]} ${spacing[4]}`,
                fontSize: typography.fontSize.lg,
                boxSizing: "border-box",
              }}
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              style={{
                position: "absolute",
                right: spacing[3],
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: cssVars.textMuted,
                padding: spacing[1],
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div>
          <label style={{
            display: "flex",
            alignItems: "center",
            gap: spacing[2],
            fontSize: typography.fontSize.base,
            fontWeight: typography.fontWeight.semibold,
            color: cssVars.textMuted,
            marginBottom: spacing[2],
          }}>
            <Lock size={14} />
            Yeni Şifre
          </label>
          <div style={{ position: "relative" }}>
            <input
              type={showNewPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Yeni şifrenizi girin"
              style={{
                width: "100%",
                padding: `${spacing[3]} ${spacing[12]} ${spacing[3]} ${spacing[4]}`,
                fontSize: typography.fontSize.lg,
                boxSizing: "border-box",
                borderColor: newPassword && !isNewPasswordValid ? colors.semantic.danger : undefined,
              }}
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              style={{
                position: "absolute",
                right: spacing[3],
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: cssVars.textMuted,
                padding: spacing[1],
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {newPassword && !isNewPasswordValid && (
            <p style={{
              display: "flex",
              alignItems: "center",
              gap: spacing[1.5],
              marginTop: spacing[2],
              fontSize: typography.fontSize.md,
              color: colors.semantic.danger,
            }}>
              <AlertCircle size={14} />
              Şifre en az 4 karakter olmalıdır
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label style={{
            display: "flex",
            alignItems: "center",
            gap: spacing[2],
            fontSize: typography.fontSize.base,
            fontWeight: typography.fontWeight.semibold,
            color: cssVars.textMuted,
            marginBottom: spacing[2],
          }}>
            <Lock size={14} />
            Yeni Şifre (Tekrar)
          </label>
          <div style={{ position: "relative" }}>
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Yeni şifrenizi tekrar girin"
              style={{
                width: "100%",
                padding: `${spacing[3]} ${spacing[12]} ${spacing[3]} ${spacing[4]}`,
                fontSize: typography.fontSize.lg,
                boxSizing: "border-box",
                borderColor: confirmPassword && !passwordsMatch ? colors.semantic.danger :
                            confirmPassword && passwordsMatch ? colors.semantic.success : undefined,
              }}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              style={{
                position: "absolute",
                right: spacing[3],
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: cssVars.textMuted,
                padding: spacing[1],
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {confirmPassword && !passwordsMatch && (
            <p style={{
              display: "flex",
              alignItems: "center",
              gap: spacing[1.5],
              marginTop: spacing[2],
              fontSize: typography.fontSize.md,
              color: colors.semantic.danger,
            }}>
              <AlertCircle size={14} />
              Şifreler eşleşmiyor
            </p>
          )}
          {confirmPassword && passwordsMatch && isNewPasswordValid && (
            <p style={{
              display: "flex",
              alignItems: "center",
              gap: spacing[1.5],
              marginTop: spacing[2],
              fontSize: typography.fontSize.md,
              color: colors.semantic.success,
            }}>
              <Check size={14} />
              Şifreler eşleşiyor
            </p>
          )}
        </div>

        {/* Submit Button */}
        <div style={{
          marginTop: spacing[2],
          paddingTop: spacing[6],
          borderTop: `1px solid ${cssVars.border}`,
          display: "flex",
          justifyContent: "flex-end",
        }}>
          <button
            type="submit"
            disabled={!canSubmitPassword || isSubmittingPassword}
            className="btn btn-primary"
            style={{
              padding: `${spacing[3]} ${spacing[6]}`,
              fontSize: typography.fontSize.lg,
              fontWeight: typography.fontWeight.semibold,
              opacity: !canSubmitPassword ? 0.5 : 1,
              cursor: !canSubmitPassword ? "not-allowed" : "pointer",
              minWidth: "180px",
            }}
          >
            {isSubmittingPassword ? (
              <>
                <div style={{
                  width: "16px",
                  height: "16px",
                  border: `2px solid ${cssVars.borderSubtle}`,
                  borderTopColor: cssVars.textInverse,
                  borderRadius: radius.full,
                  animation: "spin 1s linear infinite",
                }} />
                Değiştiriliyor...
              </>
            ) : (
              <>
                <Lock size={16} />
                Şifreyi Değiştir
              </>
            )}
          </button>
        </div>
      </form>

      {/* Info Note */}
      <div style={{
        marginTop: spacing[6],
        padding: spacing[4],
        background: colors.brand.primaryLight,
        borderRadius: radius.md,
        border: `1px solid ${cssVars.borderFocus}`,
      }}>
        <p style={{
          display: "flex",
          alignItems: "flex-start",
          gap: spacing[3],
          margin: 0,
          fontSize: typography.fontSize.base,
          color: cssVars.textMuted,
          lineHeight: typography.lineHeight.normal,
        }}>
          <AlertCircle size={18} style={{ flexShrink: 0, marginTop: "2px", color: colors.brand.primary }} />
          Şifrenizi değiştirdikten sonra mevcut oturumunuz devam edecektir. Güvenlik için tarayıcınızı kapatıp yeniden giriş yapmanızı öneririz.
        </p>
      </div>
    </div>
  );
};

export default SecuritySection;
