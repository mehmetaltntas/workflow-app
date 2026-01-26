import React, { useState } from "react";
import { X, Calendar, Link2, FileText, Type, Activity, FolderOpen } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { getThemeColors } from "../utils/themeColors";
import { colors, typography, spacing, radius, shadows, zIndex, animation } from "../styles/tokens";
import { STATUS_COLORS, STATUS_LABELS } from "../constants";

type BoardStatus = "PLANLANDI" | "DEVAM_EDIYOR" | "TAMAMLANDI" | "DURDURULDU" | "BIRAKILDI";

interface CreateBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, status: string, link?: string, description?: string, deadline?: string, category?: string) => void;
  initialData?: {
    name: string;
    status: string;
    link?: string;
    description?: string;
    deadline?: string;
    category?: string;
  };
}

const CreateBoardModal: React.FC<CreateBoardModalProps> = ({ isOpen, onClose, onCreate, initialData }) => {
  const { theme } = useTheme();
  const themeColors = getThemeColors(theme);
  const isLight = theme === 'light';

  const [name, setName] = useState(initialData?.name || "");
  const [status, setStatus] = useState<BoardStatus>((initialData?.status as BoardStatus) || "PLANLANDI");
  const [link, setLink] = useState(initialData?.link || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [deadline, setDeadline] = useState(initialData?.deadline || "");
  const [category, setCategory] = useState(initialData?.category || "");

  const MAX_DESCRIPTION_LENGTH = 200;

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreate(name, status, link || undefined, description || undefined, deadline || undefined, category || undefined);
      if (!initialData) {
        setName("");
        setStatus("PLANLANDI");
        setLink("");
        setDescription("");
        setDeadline("");
        setCategory("");
      }
      onClose();
    }
  };

  const inputStyle = {
    width: "100%",
    padding: spacing[3],
    borderRadius: radius.lg,
    border: `1px solid ${themeColors.borderDefault}`,
    background: isLight ? colors.light.bg.input : colors.dark.bg.input,
    color: isLight ? colors.light.text.primary : colors.dark.text.primary,
    fontSize: typography.fontSize.lg,
    outline: "none",
    transition: `all ${animation.duration.fast}`,
    boxSizing: "border-box" as const,
  };

  const labelStyle = {
    display: "flex",
    alignItems: "center",
    gap: spacing[2],
    marginBottom: spacing[2],
    color: isLight ? colors.light.text.secondary : colors.dark.text.secondary,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
  };

  const fieldContainerStyle = {
    display: "flex",
    flexDirection: "column" as const,
    gap: spacing[1],
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: isLight ? colors.light.bg.modalOverlay : colors.dark.bg.modalOverlay,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "10vh",
        zIndex: zIndex.modal,
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        overflowY: "auto",
      }}
      onClick={onClose}
    >
      {/* Modal Container - Yatay (Wide) */}
      <div
        style={{
          background: isLight ? colors.light.bg.card : colors.dark.bg.card,
          borderRadius: radius["2xl"],
          width: "90%",
          maxWidth: "800px",
          border: `1px solid ${themeColors.borderDefault}`,
          boxShadow: shadows.modal,
          animation: "modalSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
          marginBottom: spacing[10],
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: `${spacing[5]} ${spacing[6]}`,
            borderBottom: `1px solid ${themeColors.borderDefault}`,
          }}
        >
          <h2
            style={{
              fontSize: typography.fontSize["3xl"],
              fontWeight: typography.fontWeight.bold,
              color: isLight ? colors.light.text.primary : colors.dark.text.primary,
              margin: 0,
              letterSpacing: typography.letterSpacing.tight,
            }}
          >
            {initialData ? "Panoyu Düzenle" : "Yeni Pano Oluştur"}
          </h2>
          <button
            onClick={onClose}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: spacing[9],
              height: spacing[9],
              borderRadius: radius.lg,
              border: "none",
              background: isLight ? colors.light.bg.hover : colors.dark.bg.hover,
              color: isLight ? colors.light.text.muted : colors.dark.text.muted,
              cursor: "pointer",
              transition: `all ${animation.duration.fast}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = isLight ? colors.light.bg.active : colors.dark.bg.active;
              e.currentTarget.style.color = colors.semantic.danger;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = isLight ? colors.light.bg.hover : colors.dark.bg.hover;
              e.currentTarget.style.color = isLight ? colors.light.text.muted : colors.dark.text.muted;
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit}>
          <div
            style={{
              padding: spacing[6],
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: spacing[5],
            }}
          >
            {/* Sol Kolon */}
            <div style={{ display: "flex", flexDirection: "column", gap: spacing[5] }}>
              {/* İsim */}
              <div style={fieldContainerStyle}>
                <label style={labelStyle}>
                  <Type size={16} />
                  Pano Adı
                </label>
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={25}
                  placeholder="Örn: Yeni Web Sitesi"
                  style={inputStyle}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = colors.brand.primary;
                    e.currentTarget.style.boxShadow = shadows.focusPrimary;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = themeColors.borderDefault;
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>

              {/* Bağlantı Adresi */}
              <div style={fieldContainerStyle}>
                <label style={labelStyle}>
                  <Link2 size={16} />
                  Bağlantı Adresi
                </label>
                <input
                  type="url"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://..."
                  style={inputStyle}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = colors.brand.primary;
                    e.currentTarget.style.boxShadow = shadows.focusPrimary;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = themeColors.borderDefault;
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>

              {/* Son Tarih */}
              <div style={fieldContainerStyle}>
                <label style={labelStyle}>
                  <Calendar size={16} />
                  Son Tarih
                </label>
                <div style={{ display: "flex", gap: spacing[2] }}>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    style={{
                      ...inputStyle,
                      flex: 1,
                      colorScheme: isLight ? "light" : "dark",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = colors.brand.primary;
                      e.currentTarget.style.boxShadow = shadows.focusPrimary;
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = themeColors.borderDefault;
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                  {deadline && (
                    <button
                      type="button"
                      onClick={() => setDeadline("")}
                      style={{
                        padding: `${spacing[2]} ${spacing[3]}`,
                        borderRadius: radius.lg,
                        border: `1px solid ${themeColors.borderDefault}`,
                        background: isLight ? colors.light.bg.hover : colors.dark.bg.hover,
                        color: isLight ? colors.light.text.muted : colors.dark.text.muted,
                        fontSize: typography.fontSize.sm,
                        cursor: "pointer",
                        transition: `all ${animation.duration.fast}`,
                        whiteSpace: "nowrap",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = colors.semantic.danger;
                        e.currentTarget.style.color = colors.semantic.danger;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = themeColors.borderDefault;
                        e.currentTarget.style.color = isLight ? colors.light.text.muted : colors.dark.text.muted;
                      }}
                    >
                      Temizle
                    </button>
                  )}
                </div>
              </div>

              {/* Durum */}
              <div style={fieldContainerStyle}>
                <label style={labelStyle}>
                  <Activity size={16} />
                  Başlangıç Durumu
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: spacing[2] }}>
                  {(Object.keys(STATUS_LABELS) as BoardStatus[]).map((statusKey) => {
                    const isActive = status === statusKey;
                    const statusColor = STATUS_COLORS[statusKey];
                    return (
                      <button
                        key={statusKey}
                        type="button"
                        onClick={() => setStatus(statusKey)}
                        style={{
                          padding: `${spacing[2]} ${spacing[3]}`,
                          borderRadius: radius.lg,
                          border: `1px solid ${isActive ? statusColor : themeColors.borderDefault}`,
                          background: isActive ? `${statusColor}20` : "transparent",
                          color: isActive ? statusColor : (isLight ? colors.light.text.secondary : colors.dark.text.secondary),
                          fontSize: typography.fontSize.sm,
                          fontWeight: isActive ? typography.fontWeight.semibold : typography.fontWeight.medium,
                          cursor: "pointer",
                          transition: `all ${animation.duration.fast}`,
                          display: "flex",
                          alignItems: "center",
                          gap: spacing[1.5],
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.borderColor = statusColor;
                            e.currentTarget.style.background = `${statusColor}10`;
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.borderColor = themeColors.borderDefault;
                            e.currentTarget.style.background = "transparent";
                          }
                        }}
                      >
                        <div
                          style={{
                            width: spacing[2],
                            height: spacing[2],
                            borderRadius: radius.full,
                            background: statusColor,
                          }}
                        />
                        {STATUS_LABELS[statusKey]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Kategori */}
              <div style={fieldContainerStyle}>
                <label style={labelStyle}>
                  <FolderOpen size={16} />
                  Kategori
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = colors.brand.primary;
                    e.currentTarget.style.boxShadow = shadows.focusPrimary;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = themeColors.borderDefault;
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <option value="">Kategori Seçin</option>
                  <option value="YAZILIM_GELISTIRME">Yazılım Geliştirme</option>
                  <option value="PAZARLAMA">Pazarlama</option>
                  <option value="TASARIM_KREATIF">Tasarım / Kreatif</option>
                  <option value="URUN_YONETIMI">Ürün Yönetimi</option>
                  <option value="SATIS_CRM">Satış / CRM</option>
                  <option value="INSAN_KAYNAKLARI">İnsan Kaynakları</option>
                  <option value="EGITIM_AKADEMIK">Eğitim / Akademik</option>
                  <option value="OPERASYON">Operasyon</option>
                  <option value="FINANS_MUHASEBE">Finans / Muhasebe</option>
                  <option value="MUSTERI_DESTEK">Müşteri Destek</option>
                  <option value="ICERIK_URETIMI">İçerik Üretimi</option>
                  <option value="UI_UX_TASARIMI">UI/UX Tasarımı</option>
                  <option value="ARGE_ARASTIRMA">Ar-Ge / Araştırma</option>
                  <option value="ETKINLIK_YONETIMI">Etkinlik Yönetimi</option>
                  <option value="HUKUK_YASAL">Hukuk / Yasal</option>
                  <option value="INSAAT_MIMARI">İnşaat / Mimari</option>
                  <option value="E_TICARET">E-Ticaret</option>
                  <option value="SAGLIK_YASAM">Sağlık / Yaşam</option>
                  <option value="KISISEL">Kişisel</option>
                  <option value="DIGER">Diğer</option>
                </select>
              </div>
            </div>

            {/* Sağ Kolon - Açıklama */}
            <div style={fieldContainerStyle}>
              <label style={labelStyle}>
                <FileText size={16} />
                Açıklama
                <span
                  style={{
                    marginLeft: "auto",
                    fontSize: typography.fontSize.xs,
                    color: description.length >= MAX_DESCRIPTION_LENGTH ? colors.semantic.danger : (isLight ? colors.light.text.subtle : colors.dark.text.subtle),
                    fontWeight: typography.fontWeight.normal,
                  }}
                >
                  {description.length}/{MAX_DESCRIPTION_LENGTH}
                </span>
              </label>
              <textarea
                value={description}
                onChange={(e) => {
                  if (e.target.value.length <= MAX_DESCRIPTION_LENGTH) {
                    setDescription(e.target.value);
                  }
                }}
                placeholder="Pano hakkında kısa bir açıklama..."
                maxLength={MAX_DESCRIPTION_LENGTH}
                style={{
                  ...inputStyle,
                  height: "100%",
                  minHeight: "180px",
                  resize: "none",
                  fontFamily: "inherit",
                  lineHeight: typography.lineHeight.relaxed,
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = colors.brand.primary;
                  e.currentTarget.style.boxShadow = shadows.focusPrimary;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = themeColors.borderDefault;
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: spacing[3],
              padding: `${spacing[4]} ${spacing[6]}`,
              borderTop: `1px solid ${themeColors.borderDefault}`,
              background: isLight ? colors.light.bg.secondary : colors.dark.bg.secondary,
              borderRadius: `0 0 ${radius["2xl"]} ${radius["2xl"]}`,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: `${spacing[2.5]} ${spacing[5]}`,
                borderRadius: radius.lg,
                border: `1px solid ${themeColors.borderDefault}`,
                background: "transparent",
                color: isLight ? colors.light.text.secondary : colors.dark.text.secondary,
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.medium,
                cursor: "pointer",
                transition: `all ${animation.duration.fast}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = isLight ? colors.light.bg.hover : colors.dark.bg.hover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              style={{
                padding: `${spacing[2.5]} ${spacing[6]}`,
                borderRadius: radius.lg,
                border: "none",
                background: name.trim()
                  ? `linear-gradient(135deg, ${colors.brand.primary}, ${colors.brand.primaryDark})`
                  : isLight ? colors.light.bg.secondary : colors.dark.bg.secondary,
                color: name.trim() ? "#fff" : (isLight ? colors.light.text.disabled : colors.dark.text.disabled),
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.semibold,
                cursor: name.trim() ? "pointer" : "not-allowed",
                transition: `all ${animation.duration.fast}`,
                boxShadow: name.trim() ? `0 4px 12px ${colors.brand.primary}30` : "none",
              }}
              onMouseEnter={(e) => {
                if (name.trim()) {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = `0 6px 16px ${colors.brand.primary}40`;
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = name.trim() ? `0 4px 12px ${colors.brand.primary}30` : "none";
              }}
            >
              {initialData ? "Güncelle" : "Oluştur"}
            </button>
          </div>
        </form>
      </div>

      {/* Animation Keyframes */}
      <style>{`
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default CreateBoardModal;
