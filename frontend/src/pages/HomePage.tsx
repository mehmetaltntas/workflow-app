import { useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { useBoardsQuery } from "../hooks/queries/useBoards";
import { useUpdateBoard, useDeleteBoard } from "../hooks/queries/useBoardMutations";
import { useAssignedBoardsQuery } from "../hooks/queries/useAssignedBoards";
import { useTheme } from "../contexts/ThemeContext";
import {
  Home,
  Pin,
  Sparkles,
  Clock,
  ArrowRight,
  Users,
} from "lucide-react";
import type { Board } from "../types";
import BoardCard from "../components/BoardCard";
import BoardEditModal from "../components/BoardEditModal";
import { EmptyState } from "../components/ui/EmptyState";
import { NavbarViewSwitcher, type ViewMode } from "../components/ui/NavbarViewSwitcher";
import { SortDropdown, type SortField, type SortDirection } from "../components/ui/SortDropdown";
import { colors } from '../styles/tokens';
import { useUIStore, MAX_PINNED_BOARDS } from '../stores/uiStore';
import "./HomePage.css";

const HomePage = () => {
  const navigate = useNavigate();
  const { data: boards = [], isLoading: loading } = useBoardsQuery();
  const { data: assignedBoards = [], isLoading: assignedLoading } = useAssignedBoardsQuery();
  const updateBoardMutation = useUpdateBoard();
  const deleteBoardMutation = useDeleteBoard();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBoard, setEditingBoard] = useState<Board | null>(null);
  const pinnedBoardIds = useUIStore((state) => state.pinnedBoardIds);
  const unpinBoard = useUIStore((state) => state.unpinBoard);
  const togglePinBoard = useUIStore((state) => state.togglePinBoard);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortField, setSortField] = useState<SortField>('alphabetic');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [isVisible, setIsVisible] = useState(false);

  // Animasyon icin
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setIsVisible(true), 50);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  // Sadece "DEVAM_EDIYOR" statusundeki panolari filtrele
  const activeBoards = useMemo(() =>
    boards.filter((b) => b.status === "DEVAM_EDIYOR"),
    [boards]
  );

  // Atandigim panolardan sadece "DEVAM_EDIYOR" olanlari filtrele
  const activeAssignedBoards = useMemo(() =>
    assignedBoards.filter((b) => b.status === "DEVAM_EDIYOR"),
    [assignedBoards]
  );

  // Pinned ve unpinned boards'u ayir
  const { pinnedBoards, unpinnedBoards } = useMemo(() => {
    const pinned = activeBoards.filter(b => pinnedBoardIds.includes(b.id));
    const unpinned = activeBoards.filter(b => !pinnedBoardIds.includes(b.id));

    pinned.sort((a, b) => pinnedBoardIds.indexOf(a.id) - pinnedBoardIds.indexOf(b.id));

    return { pinnedBoards: pinned, unpinnedBoards: unpinned };
  }, [activeBoards, pinnedBoardIds]);

  // Siralama fonksiyonu
  const sortedUnpinnedBoards = useMemo(() => {
    const sorted = [...unpinnedBoards];

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
  }, [unpinnedBoards, sortField, sortDirection]);

  // Istatistikler
  const stats = useMemo(() => {
    const total = activeBoards.length;
    const pinned = pinnedBoards.length;
    return { total, pinned };
  }, [activeBoards, pinnedBoards]);

  const handleEdit = (board: Board) => {
    setEditingBoard(board);
    setIsEditModalOpen(true);
  };

  const handleShowInfo = (board: Board) => {
    navigate(`/boards/info/${board.slug}`, { state: { from: '/home' } });
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
      unpinBoard(editingBoard.id);
      deleteBoardMutation.mutate(editingBoard.id);
      setIsEditModalOpen(false);
      setEditingBoard(null);
    }
  };

  if (loading || assignedLoading) {
    return (
      <div className="home-page__loading">
        <h2>Yükleniyor...</h2>
      </div>
    );
  }

  // Board karti render fonksiyonu
  const renderBoardCard = (board: Board, _isPinned: boolean, index: number, groupIndex: number) => {
    const boardIsPinned = pinnedBoardIds.includes(board.id);
    const boardCanPin = pinnedBoardIds.length < MAX_PINNED_BOARDS;
    return (
      <div
        key={board.id}
        className={`home-page__card-wrapper ${isVisible ? "home-page__card-wrapper--visible" : "home-page__card-wrapper--hidden"}`}
        style={{ transitionDelay: `${(groupIndex * 100) + (index * 50)}ms` }}
      >
        <BoardCard
          board={board}
          onClick={() => navigate(`/boards/${board.slug}`, { state: { from: '/home' } })}
          onEdit={() => handleEdit(board)}
          onShowInfo={() => handleShowInfo(board)}
          onTogglePin={() => togglePinBoard(board.id)}
          isPinned={boardIsPinned}
          canPin={boardCanPin}
          viewMode={viewMode === 'list' ? 'list' : 'grid'}
        />
      </div>
    );
  };

  return (
    <div className={`home-page ${isVisible ? "home-page--visible" : "home-page--hidden"}`}>
      {/* Main Content */}
      <div className="home-page__content">
        {/* Header */}
        <div className="home-page__header">
          <div className="home-page__header-top">
            {/* Title Section */}
            <div className="home-page__title-section">
              <div className="home-page__title-icon">
                <Home color={colors.brand.primary} size={24} />
              </div>
              <div>
                <h1 className="home-page__title">
                  Hoş Geldin!
                  <Sparkles size={24} color={colors.semantic.warning} />
                </h1>
                <p className="home-page__subtitle">
                  İşte üzerinde çalıştığın aktif projeler
                </p>
              </div>
            </div>

            {/* Stats Cards & Panel Toggle */}
            <div className="home-page__controls">
              {/* Total Active */}
              <div className="home-page__stat-card home-page__stat-card--active">
                <Clock size={18} color={colors.status.inProgress} />
                <div>
                  <div className="home-page__stat-value home-page__stat-value--active">
                    {stats.total}
                  </div>
                  <div className="home-page__stat-label">Aktif Proje</div>
                </div>
              </div>

              {/* Pinned Count */}
              <div className="home-page__stat-card home-page__stat-card--pinned">
                <Pin size={18} color={isLight ? colors.brand.primary : colors.semantic.warning} />
                <div>
                  <div className="home-page__stat-value home-page__stat-value--pinned">
                    {stats.pinned}/{MAX_PINNED_BOARDS}
                  </div>
                  <div className="home-page__stat-label">Sabitlenmiş</div>
                </div>
              </div>

              {/* View & Sort Controls */}
              <NavbarViewSwitcher value={viewMode} onChange={setViewMode} />
              <SortDropdown
                sortField={sortField}
                sortDirection={sortDirection}
                onSortFieldChange={setSortField}
                onSortDirectionChange={setSortDirection}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        {activeBoards.length > 0 || activeAssignedBoards.length > 0 ? (
          <div className="home-page__sections">
            {/* Pinned Boards Section */}
            {pinnedBoards.length > 0 && (
              <div className={`home-page__section ${isVisible ? "home-page__section--visible" : "home-page__section--hidden"}`}>
                {/* Section Header */}
                <div className="home-page__section-header">
                  <div className="home-page__section-icon home-page__section-icon--pinned">
                    <Pin size={16} color={isLight ? colors.brand.primary : colors.semantic.warning} />
                  </div>
                  <h2 className="home-page__section-title">Sabitlenmiş Panolar</h2>
                  <span className="home-page__section-count home-page__section-count--pinned">
                    {pinnedBoards.length}
                  </span>
                </div>

                {/* Pinned Cards */}
                <div className={viewMode === 'list' ? "home-page__card-list" : "home-page__card-grid"}>
                  {pinnedBoards.map((board, index) => renderBoardCard(board, true, index, 0))}
                </div>
              </div>
            )}

            {/* Other Active Boards Section */}
            {sortedUnpinnedBoards.length > 0 && (
              <div
                className={`home-page__section ${isVisible ? "home-page__section--visible" : "home-page__section--hidden"}`}
                style={{ transitionDelay: pinnedBoards.length > 0 ? "100ms" : "0ms" }}
              >
                {/* Section Header */}
                <div className="home-page__section-header">
                  <div className="home-page__section-dot" />
                  <h2 className="home-page__section-title">
                    {pinnedBoards.length > 0 ? "Diğer Aktif Panolar" : "Aktif Panolar"}
                  </h2>
                  <span className="home-page__section-count home-page__section-count--default">
                    {sortedUnpinnedBoards.length}
                  </span>

                  {/* Tumunu Gor linki */}
                  {sortedUnpinnedBoards.length >= 15 && (
                    <button
                      onClick={() => navigate('/boards/status/devam-ediyor')}
                      className="home-page__view-all-btn"
                    >
                      Tümünü Gör ({sortedUnpinnedBoards.length})
                      <ArrowRight size={16} />
                    </button>
                  )}
                </div>

                {/* Cards */}
                <div className={viewMode === 'list' ? "home-page__card-list" : "home-page__card-grid"}>
                  {sortedUnpinnedBoards.map((board, index) => renderBoardCard(board, false, index, 1))}
                </div>
              </div>
            )}

            {/* Assigned Boards Section */}
            {activeAssignedBoards.length > 0 && (
              <div
                className={`home-page__section ${isVisible ? "home-page__section--visible" : "home-page__section--hidden"}`}
                style={{ transitionDelay: (pinnedBoards.length > 0 ? 100 : 0) + (sortedUnpinnedBoards.length > 0 ? 100 : 0) + "ms" }}
              >
                {/* Section Header */}
                <div className="home-page__section-header">
                  <div className="home-page__section-icon home-page__section-icon--assigned">
                    <Users size={16} color={colors.assigned.primary} />
                  </div>
                  <h2 className="home-page__section-title">Atandığım Panolar</h2>
                  <span className="home-page__section-count home-page__section-count--assigned">
                    {activeAssignedBoards.length}
                  </span>

                  {/* Daha Fazlasi linki - 5'ten fazlaysa goster */}
                  {activeAssignedBoards.length > 5 && (
                    <button
                      onClick={() => navigate('/assigned-boards')}
                      className="home-page__view-all-btn home-page__view-all-btn--assigned"
                    >
                      Tümünü Gör ({activeAssignedBoards.length})
                      <ArrowRight size={16} />
                    </button>
                  )}
                </div>

                {/* Assigned Cards - max 5 goster */}
                <div className={viewMode === 'list' ? "home-page__card-list" : "home-page__card-grid"}>
                  {activeAssignedBoards.slice(0, 5).map((board, index) => (
                    <div
                      key={board.id}
                      className={`home-page__card-wrapper ${isVisible ? "home-page__card-wrapper--visible" : "home-page__card-wrapper--hidden"}`}
                      style={{ transitionDelay: `${(2 * 100) + (index * 50)}ms` }}
                    >
                      <BoardCard
                        board={board}
                        onClick={() => navigate(`/boards/${board.slug}`, { state: { from: '/home' } })}
                        onEdit={() => {}}
                        onShowInfo={() => navigate(`/boards/info/${board.slug}`, { state: { from: '/home' } })}
                        viewMode={viewMode === 'list' ? 'list' : 'grid'}
                      />
                    </div>
                  ))}
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

      {/* Pano Duzenleme Modali */}
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
