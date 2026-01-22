import React, { useState } from "react";
import { X, Tag, Plus, Edit2, Trash2, Check } from "lucide-react";
import type { Label } from "../types";

interface LabelManagerProps {
  boardId: number;
  labels: Label[];
  onClose: () => void;
  onCreateLabel: (data: { name: string; color: string; boardId: number }) => Promise<void>;
  onUpdateLabel: (labelId: number, data: { name?: string; color?: string }) => Promise<void>;
  onDeleteLabel: (labelId: number) => Promise<void>;
}

const PRESET_COLORS = [
  "#ef4444", // Red
  "#f97316", // Orange
  "#f59e0b", // Amber
  "#eab308", // Yellow
  "#84cc16", // Lime
  "#22c55e", // Green
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
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        className="modal-content glass"
        style={{
          width: "450px",
          maxHeight: "80vh",
          borderRadius: "20px",
          padding: "28px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          position: "relative",
          background: "var(--bg-card)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          border: "1px solid var(--border)",
          animation: "modalFadeIn 0.3s ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "var(--text-main)" }}>
            <div style={{ padding: "10px", backgroundColor: "rgba(var(--primary-rgb), 0.1)", borderRadius: "12px" }}>
              <Tag size={20} className="text-primary" />
            </div>
            <h3 style={{ margin: 0, fontSize: "20px", fontWeight: "700", letterSpacing: "-0.02em" }}>Etiketler</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-gray-400 transition-colors">
            <X size={22} />
          </button>
        </div>

        {/* Labels List */}
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
          {labels.length === 0 && !isCreating && (
            <div style={{ textAlign: "center", padding: "24px", color: "var(--text-muted)" }}>
              <Tag size={32} style={{ opacity: 0.3, marginBottom: "12px" }} />
              <p style={{ fontSize: "13px" }}>Henüz etiket eklenmemiş.</p>
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
                  gap: "12px",
                  padding: "14px",
                  borderRadius: "12px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <input
                  autoFocus
                  value={editLabelName}
                  onChange={(e) => setEditLabelName(e.target.value)}
                  placeholder="Etiket adı"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                    background: "rgba(255,255,255,0.03)",
                    color: "white",
                    fontSize: "13px",
                    outline: "none",
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleUpdate(label.id);
                    if (e.key === "Escape") setEditingLabelId(null);
                  }}
                />
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setEditLabelColor(color)}
                      style={{
                        width: "24px",
                        height: "24px",
                        borderRadius: "6px",
                        background: color,
                        border: editLabelColor === color ? "2px solid white" : "2px solid transparent",
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                    />
                  ))}
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => handleUpdate(label.id)}
                    disabled={isSaving || !editLabelName.trim()}
                    className="btn btn-primary"
                    style={{ flex: 1, height: "36px", fontSize: "12px", fontWeight: "600" }}
                  >
                    <Check size={14} /> Kaydet
                  </button>
                  <button
                    onClick={() => setEditingLabelId(null)}
                    className="btn btn-ghost"
                    style={{ padding: "8px 12px", height: "36px" }}
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
                  gap: "12px",
                  padding: "12px 14px",
                  borderRadius: "12px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  transition: "all 0.2s",
                }}
                className="group/label"
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    background: `${label.color}30`,
                    border: `2px solid ${label.color}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Tag size={14} style={{ color: label.color }} />
                </div>
                <span style={{ flex: 1, fontSize: "13px", fontWeight: "600", color: "var(--text-main)" }}>
                  {label.name}
                </span>
                <div style={{ display: "flex", gap: "4px", opacity: 0, transition: "opacity 0.2s" }} className="group-hover/label:!opacity-100">
                  <button
                    onClick={() => startEditing(label)}
                    style={{
                      padding: "6px",
                      borderRadius: "6px",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--text-muted)",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(77, 171, 247, 0.15)";
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
                      padding: "6px",
                      borderRadius: "6px",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--text-muted)",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(239, 68, 68, 0.15)";
                      e.currentTarget.style.color = "var(--danger)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "var(--text-muted)";
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
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
                gap: "12px",
                padding: "14px",
                borderRadius: "12px",
                background: "rgba(77, 171, 247, 0.08)",
                border: "1px solid rgba(77, 171, 247, 0.2)",
              }}
            >
              <input
                autoFocus
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
                placeholder="Yeni etiket adı"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  background: "rgba(255,255,255,0.03)",
                  color: "white",
                  fontSize: "13px",
                  outline: "none",
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                  if (e.key === "Escape") setIsCreating(false);
                }}
              />
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewLabelColor(color)}
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "6px",
                      background: color,
                      border: newLabelColor === color ? "2px solid white" : "2px solid transparent",
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  />
                ))}
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={handleCreate}
                  disabled={isSaving || !newLabelName.trim()}
                  className="btn btn-primary"
                  style={{ flex: 1, height: "36px", fontSize: "12px", fontWeight: "600" }}
                >
                  <Plus size={14} /> Oluştur
                </button>
                <button
                  onClick={() => setIsCreating(false)}
                  className="btn btn-ghost"
                  style={{ padding: "8px 12px", height: "36px" }}
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
            className="btn btn-ghost"
            style={{
              width: "100%",
              justifyContent: "center",
              height: "44px",
              gap: "8px",
              color: "var(--primary)",
              fontWeight: "600",
              borderRadius: "12px",
              fontSize: "13px",
              border: "1px dashed rgba(77, 171, 247, 0.3)",
              background: "rgba(77, 171, 247, 0.05)",
            }}
          >
            <Plus size={18} /> Yeni Etiket Ekle
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
