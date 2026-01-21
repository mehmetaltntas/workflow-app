import React, { useState } from "react";
import { X } from "lucide-react";

interface CreateBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, status: string, link?: string, description?: string) => void;
  initialData?: {
    name: string;
    status: string;
    link?: string;
    description?: string;
  };
}

const CreateBoardModal: React.FC<CreateBoardModalProps> = ({ isOpen, onClose, onCreate, initialData }) => {
  const [name, setName] = useState(initialData?.name || "");
  const [status, setStatus] = useState(initialData?.status || "PLANLANDI");
  const [link, setLink] = useState(initialData?.link || "");
  const [description, setDescription] = useState(initialData?.description || "");
  
  const MAX_DESCRIPTION_LENGTH = 105; // 35 karakter x 3 satır

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreate(name, status, link || undefined, description || undefined);
      if (!initialData) {
        setName("");
        setStatus("PLANLANDI");
        setLink("");
        setDescription("");
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
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        backdropFilter: "blur(4px)"
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--bg-card)",
          padding: "30px",
          borderRadius: "16px",
          width: "400px",
          border: "1px solid var(--border)",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "600", color: "var(--text-main)" }}>
            {initialData ? "Panoyu Düzenle" : "Yeni Pano Oluştur"}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "8px", color: "var(--text-muted)", fontSize: "14px" }}>
              Pano Adı
            </label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn: Yeni Web Sitesi"
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                background: "var(--bg-input)",
                color: "var(--text-main)",
                fontSize: "16px"
              }}
            />
          </div>

          <div>
             <label style={{ display: "block", marginBottom: "8px", color: "var(--text-muted)", fontSize: "14px" }}>
              Başlangıç Durumu
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                background: "var(--bg-input)",
                color: "var(--text-main)",
                 fontSize: "16px"
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
             <label style={{ display: "block", marginBottom: "8px", color: "var(--text-muted)", fontSize: "14px" }}>
              Link (Opsiyonel)
            </label>
            <input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://..."
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                background: "var(--bg-input)",
                color: "var(--text-main)",
                 fontSize: "16px"
              }}
            />
          </div>

          <div>
             <label style={{ display: "block", marginBottom: "8px", color: "var(--text-muted)", fontSize: "14px" }}>
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
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  background: "var(--bg-input)",
                  color: "var(--text-main)",
                  fontSize: "14px",
                  resize: "none",
                  boxSizing: "border-box",
                  fontFamily: "inherit"
                }}
              />
              <span style={{
                position: "absolute",
                right: "10px",
                bottom: "10px",
                fontSize: "12px",
                color: description.length >= MAX_DESCRIPTION_LENGTH ? "#ff6b6b" : "var(--text-muted)",
                fontWeight: "500",
                background: "var(--bg-input)",
                padding: "2px 6px",
                borderRadius: "4px"
              }}>
                {description.length}/{MAX_DESCRIPTION_LENGTH}
              </span>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost"
              style={{ padding: "10px 20px" }}
            >
              İptal
            </button>
             <button
              type="submit"
              className="btn btn-primary"
              style={{ padding: "10px 20px" }}
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
