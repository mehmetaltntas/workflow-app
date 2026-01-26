import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type { Board } from "../types";
import { Layout, Plus, FolderOpen, Search, TrendingUp, CheckCircle2, Clock, PanelRightOpen, PanelRightClose } from "lucide-react";

import { useBoardsQuery } from "../hooks/queries/useBoards";
import { useCreateBoard, useUpdateBoard, useDeleteBoard } from "../hooks/queries/useBoardMutations";
import { useTheme } from "../contexts/ThemeContext";
import { getThemeColors } from "../utils/themeColors";
import { typography, spacing, radius, colors, cssVars, animation, shadows } from '../styles/tokens';
import BoardCard from "../components/BoardCard";
import CreateBoardModal from "../components/CreateBoardModal";
import BoardEditModal from "../components/BoardEditModal";
import { STATUS_COLORS, STATUS_LABELS } from "../constants";
import { BoardsPageSkeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { VerticalStatusFilter } from "../components/ui/VerticalStatusFilter";
import { ViewSwitcher, type ViewMode } from "../components/ui/ViewSwitcher";
import { BoardInfoPanel } from "../components/BoardInfoPanel";

const BoardsPage = () => {
  const navigate = useNavigate();
  const { data: boards = [], isLoading: loading } = useBoardsQuery();
  const createBoardMutation = useCreateBoard();
  const updateBoardMutation = useUpdateBoard();
  const deleteBoardMutation = useDeleteBoard();
  const { theme } = useTheme();
  const themeColors = getThemeColors(theme);
  const isLight = theme === 'light';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBoard, setEditingBoard] = useState<Board | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isVisible, setIsVisible] = useState(false);
  const [selectedInfoBoard, setSelectedInfoBoard] = useState<Board | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Animasyon için sayfa yüklendiğinde visible yap
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setIsVisible(true), 50);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  // Status bazlı sayıları hesapla
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.keys(STATUS_LABELS).forEach(key => {
      counts[key] = boards.filter(b => (b.status || "PLANLANDI") === key).length;
    });
    return counts;
  }, [boards]);

  // İstatistikler
  const stats = useMemo(() => {
    const total = boards.length;
    const completed = statusCounts["TAMAMLANDI"] || 0;
    const inProgress = statusCounts["DEVAM_EDIYOR"] || 0;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, inProgress, completionRate };
  }, [boards, statusCounts]);

  // Yeni pano oluşturma
  const handleCreateBoard = async (name: string, status: string, link?: string, description?: string, deadline?: string) => {
    const formattedDeadline = deadline ? `${deadline}T23:59:59` : undefined;
    createBoardMutation.mutate(
      { name, status, link, description, deadline: formattedDeadline },
      {
        onSuccess: () => {
          setIsModalOpen(false);
        },
      }
    );
  };

  // Pano düzenleme
  const handleEditBoard = async (data: { name: string; link?: string; description?: string; deadline?: string; status?: string }) => {
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
          deadline: formattedDeadline
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

  // Pano silme
  const handleDeleteBoard = () => {
    if (editingBoard) {
      deleteBoardMutation.mutate(editingBoard.id);
      setIsEditModalOpen(false);
      setEditingBoard(null);
    }
  };

  const openCreateModal = () => {
      setIsModalOpen(true);
  }

  const openEditModal = (board: Board) => {
      setEditingBoard(board);
      setIsEditModalOpen(true);
  }

  const filteredBoards = boards.filter(b => statusFilter === "ALL" || (b.status || "PLANLANDI") === statusFilter);

  // Loading State
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: cssVars.bgBody,
          padding: spacing[10],
        }}
      >
        {/* Header Skeleton */}
        <div style={{ marginBottom: spacing[8] }}>
          <div style={{ display: "flex", alignItems: "center", gap: spacing[3], marginBottom: spacing[6] }}>
            <div style={{
              width: 48, height: 48, borderRadius: radius.xl,
              background: `linear-gradient(135deg, ${colors.brand.primaryLight}, ${colors.brand.primary}20)`,
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <Layout color={colors.brand.primary} size={24} />
            </div>
            <div>
              <h1 style={{
                fontSize: typography.fontSize["4xl"],
                fontWeight: typography.fontWeight.bold,
                color: cssVars.textMain,
                margin: 0
              }}>
                Panolarım
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
        </div>

        <BoardsPageSkeleton />
      </div>
    );
  }

  // Empty State - Hiç pano yoksa
  if (boards.length === 0) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: cssVars.bgBody,
          padding: spacing[10],
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: spacing[8] }}>
          <div style={{ display: "flex", alignItems: "center", gap: spacing[3] }}>
            <div style={{
              width: 48, height: 48, borderRadius: radius.xl,
              background: `linear-gradient(135deg, ${colors.brand.primaryLight}, ${colors.brand.primary}20)`,
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <Layout color={colors.brand.primary} size={24} />
            </div>
            <div>
              <h1 style={{
                fontSize: typography.fontSize["4xl"],
                fontWeight: typography.fontWeight.bold,
                color: cssVars.textMain,
                margin: 0
              }}>
                Panolarım
              </h1>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <EmptyState
            icon={<FolderOpen size={48} strokeWidth={1.5} />}
            title="Henüz pano oluşturmadınız"
            description="İlk panonuzu oluşturarak projelerinizi organize etmeye başlayın. Panolar içinde listeler ve görevler oluşturabilirsiniz."
            action={{
              label: "İlk Panoyu Oluştur",
              onClick: openCreateModal,
            }}
          />
        </div>

        {isModalOpen && (
          <CreateBoardModal
            key="create-new"
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onCreate={handleCreateBoard}
          />
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        height: "100%",
        background: cssVars.bgBody,
        display: "flex",
        overflow: "hidden",
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(10px)",
        transition: `all ${animation.duration.slow} ${animation.easing.spring}`,
      }}
    >
      {/* Main Content - scrollable independently */}
      <div
        style={{
          flex: 1,
          padding: spacing[10],
          minWidth: 0,
          overflowY: "auto",
        }}
      >
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
              <div style={{
                width: 48, height: 48, borderRadius: radius.xl,
                background: `linear-gradient(135deg, ${colors.brand.primaryLight}, ${colors.brand.primary}20)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                border: `1px solid ${colors.brand.primary}30`
              }}>
                <Layout color={colors.brand.primary} size={24} />
              </div>
              <div>
                <h1 style={{
                  fontSize: typography.fontSize["4xl"],
                  fontWeight: typography.fontWeight.bold,
                  color: cssVars.textMain,
                  margin: 0,
                  letterSpacing: typography.letterSpacing.tight
                }}>
                  Panolarım
                </h1>
                <p style={{
                  fontSize: typography.fontSize.md,
                  color: cssVars.textMuted,
                  margin: 0
                }}>
                  {stats.total} pano · {stats.inProgress} aktif
                </p>
              </div>
            </div>

            {/* Stats Cards & Panel Toggle */}
            <div style={{ display: "flex", alignItems: "center", gap: spacing[3], flexWrap: "wrap" }}>
              {/* Completion Rate */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: spacing[2.5],
                padding: `${spacing[2.5]} ${spacing[4]}`,
                background: `linear-gradient(135deg, ${colors.semantic.success}15, ${colors.semantic.success}05)`,
                borderRadius: radius.xl,
                border: `1px solid ${colors.semantic.success}20`,
              }}>
                <TrendingUp size={18} color={colors.semantic.success} />
                <div>
                  <div style={{
                    fontSize: typography.fontSize.lg,
                    fontWeight: typography.fontWeight.bold,
                    color: colors.semantic.success
                  }}>
                    %{stats.completionRate}
                  </div>
                  <div style={{ fontSize: typography.fontSize.xs, color: cssVars.textMuted }}>
                    Tamamlanma
                  </div>
                </div>
              </div>

              {/* Completed */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: spacing[2.5],
                padding: `${spacing[2.5]} ${spacing[4]}`,
                background: `linear-gradient(135deg, ${colors.status.completed}15, ${colors.status.completed}05)`,
                borderRadius: radius.xl,
                border: `1px solid ${colors.status.completed}20`,
              }}>
                <CheckCircle2 size={18} color={colors.status.completed} />
                <div>
                  <div style={{
                    fontSize: typography.fontSize.lg,
                    fontWeight: typography.fontWeight.bold,
                    color: colors.status.completed
                  }}>
                    {stats.completed}
                  </div>
                  <div style={{ fontSize: typography.fontSize.xs, color: cssVars.textMuted }}>
                    Tamamlandı
                  </div>
                </div>
              </div>

              {/* In Progress */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: spacing[2.5],
                padding: `${spacing[2.5]} ${spacing[4]}`,
                background: `linear-gradient(135deg, ${colors.status.inProgress}15, ${colors.status.inProgress}05)`,
                borderRadius: radius.xl,
                border: `1px solid ${colors.status.inProgress}20`,
              }}>
                <Clock size={18} color={colors.status.inProgress} />
                <div>
                  <div style={{
                    fontSize: typography.fontSize.lg,
                    fontWeight: typography.fontWeight.bold,
                    color: colors.status.inProgress
                  }}>
                    {stats.inProgress}
                  </div>
                  <div style={{ fontSize: typography.fontSize.xs, color: cssVars.textMuted }}>
                    Devam Ediyor
                  </div>
                </div>
              </div>

              {/* Yeni Pano Button */}
              <button
                onClick={openCreateModal}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: spacing[2],
                  padding: `${spacing[2.5]} ${spacing[4]}`,
                  borderRadius: radius.lg,
                  border: "none",
                  background: `linear-gradient(135deg, ${colors.brand.primary}, ${colors.brand.primaryDark})`,
                  color: "#fff",
                  cursor: "pointer",
                  transition: `all ${animation.duration.normal}`,
                  fontWeight: typography.fontWeight.semibold,
                  fontSize: typography.fontSize.sm,
                  boxShadow: `0 4px 12px ${colors.brand.primary}30`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = `0 6px 16px ${colors.brand.primary}40`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = `0 4px 12px ${colors.brand.primary}30`;
                }}
              >
                <Plus size={18} strokeWidth={2.5} />
                Yeni Pano
              </button>

              {/* Panel Toggle Button */}
              <button
                onClick={() => setIsPanelOpen(!isPanelOpen)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: spacing[10],
                  height: spacing[10],
                  borderRadius: radius.lg,
                  border: `1px solid ${themeColors.borderDefault}`,
                  background: isPanelOpen ? colors.brand.primaryLight : themeColors.bgHover,
                  color: isPanelOpen ? colors.brand.primary : cssVars.textMuted,
                  cursor: "pointer",
                  transition: `all ${animation.duration.normal}`,
                }}
                title={isPanelOpen ? "Paneli Kapat" : "Paneli Aç"}
              >
                {isPanelOpen ? <PanelRightClose size={20} /> : <PanelRightOpen size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Filtered Empty State */}
        {filteredBoards.length === 0 && statusFilter !== "ALL" && (
          <EmptyState
            icon={<Search size={36} strokeWidth={1.5} />}
            title="Bu filtrede pano bulunamadı"
            description={`"${STATUS_LABELS[statusFilter]}" durumunda pano bulunmuyor. Filtreyi değiştirmeyi veya yeni pano oluşturmayı deneyin.`}
            variant="filtered"
            action={{
              label: "Tüm Panoları Göster",
              onClick: () => setStatusFilter("ALL"),
            }}
          />
        )}

        {/* Board Groups */}
        <div style={{ display: "flex", flexDirection: "column", gap: spacing[10] }}>
          {(statusFilter === "ALL" ? Object.keys(STATUS_LABELS) : [statusFilter]).map((statusKey, groupIndex) => {
             const boardsInStatus = filteredBoards.filter(b => (b.status || "PLANLANDI") === statusKey);

             if (boardsInStatus.length === 0) return null;

             return (
               <div
                 key={statusKey}
                 style={{
                   opacity: isVisible ? 1 : 0,
                   transform: isVisible ? "translateY(0)" : "translateY(20px)",
                   transition: `all ${animation.duration.slow} ${animation.easing.spring}`,
                   transitionDelay: `${groupIndex * 100}ms`,
                 }}
               >
                  {/* Group Header */}
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: spacing[3],
                    marginBottom: spacing[5],
                    paddingBottom: spacing[3],
                    borderBottom: `1px solid ${cssVars.border}`,
                  }}>
                      <div style={{
                        width: spacing[3],
                        height: spacing[3],
                        borderRadius: radius.full,
                        background: STATUS_COLORS[statusKey],
                        boxShadow: `0 0 12px ${STATUS_COLORS[statusKey]}50`
                      }}></div>
                      <h2 style={{
                          fontSize: typography.fontSize["2xl"],
                          fontWeight: typography.fontWeight.semibold,
                          color: cssVars.textMain,
                          margin: 0,
                      }}>
                          {STATUS_LABELS[statusKey]}
                      </h2>
                      <span style={{
                        fontSize: typography.fontSize.md,
                        color: cssVars.textMuted,
                        fontWeight: typography.fontWeight.medium,
                        padding: `${spacing[0.5]} ${spacing[2.5]}`,
                        background: cssVars.bgSecondary,
                        borderRadius: radius.full,
                      }}>
                        {boardsInStatus.length}
                      </span>
                  </div>

                  {/* Cards Grid/List */}
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
                      {boardsInStatus.map((board, cardIndex) => (
                          <div
                            key={board.id}
                            style={{
                              opacity: isVisible ? 1 : 0,
                              transform: isVisible ? "translateY(0) scale(1)" : "translateY(20px) scale(0.98)",
                              transition: `all ${animation.duration.slow} ${animation.easing.spring}`,
                              transitionDelay: `${(groupIndex * 100) + (cardIndex * 50)}ms`,
                            }}
                          >
                            <BoardCard
                                board={board}
                                onClick={() => navigate(`/boards/${board.slug}`)}
                                onEdit={() => openEditModal(board)}
                                onShowInfo={() => {
                                  setSelectedInfoBoard(board);
                                  if (!isPanelOpen) setIsPanelOpen(true);
                                }}
                                viewMode={viewMode === 'list' ? 'list' : 'grid'}
                            />
                          </div>
                      ))}
                  </div>
               </div>
             )
          })}
        </div>
      </div>

      {/* Right Panel */}
      <aside
        style={{
          width: isPanelOpen ? "340px" : "0px",
          minWidth: isPanelOpen ? "340px" : "0px",
          maxWidth: "340px",
          height: "100%",
          background: isLight ? colors.light.bg.card : colors.dark.bg.card,
          borderLeft: isPanelOpen ? `1px solid ${themeColors.borderDefault}` : "none",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          transition: `all ${animation.duration.slow} ${animation.easing.spring}`,
          opacity: isPanelOpen ? 1 : 0,
          boxShadow: isPanelOpen ? shadows.lg : "none",
        }}
      >
        {/* Panel Header with View Switcher and Filters */}
        <div
          style={{
            background: isLight ? colors.light.bg.elevated : colors.dark.bg.elevated,
          }}
        >
          {/* View Switcher */}
          <ViewSwitcher
            value={viewMode}
            onChange={setViewMode}
          />

          {/* Filters */}
          <div style={{ padding: spacing[4] }}>
            <VerticalStatusFilter
              value={statusFilter}
              onChange={setStatusFilter}
              counts={statusCounts}
              defaultExpanded={false}
            />
          </div>
        </div>

        {/* Board Info Section */}
        <div style={{ flex: 1, overflow: "auto" }}>
          <BoardInfoPanel
            board={selectedInfoBoard}
            onClose={() => setSelectedInfoBoard(null)}
          />
        </div>
      </aside>

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
                status: editingBoard.status as "PLANLANDI" | "DEVAM_EDIYOR" | "TAMAMLANDI" | "DURDURULDU" | "BIRAKILDI"
            }}
        />
      )}

      {/* Global animations */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default BoardsPage;
