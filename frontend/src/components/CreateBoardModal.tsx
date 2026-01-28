import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Calendar, Link2, FileText, Type, Activity, FolderOpen, Users } from "lucide-react";
import { STATUS_COLORS, STATUS_LABELS } from "../constants";
import "./BoardEditModal.css";

type BoardStatus = "PLANLANDI" | "DEVAM_EDIYOR" | "TAMAMLANDI" | "DURDURULDU" | "BIRAKILDI";

interface CreateBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, status: string, link?: string, description?: string, deadline?: string, category?: string, boardType?: 'INDIVIDUAL' | 'TEAM') => Promise<void>;
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
  const [status, setStatus] = useState<BoardStatus>((initialData?.status as BoardStatus) || "PLANLANDI");
  const [link, setLink] = useState(initialData?.link || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [deadline, setDeadline] = useState(initialData?.deadline || "");
  const [category, setCategory] = useState(initialData?.category || "");
  const [boardType, setBoardType] = useState<'INDIVIDUAL' | 'TEAM'>('INDIVIDUAL');

  const MAX_DESCRIPTION_LENGTH = 500;
  const modalRef = useRef<HTMLDivElement>(null);

  // Modal acikken arka plan scroll'unu kilitle
  useEffect(() => {
    if (!isOpen) return;
    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.style.overflow = 'hidden';
    }
    return () => {
      if (mainEl) {
        mainEl.style.overflow = '';
      }
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const modal = modalRef.current;
    if (!modal) return;

    const focusableElements = modal.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    firstElement?.focus();

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    modal.addEventListener('keydown', handleTab);
    return () => modal.removeEventListener('keydown', handleTab);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      try {
        await onCreate(name, status, link || undefined, description || undefined, deadline || undefined, category || undefined, boardType);
        if (!initialData) {
          setName("");
          setStatus("PLANLANDI");
          setLink("");
          setDescription("");
          setDeadline("");
          setCategory("");
          setBoardType("INDIVIDUAL");
        }
        onClose();
      } catch {
        // Modal stays open - error toast shown by mutation hook
      }
    }
  };

  return createPortal(
    <div
      className="board-edit-modal__overlay"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      {/* Modal Container */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title-create-board"
        className="board-edit-modal__container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="board-edit-modal__header">
          <h2 id="modal-title-create-board" className="board-edit-modal__title">
            {initialData ? "Panoyu Düzenle" : "Yeni Pano Oluştur"}
          </h2>
          <button
            onClick={onClose}
            aria-label="Kapat"
            className="board-edit-modal__close-btn"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit}>
          <div className="board-edit-modal__form-grid">
            {/* Sol Kolon */}
            <div className="board-edit-modal__left-col">
              {/* Pano Tipi */}
              <div className="board-edit-modal__field">
                <label className="board-edit-modal__label">
                  <Users size={16} />
                  Pano Tipi
                </label>
                <div className="board-edit-modal__status-group">
                  <button
                    type="button"
                    onClick={() => setBoardType('INDIVIDUAL')}
                    className={`board-edit-modal__status-btn ${boardType === 'INDIVIDUAL' ? "board-edit-modal__status-btn--active" : ""}`}
                    style={{
                      borderColor: boardType === 'INDIVIDUAL' ? '#8b5cf6' : undefined,
                      background: boardType === 'INDIVIDUAL' ? '#8b5cf620' : undefined,
                      color: boardType === 'INDIVIDUAL' ? '#8b5cf6' : undefined,
                    }}
                  >
                    Bireysel
                  </button>
                  <button
                    type="button"
                    onClick={() => setBoardType('TEAM')}
                    className={`board-edit-modal__status-btn ${boardType === 'TEAM' ? "board-edit-modal__status-btn--active" : ""}`}
                    style={{
                      borderColor: boardType === 'TEAM' ? '#3b82f6' : undefined,
                      background: boardType === 'TEAM' ? '#3b82f620' : undefined,
                      color: boardType === 'TEAM' ? '#3b82f6' : undefined,
                    }}
                  >
                    Ekip
                  </button>
                </div>
              </div>

              {/* Isim */}
              <div className="board-edit-modal__field">
                <label className="board-edit-modal__label">
                  <Type size={16} />
                  Pano Adı
                </label>
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={25}
                  placeholder="Örn: Yeni Web Sitesi"
                  className="board-edit-modal__input"
                />
              </div>

              {/* Baglanti Adresi */}
              <div className="board-edit-modal__field">
                <label className="board-edit-modal__label">
                  <Link2 size={16} />
                  Bağlantı Adresi
                </label>
                <input
                  type="url"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://..."
                  className="board-edit-modal__input"
                />
              </div>

              {/* Son Tarih */}
              <div className="board-edit-modal__field">
                <label className="board-edit-modal__label">
                  <Calendar size={16} />
                  Son Tarih
                </label>
                <div className="board-edit-modal__date-row">
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="board-edit-modal__input board-edit-modal__date-input"
                  />
                  {deadline && (
                    <button
                      type="button"
                      onClick={() => setDeadline("")}
                      className="board-edit-modal__clear-btn"
                    >
                      Temizle
                    </button>
                  )}
                </div>
              </div>

              {/* Durum */}
              <div className="board-edit-modal__field">
                <label className="board-edit-modal__label">
                  <Activity size={16} />
                  Başlangıç Durumu
                </label>
                <div className="board-edit-modal__status-group">
                  {(Object.keys(STATUS_LABELS) as BoardStatus[]).map((statusKey) => {
                    const isActive = status === statusKey;
                    const statusColor = STATUS_COLORS[statusKey];
                    return (
                      <button
                        key={statusKey}
                        type="button"
                        onClick={() => setStatus(statusKey)}
                        className={`board-edit-modal__status-btn ${isActive ? "board-edit-modal__status-btn--active" : ""}`}
                        style={{
                          borderColor: isActive ? statusColor : undefined,
                          background: isActive ? `${statusColor}20` : undefined,
                          color: isActive ? statusColor : undefined,
                        }}
                      >
                        <div
                          className="board-edit-modal__status-dot"
                          style={{ background: statusColor }}
                        />
                        {STATUS_LABELS[statusKey]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Kategori */}
              <div className="board-edit-modal__field">
                <label className="board-edit-modal__label">
                  <FolderOpen size={16} />
                  Kategori
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="board-edit-modal__input"
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

            {/* Sag Kolon - Aciklama */}
            <div className="board-edit-modal__field">
              <label className="board-edit-modal__label">
                <FileText size={16} />
                Açıklama
                <span
                  className={`board-edit-modal__char-counter ${
                    description.length >= MAX_DESCRIPTION_LENGTH ? "board-edit-modal__char-counter--limit" : ""
                  }`}
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
                className="board-edit-modal__textarea"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="board-edit-modal__footer" style={{ justifyContent: "flex-end" }}>
            <div className="board-edit-modal__actions">
              <button
                type="button"
                onClick={onClose}
                className="board-edit-modal__cancel-btn"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={!name.trim()}
                className="board-edit-modal__save-btn"
              >
                {initialData ? "Güncelle" : "Oluştur"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default CreateBoardModal;
