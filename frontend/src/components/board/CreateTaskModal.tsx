import { X } from "lucide-react";
import { colors as tokenColors } from "../../styles/tokens";

export interface CreateTaskModalProps {
  activeListId: number;
  newTaskTitle: string;
  newTaskDescription: string;
  newTaskLink: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onLinkChange: (value: string) => void;
  onSubmit: (listId: number) => void;
  onClose: () => void;
}

export const CreateTaskModal = ({
  activeListId,
  newTaskTitle,
  newTaskDescription,
  newTaskLink,
  onTitleChange,
  onDescriptionChange,
  onLinkChange,
  onSubmit,
  onClose,
}: CreateTaskModalProps) => {
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
          width: '500px',
          maxHeight: '85vh',
          overflowY: 'auto',
          border: `1px solid ${tokenColors.dark.border.strong}`,
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center" style={{ marginBottom: '20px' }}>
          <span style={{ fontSize: "16px", fontWeight: "700", color: 'var(--text-main)' }}>Yeni G\u00f6rev</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
        </div>

        {/* \u0130sim */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>G\u00f6rev Ad\u0131 *</label>
          <input
            autoFocus
            value={newTaskTitle}
            onChange={(e) => onTitleChange(e.target.value)}
            maxLength={25}
            placeholder="G\u00f6rev ad\u0131..."
            style={{
              width: "100%",
              borderRadius: '10px',
              background: tokenColors.dark.bg.hover,
              border: `1px solid ${tokenColors.dark.border.subtle}`,
              padding: '12px',
              fontSize: '14px',
              color: 'var(--text-main)',
            }}
            onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); onSubmit(activeListId); } }}
          />
        </div>

        {/* A\u00e7\u0131klama */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>A\u00e7\u0131klama</label>
          <textarea
            value={newTaskDescription}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="G\u00f6rev a\u00e7\u0131klamas\u0131..."
            style={{
              width: "100%",
              minHeight: "80px",
              borderRadius: '10px',
              background: tokenColors.dark.bg.hover,
              border: `1px solid ${tokenColors.dark.border.subtle}`,
              padding: '12px',
              fontSize: '14px',
              color: 'var(--text-main)',
              resize: 'vertical',
            }}
          />
        </div>

        {/* Link */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>Ba\u011flant\u0131</label>
          <input
            type="url"
            value={newTaskLink}
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

        <button
          onClick={() => onSubmit(activeListId)}
          disabled={!newTaskTitle.trim()}
          className="btn btn-primary font-semibold"
          style={{
            width: '100%',
            borderRadius: '10px',
            height: '42px',
            opacity: !newTaskTitle.trim() ? 0.5 : 1,
            cursor: !newTaskTitle.trim() ? 'not-allowed' : 'pointer',
          }}
        >
          Olu\u015ftur
        </button>
      </div>
    </div>
  );
};
