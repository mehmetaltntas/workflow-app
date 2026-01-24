import React, { useState } from "react";
import { X, Tag, Plus, Edit2, Trash2, Check } from "lucide-react";
import type { Label } from "../types";
import { colors, cssVars, typography, spacing, radius, shadows, zIndex, animation } from "../styles/tokens";

interface LabelManagerProps {
  boardId: number;
  labels: Label[];
  onClose: () => void;
  onCreateLabel: (data: { name: string; color: string; boardId: number }) => Promise<void>;
  onUpdateLabel: (labelId: number, data: { name?: string; color?: string }) => Promise<void>;
  onDeleteLabel: (labelId: number) => Promise<void>;
}

// Maksimum kullanıcı etiketi sayısı (varsayılan etiketler hariç)
const MAX_USER_LABELS = 7;

// Kullanıcı etiketleri için mevcut renkler
// NOT: #ef4444 (Zor), #f59e0b (Orta), #22c55e (Kolay) varsayılan etiketler için rezerve
const PRESET_COLORS = [
  "#f97316", // Orange
  "#eab308", // Yellow
  "#84cc16", // Lime
  "#14b8a6", // Teal
  "#06b6d4", // Cyan
  "#0ea5e9", // Sky
  "#3b82f6", // Blue
  "#6366f1", // Indigo
  "#8b5cf6", // Violet
  "#a855f7", // Purple
  "#d946ef", // Fuchsia
  "#ec4899", // Pink
  "#f43f5e", // Rose
];

export const LabelManager: React.FC<LabelManagerProps> = ({
  boardId,
  labels,
  onClose,
  onCreateLabel,
  onUpdateLabel,
  onDeleteLabel,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingLabelId, setEditingLabelId] = useState<number | null>(null);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState(PRESET_COLORS[0]);
  const [editLabelName, setEditLabelName] = useState("");
  const [editLabelColor, setEditLabelColor] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Kullanıcı etiketlerini say (varsayılan olmayanlar)
  const userLabelCount = labels.filter(l => !l.isDefault).length;
  const canCreateMoreLabels = userLabelCount < MAX_USER_LABELS;

  const handleCreate = async () => {
    if (!newLabelName.trim()) return;
    setIsSaving(true);
    try {
      await onCreateLabel({ name: newLabelName.trim(), color: newLabelColor, boardId });
      setNewLabelName("");
      setNewLabelColor(PRESET_COLORS[0]);
      setIsCreating(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async (labelId: number) => {
    if (!editLabelName.trim()) return;
    setIsSaving(true);
    try {
      await onUpdateLabel(labelId, { name: editLabelName.trim(), color: editLabelColor });
      setEditingLabelId(null);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const startEditing = (label: Label) => {
    setEditingLabelId(label.id);
    setEditLabelName(label.name);
    setEditLabelColor(label.color);
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: colors.dark.bg.overlay,
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: zIndex.modal,
      }}
    >
      <div
        className="modal-content glass"
        style={{
          width: "450px",
          maxHeight: "80vh",
          borderRadius: radius['2xl'],
          padding: spacing[7],
          display: "flex",
          flexDirection: "column",
          gap: spacing[5],
          position: "relative",
          background: "var(--bg-card)",
          boxShadow: shadows.modal,
          border: "1px solid var(--border)",
          animation: `modalFadeIn ${animation.duration.slow} ${animation.easing.smooth}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: spacing[3], color: "var(--text-main)" }}>
            <div style={{ padding: spacing[2.5], backgroundColor: "rgba(var(--primary-rgb), 0.1)", borderRadius: radius.lg }}>
              <Tag size={20} className="text-primary" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: typography.fontSize['3xl'], fontWeight: typography.fontWeight.bold, letterSpacing: typography.letterSpacing.tighter }}>Etiketler</h3>
              <span style={{ fontSize: typography.fontSize.sm, color: userLabelCount >= MAX_USER_LABELS ? 'var(--warning)' : 'var(--text-muted)' }}>
                {userLabelCount}/{MAX_USER_LABELS} özel etiket
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-gray-400 transition-colors">
            <X size={22} />
          </button>
        </div>

        {/* Labels List */}
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: spacing[2] }}>
          {labels.length === 0 && !isCreating && (
            <div style={{ textAlign: "center", padding: spacing[6], color: "var(--text-muted)" }}>
              <Tag size={32} style={{ opacity: 0.3, marginBottom: spacing[3] }} />
              <p style={{ fontSize: typography.fontSize.base }}>Henüz etiket eklenmemiş.</p>
            </div>
          )}

          {labels.map((label) =>
            editingLabelId === label.id ? (
              // Edit Mode
              <div
                key={label.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: spacing[3],
                  padding: spacing[3.5],
                  borderRadius: radius.lg,
                  background: colors.dark.bg.hover,
                  border: `1px solid ${cssVars.borderStrong}`,
                }}
              >
                <input
                  autoFocus
                  value={editLabelName}
                  onChange={(e) => setEditLabelName(e.target.value)}
                  placeholder="Etiket adı"
                  style={{
                    width: "100%",
                    padding: `${spacing[2.5]} ${spacing[3]}`,
                    borderRadius: radius.md,
                    border: "1px solid var(--border)",
                    background: colors.dark.glass.bg,
                    color: cssVars.textMain,
                    fontSize: typography.fontSize.base,
                    outline: "none",
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleUpdate(label.id);
                    if (e.key === "Escape") setEditingLabelId(null);
                  }}
                />
                <div style={{ display: "flex", flexWrap: "wrap", gap: spacing[1.5] }}>
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setEditLabelColor(color)}
                      style={{
                        width: spacing[6],
                        height: spacing[6],
                        borderRadius: radius.sm,
                        background: color,
                        border: editLabelColor === color ? `2px solid ${cssVars.textMain}` : "2px solid transparent",
                        cursor: "pointer",
                        transition: `all ${animation.duration.fast}`,
                      }}
                    />
                  ))}
                </div>
                <div style={{ display: "flex", gap: spacing[2] }}>
                  <button
                    onClick={() => handleUpdate(label.id)}
                    disabled={isSaving || !editLabelName.trim()}
                    className="btn btn-primary"
                    style={{ flex: 1, height: spacing[9], fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.semibold }}
                  >
                    <Check size={14} /> Kaydet
                  </button>
                  <button
                    onClick={() => setEditingLabelId(null)}
                    className="btn btn-ghost"
                    style={{ padding: `${spacing[2]} ${spacing[3]}`, height: spacing[9] }}
                  >
                    İptal
                  </button>
                </div>
              </div>
            ) : (
              // View Mode
              <div
                key={label.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: spacing[3],
                  padding: `${spacing[3]} ${spacing[3.5]}`,
                  borderRadius: radius.lg,
                  background: colors.dark.glass.bg,
                  border: `1px solid ${colors.dark.border.subtle}`,
                  transition: `all ${animation.duration.normal}`,
                }}
                className="group/label"
              >
                <div
                  style={{
                    width: spacing[8],
                    height: spacing[8],
                    borderRadius: radius.md,
                    background: `${label.color}30`,
                    border: `2px solid ${label.color}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Tag size={14} style={{ color: label.color }} />
                </div>
                <span style={{ flex: 1, fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, color: "var(--text-main)" }}>
                  {label.name}
                </span>
                <div style={{ display: "flex", gap: spacing[1], opacity: 0, transition: `opacity ${animation.duration.normal}` }} className="group-hover/label:!opacity-100">
                  {/* Varsayılan etiketler düzenlenemez ve silinemez */}
                  {!label.isDefault && (
                    <>
                    <button
                      onClick={() => startEditing(label)}
                      style={{
                        padding: spacing[1.5],
                        borderRadius: radius.sm,
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--text-muted)",
                        transition: `all ${animation.duration.normal}`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = colors.brand.primaryLight;
                        e.currentTarget.style.color = "var(--primary)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = "var(--text-muted)";
                      }}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => onDeleteLabel(label.id)}
                      style={{
                        padding: spacing[1.5],
                        borderRadius: radius.sm,
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--text-muted)",
                        transition: `all ${animation.duration.normal}`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = colors.semantic.dangerLight;
                        e.currentTarget.style.color = "var(--danger)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = "var(--text-muted)";
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                    </>
                  )}
                </div>
              </div>
            )
          )}

          {/* Create New Label Form */}
          {isCreating && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: spacing[3],
                padding: spacing[3.5],
                borderRadius: radius.lg,
                background: colors.brand.primaryLight,
                border: `1px solid ${colors.brand.primary}33`,
              }}
            >
              <input
                autoFocus
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
                placeholder="Yeni etiket adı"
                style={{
                  width: "100%",
                  padding: `${spacing[2.5]} ${spacing[3]}`,
                  borderRadius: radius.md,
                  border: "1px solid var(--border)",
                  background: colors.dark.glass.bg,
                  color: cssVars.textMain,
                  fontSize: typography.fontSize.base,
                  outline: "none",
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                  if (e.key === "Escape") setIsCreating(false);
                }}
              />
              <div style={{ display: "flex", flexWrap: "wrap", gap: spacing[1.5] }}>
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewLabelColor(color)}
                    style={{
                      width: spacing[6],
                      height: spacing[6],
                      borderRadius: radius.sm,
                      background: color,
                      border: newLabelColor === color ? `2px solid ${cssVars.textMain}` : "2px solid transparent",
                      cursor: "pointer",
                      transition: `all ${animation.duration.fast}`,
                    }}
                  />
                ))}
              </div>
              <div style={{ display: "flex", gap: spacing[2] }}>
                <button
                  onClick={handleCreate}
                  disabled={isSaving || !newLabelName.trim()}
                  className="btn btn-primary"
                  style={{ flex: 1, height: spacing[9], fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.semibold }}
                >
                  <Plus size={14} /> Oluştur
                </button>
                <button
                  onClick={() => setIsCreating(false)}
                  className="btn btn-ghost"
                  style={{ padding: `${spacing[2]} ${spacing[3]}`, height: spacing[9] }}
                >
                  İptal
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Add New Label Button */}
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            disabled={!canCreateMoreLabels}
            className="btn btn-ghost"
            style={{
              width: "100%",
              justifyContent: "center",
              height: "44px",
              gap: spacing[2],
              color: canCreateMoreLabels ? "var(--primary)" : "var(--text-muted)",
              fontWeight: typography.fontWeight.semibold,
              borderRadius: radius.lg,
              fontSize: typography.fontSize.base,
              border: `1px dashed ${canCreateMoreLabels ? colors.brand.primary + '4D' : 'var(--border)'}`,
              background: canCreateMoreLabels ? colors.brand.primaryLight : 'transparent',
              opacity: canCreateMoreLabels ? 1 : 0.6,
              cursor: canCreateMoreLabels ? 'pointer' : 'not-allowed',
            }}
          >
            <Plus size={18} /> {canCreateMoreLabels ? 'Yeni Etiket Ekle' : 'Maksimum etiket sayısına ulaşıldı'}
          </button>
        )}
      </div>

      <style>{`
        @keyframes modalFadeIn {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
};
