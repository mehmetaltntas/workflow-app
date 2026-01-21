import { useState } from "react";
import { Lock, Eye, EyeOff, Shield, AlertCircle, Check } from "lucide-react";
import { userService } from "../services/api";
import toast from "react-hot-toast";

const SettingsPage = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const userId = localStorage.getItem("userId");

  // Validation
  const passwordsMatch = newPassword === confirmPassword;
  const isNewPasswordValid = newPassword.length >= 4;
  const canSubmit = currentPassword && newPassword && confirmPassword && passwordsMatch && isNewPasswordValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSubmit || !userId) return;

    setIsSubmitting(true);
    const loadingToast = toast.loading("Şifre değiştiriliyor...");

    try {
      await userService.updatePassword(Number(userId), {
        currentPassword,
        newPassword,
      });

      toast.success("Şifre başarıyla değiştirildi!", { id: loadingToast });
      
      // Form'u temizle
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: unknown) {
      console.error("Şifre değiştirilemedi:", error);
      const err = error as { response?: { data?: string } };
      toast.error(err.response?.data || "Şifre değiştirilemedi", { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      maxWidth: "600px",
      margin: "0 auto",
      padding: "40px 24px",
    }}>
      {/* Header */}
      <div style={{ marginBottom: "40px" }}>
        <h1 style={{
          fontSize: "28px",
          fontWeight: "700",
          color: "var(--text-main)",
          marginBottom: "8px",
        }}>
          Güvenlik Ayarları
        </h1>
        <p style={{
          fontSize: "14px",
          color: "var(--text-muted)",
        }}>
          Hesap güvenliğinizi yönetin
        </p>
      </div>

      {/* Password Change Card */}
      <div style={{
        background: "var(--bg-card)",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--border)",
        padding: "32px",
      }}>
        {/* Section Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "24px",
          paddingBottom: "16px",
          borderBottom: "1px solid var(--border)",
        }}>
          <div style={{
            width: "44px",
            height: "44px",
            borderRadius: "12px",
            background: "rgba(77, 171, 247, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <Shield size={22} color="var(--primary)" />
          </div>
          <div>
            <h2 style={{
              fontSize: "18px",
              fontWeight: "600",
              color: "var(--text-main)",
              margin: 0,
            }}>
              Şifre Değiştir
            </h2>
            <p style={{
              fontSize: "13px",
              color: "var(--text-muted)",
              margin: 0,
            }}>
              Hesabınız için yeni bir şifre belirleyin
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{
          display: "flex",
          flexDirection: "column",
          gap: "24px",
        }}>
          {/* Current Password */}
          <div>
            <label style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "13px",
              fontWeight: "600",
              color: "var(--text-muted)",
              marginBottom: "8px",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
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
                  padding: "14px 48px 14px 16px",
                  fontSize: "15px",
                  boxSizing: "border-box",
                }}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  padding: "4px",
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
              gap: "8px",
              fontSize: "13px",
              fontWeight: "600",
              color: "var(--text-muted)",
              marginBottom: "8px",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
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
                  padding: "14px 48px 14px 16px",
                  fontSize: "15px",
                  boxSizing: "border-box",
                  borderColor: newPassword && !isNewPasswordValid ? "var(--danger)" : undefined,
                }}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  padding: "4px",
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
                gap: "6px",
                marginTop: "8px",
                fontSize: "12px",
                color: "var(--danger)",
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
              gap: "8px",
              fontSize: "13px",
              fontWeight: "600",
              color: "var(--text-muted)",
              marginBottom: "8px",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
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
                  padding: "14px 48px 14px 16px",
                  fontSize: "15px",
                  boxSizing: "border-box",
                  borderColor: confirmPassword && !passwordsMatch ? "var(--danger)" : 
                              confirmPassword && passwordsMatch ? "var(--success)" : undefined,
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  padding: "4px",
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
                gap: "6px",
                marginTop: "8px",
                fontSize: "12px",
                color: "var(--danger)",
              }}>
                <AlertCircle size={14} />
                Şifreler eşleşmiyor
              </p>
            )}
            {confirmPassword && passwordsMatch && isNewPasswordValid && (
              <p style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                marginTop: "8px",
                fontSize: "12px",
                color: "var(--success)",
              }}>
                <Check size={14} />
                Şifreler eşleşiyor
              </p>
            )}
          </div>

          {/* Submit Button */}
          <div style={{
            marginTop: "8px",
            paddingTop: "24px",
            borderTop: "1px solid var(--border)",
          }}>
            <button
              type="submit"
              disabled={!canSubmit || isSubmitting}
              className="btn btn-primary"
              style={{
                width: "100%",
                padding: "14px",
                fontSize: "15px",
                fontWeight: "600",
                opacity: !canSubmit ? 0.5 : 1,
                cursor: !canSubmit ? "not-allowed" : "pointer",
              }}
            >
              {isSubmitting ? (
                <>
                  <div style={{
                    width: "18px",
                    height: "18px",
                    border: "2px solid rgba(0, 0, 0, 0.2)",
                    borderTopColor: "#000",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }} />
                  Değiştiriliyor...
                </>
              ) : (
                <>
                  <Lock size={18} />
                  Şifreyi Değiştir
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Info Note */}
      <div style={{
        marginTop: "24px",
        padding: "16px",
        background: "rgba(77, 171, 247, 0.08)",
        borderRadius: "var(--radius-md)",
        border: "1px solid rgba(77, 171, 247, 0.15)",
      }}>
        <p style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "12px",
          margin: 0,
          fontSize: "13px",
          color: "var(--text-muted)",
          lineHeight: "1.5",
        }}>
          <AlertCircle size={18} style={{ flexShrink: 0, marginTop: "2px", color: "var(--primary)" }} />
          Şifrenizi değiştirdikten sonra mevcut oturumunuz devam edecektir. Güvenlik için tarayıcınızı kapatıp yeniden giriş yapmanızı öneririz.
        </p>
      </div>

      {/* Spin Animation */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default SettingsPage;
