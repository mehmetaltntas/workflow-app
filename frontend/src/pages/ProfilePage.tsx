import { useState, useEffect, useRef } from "react";
import { User, Camera, Mail, Save, Check } from "lucide-react";
import { userService } from "../services/api";
import toast from "react-hot-toast";

const ProfilePage = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalUsername, setOriginalUsername] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const userId = localStorage.getItem("userId");

  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) return;
      try {
        const response = await userService.getUser(Number(userId));
        setUsername(response.data.username);
        setOriginalUsername(response.data.username);
        setEmail(response.data.email);
        setProfilePicture(response.data.profilePicture || null);
      } catch (error) {
        console.error("Kullanıcı bilgileri alınamadı:", error);
        toast.error("Kullanıcı bilgileri alınamadı");
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, [userId]);

  // Track changes
  useEffect(() => {
    setHasChanges(username !== originalUsername);
  }, [username, originalUsername]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Dosya boyutu 2MB'dan küçük olmalıdır");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicture(reader.result as string);
        setHasChanges(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!userId) return;
    setIsSaving(true);
    const loadingToast = toast.loading("Profil güncelleniyor...");

    try {
      const data: { username?: string; profilePicture?: string } = {};
      
      if (username !== originalUsername) {
        data.username = username;
      }
      
      if (profilePicture) {
        data.profilePicture = profilePicture;
      }

      const response = await userService.updateProfile(Number(userId), data);
      
      // LocalStorage'ı güncelle
      if (response.data.username) {
        localStorage.setItem("username", response.data.username);
        setOriginalUsername(response.data.username);
      }
      
      setHasChanges(false);
      toast.success("Profil başarıyla güncellendi!", { id: loadingToast });
    } catch (error: unknown) {
      console.error("Profil güncellenemedi:", error);
      const err = error as { response?: { data?: string } };
      toast.error(err.response?.data || "Profil güncellenemedi", { id: loadingToast });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "60vh",
      }}>
        <div style={{
          width: "40px",
          height: "40px",
          border: "3px solid rgba(77, 171, 247, 0.2)",
          borderTopColor: "var(--primary)",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
        }} />
      </div>
    );
  }

  const initials = username.substring(0, 2).toUpperCase();

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
          Profil Ayarları
        </h1>
        <p style={{
          fontSize: "14px",
          color: "var(--text-muted)",
        }}>
          Profil bilgilerinizi görüntüleyin ve düzenleyin
        </p>
      </div>

      {/* Profile Card */}
      <div style={{
        background: "var(--bg-card)",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--border)",
        padding: "32px",
      }}>
        {/* Profile Picture Section */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          marginBottom: "32px",
          paddingBottom: "32px",
          borderBottom: "1px solid var(--border)",
        }}>
          <div style={{
            position: "relative",
            marginBottom: "16px",
          }}>
            {/* Avatar */}
            <div style={{
              width: "120px",
              height: "120px",
              borderRadius: "50%",
              background: profilePicture 
                ? `url(${profilePicture}) center/cover no-repeat`
                : "linear-gradient(135deg, var(--primary), #7950f2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "36px",
              fontWeight: "700",
              color: "white",
              border: "4px solid var(--bg-body)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
            }}>
              {!profilePicture && initials}
            </div>

            {/* Upload Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                position: "absolute",
                bottom: "0",
                right: "0",
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: "var(--primary)",
                border: "3px solid var(--bg-card)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.1)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(77, 171, 247, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <Camera size={18} color="#000" strokeWidth={2.5} />
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: "none" }}
            />
          </div>

          <p style={{
            fontSize: "13px",
            color: "var(--text-muted)",
          }}>
            Profil resminizi değiştirmek için tıklayın (max 2MB)
          </p>
        </div>

        {/* Form Fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Username Field */}
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
              <User size={14} />
              Kullanıcı Adı
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: "100%",
                padding: "14px 16px",
                fontSize: "15px",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Email Field (Read-only) */}
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
              <Mail size={14} />
              E-posta Adresi
            </label>
            <div style={{
              position: "relative",
            }}>
              <input
                type="email"
                value={email}
                disabled
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  fontSize: "15px",
                  boxSizing: "border-box",
                  opacity: 0.6,
                  cursor: "not-allowed",
                }}
              />
              <span style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: "11px",
                color: "var(--text-muted)",
                background: "rgba(255, 255, 255, 0.05)",
                padding: "4px 8px",
                borderRadius: "4px",
              }}>
                Değiştirilemez
              </span>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div style={{
          marginTop: "32px",
          paddingTop: "24px",
          borderTop: "1px solid var(--border)",
        }}>
          <button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="btn btn-primary"
            style={{
              width: "100%",
              padding: "14px",
              fontSize: "15px",
              fontWeight: "600",
              opacity: !hasChanges ? 0.5 : 1,
              cursor: !hasChanges ? "not-allowed" : "pointer",
            }}
          >
            {isSaving ? (
              <>
                <div style={{
                  width: "18px",
                  height: "18px",
                  border: "2px solid rgba(0, 0, 0, 0.2)",
                  borderTopColor: "#000",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                }} />
                Kaydediliyor...
              </>
            ) : hasChanges ? (
              <>
                <Save size={18} />
                Değişiklikleri Kaydet
              </>
            ) : (
              <>
                <Check size={18} />
                Kaydedildi
              </>
            )}
          </button>
        </div>
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

export default ProfilePage;
