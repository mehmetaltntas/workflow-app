import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { Board } from "../types";
import { ArrowLeft, Search } from "lucide-react";

import { useBoardsQuery } from "../hooks/queries/useBoards";
import { useCreateBoard, useUpdateBoard, useDeleteBoard } from "../hooks/queries/useBoardMutations";
import { typography, spacing, radius, colors, cssVars, animation } from '../styles/tokens';
import BoardCard from "../components/BoardCard";
import CreateBoardModal from "../components/CreateBoardModal";
import BoardEditModal from "../components/BoardEditModal";
import { STATUS_COLORS, STATUS_LABELS, SLUG_TO_STATUS } from "../constants";
import { BoardsPageSkeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { NavbarViewSwitcher, type ViewMode } from "../components/ui/NavbarViewSwitcher";

const BoardStatusPage = () => {
  const { statusSlug } = useParams<{ statusSlug: string }>();
  const navigate = useNavigate();
  const { data: boards = [], isLoading: loading } = useBoardsQuery();
  const createBoardMutation = useCreateBoard();
  const updateBoardMutation = useUpdateBoard();
  const deleteBoardMutation = useDeleteBoard();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBoard, setEditingBoard] = useState<Board | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const statusKey = statusSlug ? SLUG_TO_STATUS[statusSlug] : undefined;
  const statusLabel = statusKey ? STATUS_LABELS[statusKey] : undefined;
  const statusColor = statusKey ? STATUS_COLORS[statusKey] : undefined;

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setIsVisible(true), 50);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  // Geçersiz status slug kontrolü
  if (!statusKey || !statusLabel) {
    return (
      <div style={{
        minHeight: "100vh",
        background: cssVars.bgBody,
        padding: spacing[10],
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <EmptyState
          icon={<Search size={36} strokeWidth={1.5} />}
          title="Durum bulunamadı"
          description="Geçersiz durum sayfası. Panolarım sayfasına dönün."
          action={{
            label: "Panolarıma Dön",
            onClick: () => navigate("/boards"),
          }}
        />
      </div>
    );
  }

  const filteredBoards = boards.filter(b => (b.status || "PLANLANDI") === statusKey);

  const handleCreateBoard = async (name: string, status: string, link?: string, description?: string, deadline?: string, category?: string) => {
    const formattedDeadline = deadline ? `${deadline}T23:59:59` : undefined;
    createBoardMutation.mutate(
      { name, status, link, description, deadline: formattedDeadline, category },
      {
        onSuccess: () => {
          setIsModalOpen(false);
        },
      }
    );
  };

  const handleEditBoard = async (data: { name: string; link?: string; description?: string; deadline?: string; status?: string; category?: string }) => {
    if (!editingBoard) return;
    const formattedDeadline = data.deadline ? `${data.deadline}T23:59:59` : undefined;
    updateBoardMutation.mutate(
      {
        boardId: editingBoard.id,
        data: {
          name: data.name,
          status: data.status || editingBoard.status || "PLANLANDI",
          link: data.link,
          description: data.description,
          deadline: formattedDeadline,
          category: data.category
        }
      },
      {
        onSuccess: () => {
          setIsEditModalOpen(false);
          setEditingBoard(null);
        },
      }
    );
  };

  const handleDeleteBoard = () => {
    if (editingBoard) {
      deleteBoardMutation.mutate(editingBoard.id);
      setIsEditModalOpen(false);
      setEditingBoard(null);
    }
  };

  const openEditModal = (board: Board) => {
    setEditingBoard(board);
    setIsEditModalOpen(true);
  };

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        background: cssVars.bgBody,
        padding: spacing[10],
      }}>
        <div style={{ marginBottom: spacing[8] }}>
          <div style={{ display: "flex", alignItems: "center", gap: spacing[3], marginBottom: spacing[6] }}>
            <div style={{
              width: 12, height: 12, borderRadius: radius.full,
              background: statusColor,
              boxShadow: `0 0 12px ${statusColor}50`
            }} />
            <h1 style={{
              fontSize: typography.fontSize["4xl"],
              fontWeight: typography.fontWeight.bold,
              color: cssVars.textMain,
              margin: 0
            }}>
              {statusLabel}
            </h1>
            <p style={{
              fontSize: typography.fontSize.md,
              color: cssVars.textMuted,
              margin: 0
            }}>
              Yükleniyor...
            </p>
          </div>
        </div>
        <BoardsPageSkeleton />
      </div>
    );
  }

  return (
    <div
      style={{
        background: cssVars.bgBody,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(10px)",
        transition: `all ${animation.duration.slow} ${animation.easing.spring}`,
      }}
    >
      <div style={{ padding: spacing[10] }}>
        {/* Header */}
        <div style={{ marginBottom: spacing[8] }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: spacing[4],
            marginBottom: spacing[6]
          }}>
            {/* Title Section */}
            <div style={{ display: "flex", alignItems: "center", gap: spacing[3] }}>
              {/* Geri butonu */}
              <button
                onClick={() => navigate("/boards")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 40,
                  height: 40,
                  borderRadius: radius.lg,
                  border: `1px solid ${cssVars.border}`,
                  background: cssVars.bgCard,
                  cursor: "pointer",
                  transition: `all ${animation.duration.normal}`,
                  color: cssVars.textMuted,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = cssVars.bgSecondary;
                  e.currentTarget.style.color = cssVars.textMain;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = cssVars.bgCard;
                  e.currentTarget.style.color = cssVars.textMuted;
                }}
              >
                <ArrowLeft size={20} />
              </button>

              <div style={{
                width: 12,
                height: 12,
                borderRadius: radius.full,
                background: statusColor,
                boxShadow: `0 0 12px ${statusColor}50`
              }} />

              <div>
                <h1 style={{
                  fontSize: typography.fontSize["4xl"],
                  fontWeight: typography.fontWeight.bold,
                  color: cssVars.textMain,
                  margin: 0,
                  letterSpacing: typography.letterSpacing.tight
                }}>
                  {statusLabel}
                </h1>
                <p style={{
                  fontSize: typography.fontSize.md,
                  color: cssVars.textMuted,
                  margin: 0
                }}>
                  {filteredBoards.length} pano
                </p>
              </div>
            </div>

            {/* Controls */}
            <div style={{ display: "flex", alignItems: "center", gap: spacing[3] }}>
              <NavbarViewSwitcher value={viewMode} onChange={setViewMode} />
            </div>
          </div>
        </div>

        {/* Empty State */}
        {filteredBoards.length === 0 && (
          <EmptyState
            icon={<Search size={36} strokeWidth={1.5} />}
            title={`"${statusLabel}" durumunda pano bulunamadı`}
            description="Bu durumda henüz pano bulunmuyor."
            action={{
              label: "Panolarıma Dön",
              onClick: () => navigate("/boards"),
            }}
          />
        )}

        {/* Cards Grid/List */}
        {filteredBoards.length > 0 && (
          <div
            style={{
              display: viewMode === 'list' ? "flex" : "grid",
              flexDirection: viewMode === 'list' ? "column" : undefined,
              gridTemplateColumns: viewMode === 'grid'
                ? "repeat(auto-fill, minmax(280px, 1fr))"
                : viewMode === 'compact'
                  ? "repeat(auto-fill, minmax(220px, 1fr))"
                  : undefined,
              gap: viewMode === 'list' ? spacing[2] : spacing[4],
            }}
          >
            {filteredBoards.map((board, cardIndex) => (
              <div
                key={board.id}
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? "translateY(0) scale(1)" : "translateY(20px) scale(0.98)",
                  transition: `all ${animation.duration.slow} ${animation.easing.spring}`,
                  transitionDelay: `${cardIndex * 50}ms`,
                }}
              >
                <BoardCard
                  board={board}
                  onClick={() => navigate(`/boards/${board.slug}`, { state: { from: `/boards/status/${statusSlug}` } })}
                  onEdit={() => openEditModal(board)}
                  onShowInfo={() => {
                    navigate(`/boards/info/${board.slug}`, { state: { from: `/boards/status/${statusSlug}` } });
                  }}
                  viewMode={viewMode === 'list' ? 'list' : 'grid'}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Yeni Pano Oluşturma Modalı */}
      {isModalOpen && (
        <CreateBoardModal
          key="create-new"
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onCreate={handleCreateBoard}
        />
      )}

      {/* Pano Düzenleme Modalı */}
      {isEditModalOpen && editingBoard && (
        <BoardEditModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingBoard(null);
          }}
          onSave={handleEditBoard}
          onDelete={handleDeleteBoard}
          initialData={{
            name: editingBoard.name,
            link: editingBoard.link,
            description: editingBoard.description,
            deadline: editingBoard.deadline ? editingBoard.deadline.split('T')[0] : undefined,
            status: editingBoard.status as "PLANLANDI" | "DEVAM_EDIYOR" | "TAMAMLANDI" | "DURDURULDU" | "BIRAKILDI",
            category: editingBoard.category
          }}
        />
      )}
    </div>
  );
};

export default BoardStatusPage;
