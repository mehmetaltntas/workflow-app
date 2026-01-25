import { useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useBoards } from "../hooks/useBoards";
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
import CreateBoardModal from "../components/CreateBoardModal";
import { ConfirmationModal } from "../components/ConfirmationModal";
import { BoardInfoPanel } from "../components/BoardInfoPanel";
import { ViewSwitcher, type ViewMode } from "../components/ui/ViewSwitcher";
import { SortingOptions, type SortField, type SortDirection } from "../components/ui/SortingOptions";
import { EmptyState } from "../components/ui/EmptyState";
import { typography, spacing, radius, colors, cssVars, animation, shadows } from '../styles/tokens';

const PINNED_BOARDS_KEY = 'workflow_pinned_boards';
const MAX_PINNED_BOARDS = 3;

const HomePage = () => {
  const navigate = useNavigate();
  const { boards, loading, updateBoardStatus, updateBoard, deleteBoard } = useBoards();
  const { theme } = useTheme();
  const themeColors = getThemeColors(theme);
  const isLight = theme === 'light';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBoard, setEditingBoard] = useState<Board | null>(null);
  const [deleteBoardId, setDeleteBoardId] = useState<number | null>(null);
  const [pinnedBoardIds, setPinnedBoardIds] = useState<number[]>(() => {
    const stored = localStorage.getItem(PINNED_BOARDS_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch {
        // Invalid JSON, ignore
      }
    }
    return [];
  });
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [selectedInfoBoard, setSelectedInfoBoard] = useState<Board | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortField, setSortField] = useState<SortField>('alphabetic');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [isVisible, setIsVisible] = useState(false);

  // Pinned boards'u localStorage'a kaydet
  useEffect(() => {
    localStorage.setItem(PINNED_BOARDS_KEY, JSON.stringify(pinnedBoardIds));
  }, [pinnedBoardIds]);

  // Animasyon için
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setIsVisible(true), 50);
      return () => clearTimeout(timer);
    }
  }, [loading]);

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
    setPinnedBoardIds(prev => {
      if (prev.includes(boardId)) {
        return prev.filter(id => id !== boardId);
      } else {
        if (prev.length >= MAX_PINNED_BOARDS) {
          return prev;
        }
        return [...prev, boardId];
      }
    });
  }, []);

  const canPin = pinnedBoardIds.length < MAX_PINNED_BOARDS;

  const handleStatusChange = async (board: Board, newStatus: string) => {
    await updateBoardStatus(board.id, newStatus);
  };

  const handleEdit = (board: Board) => {
    setEditingBoard(board);
    setIsModalOpen(true);
  };

  const handleDelete = (boardId: number) => {
    setDeleteBoardId(boardId);
  };

  const handleShowInfo = (board: Board) => {
    setSelectedInfoBoard(board);
    if (!isPanelOpen) setIsPanelOpen(true);
  };

  const handleSaveBoard = async (name: string, status: string, link?: string, description?: string, deadline?: string) => {
    if (editingBoard) {
      const formattedDeadline = deadline ? `${deadline}T23:59:59` : undefined;
      const success = await updateBoard(editingBoard.id, { name, status, link, description, deadline: formattedDeadline });
      if (success) {
        setIsModalOpen(false);
        setEditingBoard(null);
      }
    }
  };

  const confirmDelete = async () => {
    if (deleteBoardId) {
      // Pinned listesinden de kaldır
      setPinnedBoardIds(prev => prev.filter(id => id !== deleteBoardId));
      await deleteBoard(deleteBoardId);
      setDeleteBoardId(null);
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
          onClick={() => navigate(`/boards/${board.slug}`)}
          onStatusChange={handleStatusChange}
          onEdit={() => handleEdit(board)}
          onDelete={() => handleDelete(board.id)}
          onShowInfo={() => handleShowInfo(board)}
          onTogglePin={() => togglePin(board.id)}
          isPinned={isPinned}
          canPin={canPin}
          viewMode={viewMode === 'list' ? 'list' : 'grid'}
        />
      </div>
    );
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: cssVars.bgBody,
        display: "flex",
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(10px)",
        transition: `all ${animation.duration.slow} ${animation.easing.spring}`,
      }}
    >
      {/* Main Content */}
      <div
        style={{
          flex: 1,
          padding: spacing[10],
          transition: `margin-right ${animation.duration.slow} ${animation.easing.spring}`,
          marginRight: isPanelOpen ? "340px" : 0,
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
                background: `linear-gradient(135deg, ${colors.semantic.warning}15, ${colors.semantic.warning}05)`,
                borderRadius: radius.xl,
                border: `1px solid ${colors.semantic.warning}20`,
              }}>
                <Pin size={18} color={colors.semantic.warning} />
                <div>
                  <div style={{
                    fontSize: typography.fontSize.lg,
                    fontWeight: typography.fontWeight.bold,
                    color: colors.semantic.warning
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
                    background: `linear-gradient(135deg, ${colors.semantic.warning}25, ${colors.semantic.warning}15)`,
                    border: `1px solid ${colors.semantic.warning}30`,
                  }}>
                    <Pin size={16} color={colors.semantic.warning} />
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
                    color: cssVars.textMuted,
                    fontWeight: typography.fontWeight.medium,
                    padding: `${spacing[0.5]} ${spacing[2.5]}`,
                    background: cssVars.bgSecondary,
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
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: "340px",
          height: "100vh",
          background: isLight ? colors.light.bg.card : colors.dark.bg.card,
          borderLeft: `1px solid ${themeColors.borderDefault}`,
          display: "flex",
          flexDirection: "column",
          transform: isPanelOpen ? "translateX(0)" : "translateX(100%)",
          transition: `transform ${animation.duration.slow} ${animation.easing.spring}`,
          zIndex: 10,
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
            board={selectedInfoBoard}
            onClose={() => setSelectedInfoBoard(null)}
          />
        </div>
      </div>

      <ConfirmationModal
        isOpen={!!deleteBoardId}
        title="Panoyu Sil?"
        message="Bu panoyu ve içindeki tüm listeleri/görevleri silmek istediğine emin misin? Bu işlem geri alınamaz."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteBoardId(null)}
        confirmText="Evet, Sil"
        variant="danger"
      />

      {isModalOpen && (
        <CreateBoardModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingBoard(null);
          }}
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
    </div>
  );
};

export default HomePage;
