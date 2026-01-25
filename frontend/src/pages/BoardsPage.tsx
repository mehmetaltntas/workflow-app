import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type { Board } from "../types";
import toast from "react-hot-toast";
import { Layout, Plus, FolderOpen, Search, TrendingUp, CheckCircle2, Clock } from "lucide-react";

import { useBoards } from "../hooks/useBoards";
import { typography, spacing, radius, colors, cssVars, animation } from '../styles/tokens';
import BoardCard from "../components/BoardCard";
import CreateBoardModal from "../components/CreateBoardModal";
import { DeleteConfirmation } from "../components/DeleteConfirmation";
import { STATUS_COLORS, STATUS_LABELS } from "../constants";
import { BoardsPageSkeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { StatusFilterTabs } from "../components/ui/StatusFilterTabs";

const BoardsPage = () => {
  const navigate = useNavigate();
  const { boards, loading, createBoard, updateBoard, deleteBoard, updateBoardStatus, userId } = useBoards();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBoard, setEditingBoard] = useState<Board | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [deleteBoardId, setDeleteBoardId] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Animasyon için sayfa yüklendiğinde visible yap
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setIsVisible(true), 50);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  useEffect(() => {
    if (!userId) {
      toast.error("Oturum süresi dolmuş");
      navigate("/login");
    }
  }, [userId, navigate]);

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

  // Hem Ekleme Hem Güncelleme için ortak fonksiyon
  const handleSaveBoard = async (name: string, status: string, link?: string, description?: string, deadline?: string) => {
    const formattedDeadline = deadline ? `${deadline}T23:59:59` : undefined;

    if (editingBoard) {
        const success = await updateBoard(editingBoard.id, {
            name,
            status,
            link,
            description,
            deadline: formattedDeadline
        });
        if (success) {
            setIsModalOpen(false);
            setEditingBoard(null);
        }
    } else {
        const success = await createBoard(name, status, link, description, formattedDeadline);
        if (success) {
            setIsModalOpen(false);
        }
    }
  };

  const handleDeleteBoard = async () => {
      if (deleteBoardId) {
          await deleteBoard(deleteBoardId);
          setDeleteBoardId(null);
      }
  }

  const openCreateModal = () => {
      setEditingBoard(null);
      setIsModalOpen(true);
  }

  const openEditModal = (board: Board) => {
      setEditingBoard(board);
      setIsModalOpen(true);
  }

  const handleStatusChange = async (board: Board, newStatus: string) => {
    await updateBoardStatus(board.id, newStatus);
  };

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
            onCreate={handleSaveBoard}
          />
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: cssVars.bgBody,
        padding: spacing[10],
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(10px)",
        transition: `all ${animation.duration.slow} ${animation.easing.spring}`,
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

          {/* Stats Cards */}
          <div style={{ display: "flex", gap: spacing[3], flexWrap: "wrap" }}>
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
          </div>
        </div>

        {/* Filter Tabs */}
        <StatusFilterTabs
          value={statusFilter}
          onChange={setStatusFilter}
          counts={statusCounts}
        />
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

                {/* Cards Grid */}
                <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                      gap: spacing[5],
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
                              onStatusChange={handleStatusChange}
                              onEdit={() => openEditModal(board)}
                              onDelete={() => setDeleteBoardId(board.id)}
                          />
                        </div>
                    ))}
                </div>
             </div>
           )
        })}
      </div>

      <DeleteConfirmation
        isOpen={!!deleteBoardId}
        title="Panoyu silmek istiyor musun?"
        message="Bu pano ve içindeki tüm listeler/görevler kalıcı olarak silinecek."
        onConfirm={handleDeleteBoard}
        onCancel={() => setDeleteBoardId(null)}
        confirmText="Evet, Sil"
        variant="danger"
        autoCloseDelay={6000}
      />

      {/* Floating Action Button */}
      <button
        onClick={openCreateModal}
        style={{
            position: "fixed",
            bottom: spacing[10],
            right: spacing[10],
            background: `linear-gradient(135deg, ${colors.brand.primary}, ${colors.brand.primaryDark})`,
            color: "#fff",
            border: "none",
            borderRadius: radius.full,
            width: "60px",
            height: "60px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 8px 32px ${colors.brand.primary}40`,
            cursor: "pointer",
            transition: `all ${animation.duration.normal} ${animation.easing.spring}`,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.1) translateY(-2px)";
          e.currentTarget.style.boxShadow = `0 12px 40px ${colors.brand.primary}50`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1) translateY(0)";
          e.currentTarget.style.boxShadow = `0 8px 32px ${colors.brand.primary}40`;
        }}
        title="Yeni Pano Oluştur"
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>

      {isModalOpen && (
        <CreateBoardModal
            key={editingBoard ? `edit-${editingBoard.id}` : 'create-new'}
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onCreate={handleSaveBoard}
            initialData={editingBoard ? {
                name: editingBoard.name,
                status: editingBoard.status || "PLANLANDI",
                link: editingBoard.link,
                description: editingBoard.description,
                deadline: editingBoard.deadline ? editingBoard.deadline.split('T')[0] : undefined
            } : undefined}
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
