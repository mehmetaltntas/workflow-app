import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Calendar, Link2, FileText, Type, Trash2, Activity, FolderOpen } from "lucide-react";
import { STATUS_COLORS, STATUS_LABELS } from "../constants";
import "./BoardEditModal.css";

type BoardStatus = "PLANLANDI" | "DEVAM_EDIYOR" | "TAMAMLANDI" | "DURDURULDU" | "BIRAKILDI";

interface BoardEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; link?: string; description?: string; deadline?: string; status?: BoardStatus; category?: string }) => void;
  onDelete?: () => void;
  initialData: {
    name: string;
    link?: string;
    description?: string;
    deadline?: string;
    status?: BoardStatus;
    category?: string;
  };
}

const BoardEditModal: React.FC<BoardEditModalProps> = ({ isOpen, onClose, onSave, onDelete, initialData }) => {
  const [name, setName] = useState(initialData.name);
  const [link, setLink] = useState(initialData.link || "");
  const [description, setDescription] = useState(initialData.description || "");
  const [deadline, setDeadline] = useState(initialData.deadline || "");
  const [status, setStatus] = useState<BoardStatus>(initialData.status || "PLANLANDI");
  const [category, setCategory] = useState(initialData.category || "");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const MAX_DESCRIPTION_LENGTH = 500;

  useEffect(() => {
    if (isOpen) {
      setName(initialData.name);
      setLink(initialData.link || "");
      setDescription(initialData.description || "");
      setDeadline(initialData.deadline || "");
      setStatus(initialData.status || "PLANLANDI");
      setCategory(initialData.category || "");
      setShowDeleteConfirm(false);
    }
  }, [isOpen, initialData]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave({
        name: name.trim(),
        link: link || undefined,
        description: description || undefined,
        deadline: deadline || undefined,
        status,
        category: category || undefined,
      });
      onClose();
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
      onClose();
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
        aria-labelledby="modal-title-board-edit"
        className="board-edit-modal__container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="board-edit-modal__header">
          <h2 id="modal-title-board-edit" className="board-edit-modal__title">
            Panoyu Düzenle
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
                  placeholder="Pano adını girin..."
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
                  Durum
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
          <div className="board-edit-modal__footer">
            {/* Sol taraf - Silme butonu */}
            <div>
              {onDelete && !showDeleteConfirm && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="board-edit-modal__delete-btn"
                >
                  <Trash2 size={16} />
                  Panoyu Sil
                </button>
              )}

              {/* Silme onay */}
              {onDelete && showDeleteConfirm && (
                <div className="board-edit-modal__delete-confirm">
                  <span className="board-edit-modal__delete-confirm-text">
                    Emin misiniz?
                  </span>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="board-edit-modal__confirm-yes-btn"
                  >
                    Evet, Sil
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="board-edit-modal__confirm-cancel-btn"
                  >
                    Vazgeç
                  </button>
                </div>
              )}
            </div>

            {/* Sag taraf - Kaydet/Iptal butonlari */}
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
                Kaydet
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default BoardEditModal;
