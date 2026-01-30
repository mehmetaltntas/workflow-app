import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import type { Board } from "../types";
import { ArrowLeft, Search, ChevronLeft, ChevronRight } from "lucide-react";

import { useBoardsQuery } from "../hooks/queries/useBoards";
import { useUpdateBoard, useDeleteBoard } from "../hooks/queries/useBoardMutations";
import { typography, spacing, radius, cssVars, animation } from '../styles/tokens';
import BoardCard from "../components/BoardCard";
import BoardEditModal from "../components/BoardEditModal";
import { STATUS_COLORS, STATUS_LABELS, SLUG_TO_STATUS } from "../constants";
import { BoardsPageSkeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { NavbarViewSwitcher, type ViewMode } from "../components/ui/NavbarViewSwitcher";
import { SortDropdown, type SortField, type SortDirection } from "../components/ui/SortDropdown";

const BOARDS_PER_PAGE = 25;

const BoardStatusPage = () => {
  const { statusSlug } = useParams<{ statusSlug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { data: boards = [], isLoading: loading } = useBoardsQuery();
  const updateBoardMutation = useUpdateBoard();
  const deleteBoardMutation = useDeleteBoard();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBoard, setEditingBoard] = useState<Board | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortField, setSortField] = useState<SortField>('alphabetic');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [boardTypeFilter, setBoardTypeFilter] = useState<'ALL' | 'INDIVIDUAL' | 'TEAM'>('ALL');

  const statusKey = statusSlug ? SLUG_TO_STATUS[statusSlug] : undefined;
  const statusLabel = statusKey ? STATUS_LABELS[statusKey] : undefined;
  const statusColor = statusKey ? STATUS_COLORS[statusKey] : undefined;

  const currentPage = Math.max(1, parseInt(searchParams.get("page") || "1", 10));

  useEffect(() => {
    if (!loading) {
      setIsVisible(false);
      const timer = setTimeout(() => setIsVisible(true), 50);
      return () => clearTimeout(timer);
    }
  }, [loading, currentPage]);

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

  const filteredBoards = boards.filter(b => {
    if ((b.status || "PLANLANDI") !== statusKey) return false;
    if (boardTypeFilter !== "ALL" && (b.boardType || "INDIVIDUAL") !== boardTypeFilter) return false;
    return true;
  });

  // Sıralama - tüm filtrelenmiş panolara uygulanır (sayfalama öncesi)
  const sortedBoards = useMemo(() => {
    const sorted = [...filteredBoards];
    sorted.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'alphabetic':
          comparison = a.name.localeCompare(b.name, 'tr');
          break;
        case 'date':
          comparison = a.id - b.id;
          break;
        case 'deadline':
          if (!a.deadline && !b.deadline) comparison = 0;
          else if (!a.deadline) comparison = 1;
          else if (!b.deadline) comparison = -1;
          else comparison = new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    return sorted;
  }, [filteredBoards, sortField, sortDirection]);

  // Sayfalama hesaplamaları
  const totalPages = Math.max(1, Math.ceil(sortedBoards.length / BOARDS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * BOARDS_PER_PAGE;
  const paginatedBoards = sortedBoards.slice(startIndex, startIndex + BOARDS_PER_PAGE);

  const goToPage = (page: number) => {
    if (page === 1) {
      setSearchParams({});
    } else {
      setSearchParams({ page: String(page) });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditBoard = async (data: { name: string; link?: string; description?: string; deadline?: string; status?: string; category?: string; boardType?: 'INDIVIDUAL' | 'TEAM' }) => {
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
          category: data.category,
          boardType: data.boardType
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
                  {totalPages > 1 && ` · Sayfa ${safePage} / ${totalPages}`}
                </p>
              </div>
            </div>

            {/* Controls */}
            <div style={{ display: "flex", alignItems: "center", gap: spacing[3] }}>
              {/* Board Type Filter */}
              <div style={{
                display: "flex",
                alignItems: "center",
                background: cssVars.bgSecondary,
                padding: 4,
                borderRadius: 12,
                border: `1px solid ${cssVars.border}`,
                gap: 2,
              }}>
                {([['ALL', 'Hepsi'], ['INDIVIDUAL', 'Bireysel'], ['TEAM', 'Ekip']] as const).map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => { setBoardTypeFilter(value); setSearchParams({}); }}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 8,
                      border: "none",
                      background: boardTypeFilter === value ? "var(--primary)" : "transparent",
                      color: boardTypeFilter === value ? "#fff" : cssVars.textMuted,
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: `all ${animation.duration.normal}`,
                      whiteSpace: "nowrap" as const,
                      boxShadow: boardTypeFilter === value ? "0 2px 8px rgba(77, 171, 247, 0.25)" : "none",
                    }}
                    onMouseEnter={(e) => {
                      if (boardTypeFilter !== value) {
                        e.currentTarget.style.color = cssVars.textMain;
                        e.currentTarget.style.background = cssVars.bgHover;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (boardTypeFilter !== value) {
                        e.currentTarget.style.color = cssVars.textMuted;
                        e.currentTarget.style.background = "transparent";
                      }
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <NavbarViewSwitcher value={viewMode} onChange={setViewMode} />
              <SortDropdown
                sortField={sortField}
                sortDirection={sortDirection}
                onSortFieldChange={(field) => { setSortField(field); setSearchParams({}); }}
                onSortDirectionChange={(dir) => { setSortDirection(dir); setSearchParams({}); }}
              />
            </div>
          </div>
        </div>

        {/* Empty State */}
        {filteredBoards.length === 0 && boardTypeFilter !== "ALL" && (
          <EmptyState
            icon={<Search size={36} strokeWidth={1.5} />}
            title="Bu filtrede pano bulunamadı"
            description="Seçili filtreye uygun pano bulunmuyor. Filtreyi değiştirmeyi deneyin."
            variant="filtered"
            action={{
              label: "Tüm Panoları Göster",
              onClick: () => setBoardTypeFilter("ALL"),
            }}
          />
        )}
        {filteredBoards.length === 0 && boardTypeFilter === "ALL" && (
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
        {paginatedBoards.length > 0 && (
          <div
            style={{
              display: viewMode === 'list' ? "flex" : "grid",
              flexDirection: viewMode === 'list' ? "column" : undefined,
              gridTemplateColumns: viewMode === 'grid'
                ? "repeat(auto-fill, minmax(280px, 1fr))"
                : undefined,
              gap: viewMode === 'list' ? spacing[2] : spacing[4],
            }}
          >
            {paginatedBoards.map((board, cardIndex) => (
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: spacing[2],
            marginTop: spacing[10],
            paddingTop: spacing[6],
            borderTop: `1px solid ${cssVars.border}`,
          }}>
            {/* Önceki */}
            <button
              onClick={() => goToPage(safePage - 1)}
              disabled={safePage <= 1}
              style={{
                display: "flex",
                alignItems: "center",
                gap: spacing[1],
                padding: `${spacing[2]} ${spacing[3]}`,
                borderRadius: radius.lg,
                border: `1px solid ${cssVars.border}`,
                background: safePage <= 1 ? cssVars.bgSecondary : cssVars.bgCard,
                color: safePage <= 1 ? cssVars.textMuted : cssVars.textMain,
                cursor: safePage <= 1 ? "not-allowed" : "pointer",
                transition: `all ${animation.duration.normal}`,
                fontWeight: typography.fontWeight.medium,
                fontSize: typography.fontSize.sm,
                opacity: safePage <= 1 ? 0.5 : 1,
              }}
              onMouseEnter={(e) => {
                if (safePage > 1) {
                  e.currentTarget.style.background = cssVars.bgSecondary;
                  e.currentTarget.style.borderColor = statusColor || cssVars.border;
                }
              }}
              onMouseLeave={(e) => {
                if (safePage > 1) {
                  e.currentTarget.style.background = cssVars.bgCard;
                  e.currentTarget.style.borderColor = cssVars.border;
                }
              }}
            >
              <ChevronLeft size={16} />
              Önceki
            </button>

            {/* Sayfa numaraları */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => goToPage(page)}
                style={{
                  width: 36,
                  height: 36,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: radius.lg,
                  border: page === safePage
                    ? `1px solid ${statusColor}`
                    : `1px solid ${cssVars.border}`,
                  background: page === safePage
                    ? `${statusColor}15`
                    : cssVars.bgCard,
                  color: page === safePage
                    ? statusColor
                    : cssVars.textMain,
                  cursor: "pointer",
                  transition: `all ${animation.duration.normal}`,
                  fontWeight: page === safePage
                    ? typography.fontWeight.bold
                    : typography.fontWeight.medium,
                  fontSize: typography.fontSize.sm,
                }}
                onMouseEnter={(e) => {
                  if (page !== safePage) {
                    e.currentTarget.style.background = cssVars.bgSecondary;
                    e.currentTarget.style.borderColor = statusColor || cssVars.border;
                  }
                }}
                onMouseLeave={(e) => {
                  if (page !== safePage) {
                    e.currentTarget.style.background = cssVars.bgCard;
                    e.currentTarget.style.borderColor = cssVars.border;
                  }
                }}
              >
                {page}
              </button>
            ))}

            {/* Sonraki */}
            <button
              onClick={() => goToPage(safePage + 1)}
              disabled={safePage >= totalPages}
              style={{
                display: "flex",
                alignItems: "center",
                gap: spacing[1],
                padding: `${spacing[2]} ${spacing[3]}`,
                borderRadius: radius.lg,
                border: `1px solid ${cssVars.border}`,
                background: safePage >= totalPages ? cssVars.bgSecondary : cssVars.bgCard,
                color: safePage >= totalPages ? cssVars.textMuted : cssVars.textMain,
                cursor: safePage >= totalPages ? "not-allowed" : "pointer",
                transition: `all ${animation.duration.normal}`,
                fontWeight: typography.fontWeight.medium,
                fontSize: typography.fontSize.sm,
                opacity: safePage >= totalPages ? 0.5 : 1,
              }}
              onMouseEnter={(e) => {
                if (safePage < totalPages) {
                  e.currentTarget.style.background = cssVars.bgSecondary;
                  e.currentTarget.style.borderColor = statusColor || cssVars.border;
                }
              }}
              onMouseLeave={(e) => {
                if (safePage < totalPages) {
                  e.currentTarget.style.background = cssVars.bgCard;
                  e.currentTarget.style.borderColor = cssVars.border;
                }
              }}
            >
              Sonraki
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

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
            category: editingBoard.category,
            boardType: editingBoard.boardType as "INDIVIDUAL" | "TEAM" | undefined
          }}
        />
      )}
    </div>
  );
};

export default BoardStatusPage;
