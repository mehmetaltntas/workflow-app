import { X } from "lucide-react";
import { colors as tokenColors } from "../../styles/tokens";
import type { Priority, Label } from "../../types";

export interface CreateListModalProps {
  newListName: string;
  newListDescription: string;
  newListLink: string;
  newListPriority: Priority;
  newListLabelIds: number[];
  boardLabels: Label[];
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onLinkChange: (value: string) => void;
  onPriorityChange: (value: Priority) => void;
  onLabelIdsChange: (value: number[]) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export const CreateListModal = ({
  newListName,
  newListDescription,
  newListLink,
  newListPriority,
  newListLabelIds,
  boardLabels,
  onNameChange,
  onDescriptionChange,
  onLinkChange,
  onPriorityChange,
  onLabelIdsChange,
  onSubmit,
  onClose,
}: CreateListModalProps) => {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: tokenColors.dark.bg.modalOverlay,
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: tokenColors.dark.bg.card,
          borderRadius: '20px',
          padding: '28px',
          width: '550px',
          maxHeight: '85vh',
          overflowY: 'auto',
          border: `1px solid ${tokenColors.dark.border.strong}`,
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center" style={{ marginBottom: '20px' }}>
          <span style={{ fontSize: "16px", fontWeight: "700", color: 'var(--text-main)' }}>Yeni Liste</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
        </div>

        {/* Liste Ad\u0131 */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>Liste Ad\u0131 *</label>
          <input
            autoFocus
            value={newListName}
            onChange={(e) => onNameChange(e.target.value)}
            maxLength={25}
            placeholder="Liste ad\u0131..."
            style={{
              width: "100%",
              borderRadius: '10px',
              background: tokenColors.dark.bg.hover,
              border: `1px solid ${tokenColors.dark.border.subtle}`,
              padding: '12px',
              fontSize: '14px',
              color: 'var(--text-main)',
            }}
          />
        </div>

        {/* A\u00e7\u0131klama */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>A\u00e7\u0131klama</label>
          <textarea
            value={newListDescription}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Liste a\u00e7\u0131klamas\u0131..."
            style={{
              width: "100%",
              borderRadius: '10px',
              background: tokenColors.dark.bg.hover,
              border: `1px solid ${tokenColors.dark.border.subtle}`,
              padding: '12px',
              fontSize: '14px',
              color: 'var(--text-main)',
              minHeight: '80px',
              resize: 'vertical',
            }}
          />
        </div>

        {/* Link */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>Link</label>
          <input
            type="url"
            value={newListLink}
            onChange={(e) => onLinkChange(e.target.value)}
            placeholder="https://..."
            style={{
              width: "100%",
              borderRadius: '10px',
              background: tokenColors.dark.bg.hover,
              border: `1px solid ${tokenColors.dark.border.subtle}`,
              padding: '12px',
              fontSize: '14px',
              color: 'var(--primary)',
            }}
          />
        </div>

        {/* \u00d6ncelik */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>\u00d6ncelik</label>
          <select
            value={newListPriority}
            onChange={(e) => onPriorityChange(e.target.value as Priority)}
            style={{
              width: "100%",
              borderRadius: '10px',
              background: tokenColors.dark.bg.hover,
              border: `1px solid ${tokenColors.dark.border.subtle}`,
              padding: '12px',
              fontSize: '14px',
              color: 'var(--text-main)',
              cursor: 'pointer',
            }}
          >
            <option value="NONE">Yok</option>
            <option value="LOW">D\u00fc\u015f\u00fck</option>
            <option value="MEDIUM">Orta</option>
            <option value="HIGH">Y\u00fcksek</option>
          </select>
        </div>

        {/* Etiketler */}
        {boardLabels && boardLabels.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Etiketler</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {boardLabels.map((label: Label) => {
                const isSelected = newListLabelIds.includes(label.id);
                return (
                  <button
                    key={label.id}
                    type="button"
                    onClick={() => onLabelIdsChange(
                      isSelected ? newListLabelIds.filter(id => id !== label.id) : [...newListLabelIds, label.id]
                    )}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: `1px solid ${isSelected ? label.color : tokenColors.dark.border.subtle}`,
                      background: isSelected ? `${label.color}25` : 'transparent',
                      color: isSelected ? label.color : 'var(--text-muted)',
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: label.color }} />
                    {label.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <button
          onClick={onSubmit}
          disabled={!newListName.trim()}
          className="btn btn-primary font-semibold"
          style={{
            width: '100%',
            borderRadius: '10px',
            height: '42px',
            opacity: !newListName.trim() ? 0.5 : 1,
            cursor: !newListName.trim() ? 'not-allowed' : 'pointer',
          }}
        >
          Olu\u015ftur
        </button>
      </div>
    </div>
  );
};
