import { useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useBoardsQuery } from "../hooks/queries/useBoards";
import { useUpdateBoard, useDeleteBoard } from "../hooks/queries/useBoardMutations";
import { boardService } from "../services/api";
import { useTheme } from "../contexts/ThemeContext";
import { getThemeColors } from "../utils/themeColors";
import {
  Home,
  Pin,
  PanelRightOpen,
  PanelRightClose,
  Sparkles,
  Clock,
} from "lucide-react";
import type { Board } from "../types";
import BoardCard from "../components/BoardCard";
import BoardEditModal from "../components/BoardEditModal";
import { BoardInfoPanel } from "../components/BoardInfoPanel";
import { ViewSwitcher, type ViewMode } from "../components/ui/ViewSwitcher";
import { SortingOptions, type SortField, type SortDirection } from "../components/ui/SortingOptions";
import { EmptyState } from "../components/ui/EmptyState";
import { typography, spacing, radius, colors, cssVars, animation, shadows } from '../styles/tokens';
import { useUIStore, MAX_PINNED_BOARDS } from '../stores/uiStore';

const HomePage = () => {
  const navigate = useNavigate();
  const { data: boards = [], isLoading: loading } = useBoardsQuery();
  const updateBoardMutation = useUpdateBoard();
  const deleteBoardMutation = useDeleteBoard();
  const { theme } = useTheme();
  const themeColors = getThemeColors(theme);
  const isLight = theme === 'light';

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBoard, setEditingBoard] = useState<Board | null>(null);
  const pinnedBoardIds = useUIStore((state) => state.pinnedBoardIds);
  const togglePinBoard = useUIStore((state) => state.togglePinBoard);
  const unpinBoard = useUIStore((state) => state.unpinBoard);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [selectedInfoBoard, setSelectedInfoBoard] = useState<Board | null>(null);
  const [detailedInfoBoard, setDetailedInfoBoard] = useState<Board | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortField, setSortField] = useState<SortField>('alphabetic');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [isVisible, setIsVisible] = useState(false);

  // Animasyon için
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setIsVisible(true), 50);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  // Bilgi paneli için pano detaylarını yükle
  useEffect(() => {
    if (!selectedInfoBoard) {
      setDetailedInfoBoard(null);
      return;
    }
    let cancelled = false;
    boardService.getBoardDetails(selectedInfoBoard.slug).then(board => {
      if (!cancelled) setDetailedInfoBoard(board);
    }).catch(() => {
      if (!cancelled) setDetailedInfoBoard(null);
    });
    return () => { cancelled = true; };
  }, [selectedInfoBoard]);

  // Sadece "DEVAM_EDIYOR" statüsündeki panoları filtrele
  const activeBoards = useMemo(() =>
    boards.filter((b) => b.status === "DEVAM_EDIYOR"),
    [boards]
  );

  // Pinned ve unpinned boards'u ayır
  const { pinnedBoards, unpinnedBoards } = useMemo(() => {
    const pinned = activeBoards.filter(b => pinnedBoardIds.includes(b.id));
    const unpinned = activeBoards.filter(b => !pinnedBoardIds.includes(b.id));

    // Pinned boards'u ID sırasına göre sırala (ekleme sırası)
    pinned.sort((a, b) => pinnedBoardIds.indexOf(a.id) - pinnedBoardIds.indexOf(b.id));

    return { pinnedBoards: pinned, unpinnedBoards: unpinned };
  }, [activeBoards, pinnedBoardIds]);

  // Sıralama fonksiyonu - sadece unpinned boards için
  const sortedUnpinnedBoards = useMemo(() => {
    const sorted = [...unpinnedBoards];

    sorted.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'alphabetic':
          comparison = a.name.localeCompare(b.name, 'tr');
          break;
        case 'date':
          // Board ID'yi oluşturma tarihi olarak kullan (ID daha büyük = daha yeni)
          comparison = a.id - b.id;
          break;
        case 'deadline':
          // Son tarihi olmayan panolar en sona
          if (!a.deadline && !b.deadline) comparison = 0;
          else if (!a.deadline) comparison = 1;
          else if (!b.deadline) comparison = -1;
          else comparison = new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [unpinnedBoards, sortField, sortDirection]);

  // İstatistikler
  const stats = useMemo(() => {
    const total = activeBoards.length;
    const pinned = pinnedBoards.length;
    return { total, pinned };
  }, [activeBoards, pinnedBoards]);

  const togglePin = useCallback((boardId: number) => {
    togglePinBoard(boardId);
  }, [togglePinBoard]);

  const canPin = pinnedBoardIds.length < MAX_PINNED_BOARDS;

  const handleEdit = (board: Board) => {
    setEditingBoard(board);
    setIsEditModalOpen(true);
  };

  const handleShowInfo = (board: Board) => {
    setSelectedInfoBoard(board);
    if (!isPanelOpen) setIsPanelOpen(true);
  };

  const handleSaveBoard = async (data: { name: string; link?: string; description?: string; deadline?: string; status?: string; category?: string }) => {
    if (editingBoard) {
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
    }
  };

  const handleDeleteBoard = () => {
    if (editingBoard) {
      // Pinned listesinden de kaldır
      unpinBoard(editingBoard.id);
      deleteBoardMutation.mutate(editingBoard.id);
      setIsEditModalOpen(false);
      setEditingBoard(null);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          height: "calc(100vh - 64px)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: cssVars.textMuted,
        }}
      >
        <h2>Yükleniyor...</h2>
      </div>
    );
  }

  // Board kartı render fonksiyonu
  const renderBoardCard = (board: Board, isPinned: boolean, index: number, groupIndex: number) => {
    return (
      <div
        key={board.id}
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? "translateY(0) scale(1)" : "translateY(20px) scale(0.98)",
          transition: `all ${animation.duration.slow} ${animation.easing.spring}`,
          transitionDelay: `${(groupIndex * 100) + (index * 50)}ms`,
        }}
      >
        <BoardCard
          board={board}
          onClick={() => navigate(`/boards/${board.slug}`, { state: { from: '/home' } })}
          onEdit={() => handleEdit(board)}
          onShowInfo={() => handleShowInfo(board)}
          viewMode={viewMode === 'list' ? 'list' : 'grid'}
        />
      </div>
    );
  };

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
                <Home color={colors.brand.primary} size={24} />
              </div>
              <div>
                <h1 style={{
                  fontSize: typography.fontSize["4xl"],
                  fontWeight: typography.fontWeight.bold,
                  color: cssVars.textMain,
                  margin: 0,
                  letterSpacing: typography.letterSpacing.tight,
                  display: "flex",
                  alignItems: "center",
                  gap: spacing[2],
                }}>
                  Hoş Geldin!
                  <Sparkles size={24} color={colors.semantic.warning} />
                </h1>
                <p style={{
                  fontSize: typography.fontSize.md,
                  color: cssVars.textMuted,
                  margin: 0
                }}>
                  İşte üzerinde çalıştığın aktif projeler
                </p>
              </div>
            </div>

            {/* Stats Cards & Panel Toggle */}
            <div style={{ display: "flex", alignItems: "center", gap: spacing[3], flexWrap: "wrap" }}>
              {/* Total Active */}
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
                    {stats.total}
                  </div>
                  <div style={{ fontSize: typography.fontSize.xs, color: cssVars.textMuted }}>
                    Aktif Proje
                  </div>
                </div>
              </div>

              {/* Pinned Count */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: spacing[2.5],
                padding: `${spacing[2.5]} ${spacing[4]}`,
                background: isLight
                  ? `linear-gradient(135deg, ${colors.brand.primary}12, ${colors.brand.primary}05)`
                  : `linear-gradient(135deg, ${colors.semantic.warning}15, ${colors.semantic.warning}05)`,
                borderRadius: radius.xl,
                border: isLight
                  ? `1px solid ${colors.brand.primary}25`
                  : `1px solid ${colors.semantic.warning}20`,
                boxShadow: isLight ? `0 2px 8px ${colors.brand.primary}10` : 'none',
              }}>
                <Pin size={18} color={isLight ? colors.brand.primary : colors.semantic.warning} />
                <div>
                  <div style={{
                    fontSize: typography.fontSize.lg,
                    fontWeight: typography.fontWeight.bold,
                    color: isLight ? colors.brand.primary : colors.semantic.warning
                  }}>
                    {stats.pinned}/{MAX_PINNED_BOARDS}
                  </div>
                  <div style={{ fontSize: typography.fontSize.xs, color: cssVars.textMuted }}>
                    Sabitlenmiş
                  </div>
                </div>
              </div>

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

        {/* Content */}
        {activeBoards.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: spacing[10] }}>
            {/* Pinned Boards Section */}
            {pinnedBoards.length > 0 && (
              <div
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? "translateY(0)" : "translateY(20px)",
                  transition: `all ${animation.duration.slow} ${animation.easing.spring}`,
                }}
              >
                {/* Section Header */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: spacing[3],
                  marginBottom: spacing[5],
                  paddingBottom: spacing[3],
                  borderBottom: `1px solid ${cssVars.border}`,
                }}>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: spacing[8],
                    height: spacing[8],
                    borderRadius: radius.lg,
                    background: isLight
                      ? `linear-gradient(135deg, ${colors.brand.primary}20, ${colors.brand.primary}10)`
                      : `linear-gradient(135deg, ${colors.semantic.warning}25, ${colors.semantic.warning}15)`,
                    border: isLight
                      ? `1px solid ${colors.brand.primary}30`
                      : `1px solid ${colors.semantic.warning}30`,
                    boxShadow: isLight ? `0 2px 8px ${colors.brand.primary}15` : 'none',
                  }}>
                    <Pin size={16} color={isLight ? colors.brand.primary : colors.semantic.warning} />
                  </div>
                  <h2 style={{
                    fontSize: typography.fontSize["2xl"],
                    fontWeight: typography.fontWeight.semibold,
                    color: cssVars.textMain,
                    margin: 0,
                  }}>
                    Sabitlenmiş Panolar
                  </h2>
                  <span style={{
                    fontSize: typography.fontSize.md,
                    color: isLight ? colors.brand.primary : colors.semantic.warning,
                    fontWeight: typography.fontWeight.medium,
                    padding: `${spacing[0.5]} ${spacing[2.5]}`,
                    background: isLight
                      ? `${colors.brand.primary}15`
                      : `${colors.semantic.warning}15`,
                    borderRadius: radius.full,
                  }}>
                    {pinnedBoards.length}
                  </span>
                </div>

                {/* Pinned Cards */}
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
                  {pinnedBoards.map((board, index) => renderBoardCard(board, true, index, 0))}
                </div>
              </div>
            )}

            {/* Other Active Boards Section */}
            {sortedUnpinnedBoards.length > 0 && (
              <div
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? "translateY(0)" : "translateY(20px)",
                  transition: `all ${animation.duration.slow} ${animation.easing.spring}`,
                  transitionDelay: pinnedBoards.length > 0 ? "100ms" : "0ms",
                }}
              >
                {/* Section Header */}
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
                    background: colors.status.inProgress,
                    boxShadow: `0 0 12px ${colors.status.inProgress}50`
                  }} />
                  <h2 style={{
                    fontSize: typography.fontSize["2xl"],
                    fontWeight: typography.fontWeight.semibold,
                    color: cssVars.textMain,
                    margin: 0,
                  }}>
                    {pinnedBoards.length > 0 ? "Diğer Aktif Panolar" : "Aktif Panolar"}
                  </h2>
                  <span style={{
                    fontSize: typography.fontSize.md,
                    color: cssVars.textMuted,
                    fontWeight: typography.fontWeight.medium,
                    padding: `${spacing[0.5]} ${spacing[2.5]}`,
                    background: cssVars.bgSecondary,
                    borderRadius: radius.full,
                  }}>
                    {sortedUnpinnedBoards.length}
                  </span>
                </div>

                {/* Cards */}
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
                  {sortedUnpinnedBoards.map((board, index) => renderBoardCard(board, false, index, 1))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <EmptyState
            icon={<Home size={48} strokeWidth={1.5} />}
            title="Şu an aktif bir projen yok"
            description='Görünüşe göre şu anda "Devam Ediyor" statüsünde bir panon bulunmuyor. Yeni bir işe başlamak için panolarım sayfasına göz atabilirsin.'
            action={{
              label: "Panolarım'a Git",
              onClick: () => navigate("/boards"),
            }}
          />
        )}
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
        {/* Panel Header with View Switcher and Sorting */}
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

          {/* Sorting Options */}
          <SortingOptions
            sortField={sortField}
            sortDirection={sortDirection}
            onSortFieldChange={setSortField}
            onSortDirectionChange={setSortDirection}
          />
        </div>

        {/* Board Info Section */}
        <div style={{ flex: 1, overflow: "auto" }}>
          <BoardInfoPanel
            board={detailedInfoBoard}
            onClose={() => setSelectedInfoBoard(null)}
            onTogglePin={selectedInfoBoard ? () => togglePin(selectedInfoBoard.id) : undefined}
            isPinned={selectedInfoBoard ? pinnedBoardIds.includes(selectedInfoBoard.id) : false}
            canPin={canPin}
          />
        </div>
      </aside>

      {/* Pano Düzenleme Modalı */}
      {isEditModalOpen && editingBoard && (
        <BoardEditModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingBoard(null);
          }}
          onSave={handleSaveBoard}
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

export default HomePage;
