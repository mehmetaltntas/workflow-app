import React, { useState } from "react";
import { X, Calendar } from "lucide-react";
import { colors, typography, spacing, radius, shadows, zIndex } from "../styles/tokens";

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
  const [name, setName] = useState(initialData?.name || "");
  const [status, setStatus] = useState(initialData?.status || "PLANLANDI");
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

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: colors.dark.bg.overlay,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: zIndex.modal,
        backdropFilter: "blur(4px)"
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--bg-card)",
          padding: spacing[7],
          borderRadius: radius.xl,
          width: "400px",
          border: "1px solid var(--border)",
          boxShadow: shadows.modal
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: spacing[5] }}>
          <h2 style={{ fontSize: typography.fontSize['3xl'], fontWeight: typography.fontWeight.semibold, color: "var(--text-main)" }}>
            {initialData ? "Panoyu Düzenle" : "Yeni Pano Oluştur"}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: spacing[5] }}>
          <div>
            <label style={{ display: "block", marginBottom: spacing[2], color: "var(--text-muted)", fontSize: typography.fontSize.lg }}>
              Pano Adı
            </label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={25}
              placeholder="Örn: Yeni Web Sitesi"
              style={{
                width: "100%",
                padding: spacing[2.5],
                borderRadius: radius.md,
                border: "1px solid var(--border)",
                background: "var(--bg-input)",
                color: "var(--text-main)",
                fontSize: typography.fontSize['2xl']
              }}
            />
          </div>

          <div>
             <label style={{ display: "block", marginBottom: spacing[2], color: "var(--text-muted)", fontSize: typography.fontSize.lg }}>
              Başlangıç Durumu
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{
                width: "100%",
                padding: spacing[2.5],
                borderRadius: radius.md,
                border: "1px solid var(--border)",
                background: "var(--bg-input)",
                color: "var(--text-main)",
                fontSize: typography.fontSize['2xl']
              }}
            >
              <option value="PLANLANDI">Planlandı</option>
              <option value="DEVAM_EDIYOR">Devam Ediyor</option>
              <option value="TAMAMLANDI">Tamamlandı</option>
              <option value="DURDURULDU">Durduruldu</option>
              <option value="BIRAKILDI">Bırakıldı</option>
            </select>
          </div>

          <div>
             <label style={{ display: "block", marginBottom: spacing[2], color: "var(--text-muted)", fontSize: typography.fontSize.lg }}>
              Kategori (Opsiyonel)
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{
                width: "100%",
                padding: spacing[2.5],
                borderRadius: radius.md,
                border: "1px solid var(--border)",
                background: "var(--bg-input)",
                color: "var(--text-main)",
                fontSize: typography.fontSize['2xl']
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

          <div>
             <label style={{ display: "block", marginBottom: spacing[2], color: "var(--text-muted)", fontSize: typography.fontSize.lg }}>
              Link (Opsiyonel)
            </label>
            <input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://..."
              style={{
                width: "100%",
                padding: spacing[2.5],
                borderRadius: radius.md,
                border: "1px solid var(--border)",
                background: "var(--bg-input)",
                color: "var(--text-main)",
                fontSize: typography.fontSize['2xl']
              }}
            />
          </div>

          <div>
             <label style={{ display: "block", marginBottom: spacing[2], color: "var(--text-muted)", fontSize: typography.fontSize.lg }}>
              Açıklama (Opsiyonel - Max {MAX_DESCRIPTION_LENGTH} karakter)
            </label>
            <div style={{ position: "relative" }}>
              <textarea
                value={description}
                onChange={(e) => {
                  if (e.target.value.length <= MAX_DESCRIPTION_LENGTH) {
                    setDescription(e.target.value);
                  }
                }}
                placeholder="Kısa bir açıklama..."
                maxLength={MAX_DESCRIPTION_LENGTH}
                rows={3}
                style={{
                  width: "100%",
                  padding: spacing[2.5],
                  borderRadius: radius.md,
                  border: "1px solid var(--border)",
                  background: "var(--bg-input)",
                  color: "var(--text-main)",
                  fontSize: typography.fontSize.lg,
                  resize: "none",
                  boxSizing: "border-box",
                  fontFamily: "inherit"
                }}
              />
              <span style={{
                position: "absolute",
                right: spacing[2.5],
                bottom: spacing[2.5],
                fontSize: typography.fontSize.md,
                color: description.length >= MAX_DESCRIPTION_LENGTH ? colors.semantic.danger : "var(--text-muted)",
                fontWeight: typography.fontWeight.medium,
                background: "var(--bg-input)",
                padding: `${spacing[0.5]} ${spacing[1.5]}`,
                borderRadius: radius.sm
              }}>
                {description.length}/{MAX_DESCRIPTION_LENGTH}
              </span>
            </div>
          </div>

          <div>
            <label style={{ display: "flex", alignItems: "center", gap: spacing[1.5], marginBottom: spacing[2], color: "var(--text-muted)", fontSize: typography.fontSize.lg }}>
              <Calendar size={16} /> Son Tarih (Opsiyonel)
            </label>
            <div style={{ display: "flex", gap: spacing[2] }}>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                style={{
                  flex: 1,
                  padding: spacing[2.5],
                  borderRadius: radius.md,
                  border: "1px solid var(--border)",
                  background: "var(--bg-input)",
                  color: "var(--text-main)",
                  fontSize: typography.fontSize.lg,
                  colorScheme: "dark"
                }}
              />
              {deadline && (
                <button
                  type="button"
                  onClick={() => setDeadline("")}
                  style={{
                    padding: `${spacing[2]} ${spacing[3]}`,
                    borderRadius: radius.md,
                    border: "1px solid var(--border)",
                    background: "var(--bg-input)",
                    color: "var(--text-muted)",
                    fontSize: typography.fontSize.md,
                    cursor: "pointer"
                  }}
                >
                  Temizle
                </button>
              )}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: spacing[2.5], marginTop: spacing[2.5] }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost"
              style={{ padding: `${spacing[2.5]} ${spacing[5]}` }}
            >
              İptal
            </button>
             <button
              type="submit"
              className="btn btn-primary"
              style={{ padding: `${spacing[2.5]} ${spacing[5]}` }}
            >
              {initialData ? "Güncelle" : "Oluştur"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateBoardModal;
