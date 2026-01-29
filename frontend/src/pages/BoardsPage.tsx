import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type { Board } from "../types";
import { Layout, Plus, FolderOpen, Search, ArrowRight } from "lucide-react";

import { useBoardsQuery } from "../hooks/queries/useBoards";
import { useCreateBoard, useUpdateBoard, useDeleteBoard } from "../hooks/queries/useBoardMutations";
import { colors } from '../styles/tokens';
import BoardCard from "../components/BoardCard";
import CreateBoardModal from "../components/CreateBoardModal";
import BoardEditModal from "../components/BoardEditModal";
import { STATUS_COLORS, STATUS_LABELS, STATUS_SLUGS } from "../constants";
import { BoardsPageSkeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { NavbarViewSwitcher, type ViewMode } from "../components/ui/NavbarViewSwitcher";
import { StatusFilterDropdown } from "../components/ui/StatusFilterDropdown";
import "./BoardsPage.css";

const BoardsPage = () => {
  const navigate = useNavigate();
  const { data: boards = [], isLoading: loading } = useBoardsQuery();
  const createBoardMutation = useCreateBoard();
  const updateBoardMutation = useUpdateBoard();
  const deleteBoardMutation = useDeleteBoard();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBoard, setEditingBoard] = useState<Board | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isVisible, setIsVisible] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setIsVisible(true), 50);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  // Status bazli sayilari hesapla
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.keys(STATUS_LABELS).forEach(key => {
      counts[key] = boards.filter(b => (b.status || "PLANLANDI") === key).length;
    });
    return counts;
  }, [boards]);

  // Yeni pano olusturma
  const handleCreateBoard = async (name: string, status: string, link?: string, description?: string, deadline?: string, category?: string, boardType?: 'INDIVIDUAL' | 'TEAM') => {
    const formattedDeadline = deadline ? `${deadline}T23:59:59` : undefined;
    await createBoardMutation.mutateAsync(
      { name, status, link, description, deadline: formattedDeadline, category, boardType }
    );
  };

  // Pano duzenleme
  const handleEditBoard = async (data: { name: string; link?: string; description?: string; deadline?: string; status?: string; category?: string; boardType?: 'INDIVIDUAL' | 'TEAM' }) => {
    if (!editingBoard) return;
    const formattedDeadline = data.deadline ? `${data.deadline}T23:59:59` : undefined;
    await updateBoardMutation.mutateAsync({
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
    });
    setIsEditModalOpen(false);
    setEditingBoard(null);
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
  };

  const openEditModal = (board: Board) => {
    setEditingBoard(board);
    setIsEditModalOpen(true);
  };

  const filteredBoards = boards.filter(b => statusFilter === "ALL" || (b.status || "PLANLANDI") === statusFilter);

  // Loading State
  if (loading) {
    return (
      <div className="boards-page__loading">
        {/* Header Skeleton */}
        <div className="boards-page__header">
          <div className="boards-page__title-section">
            <div className="boards-page__title-icon">
              <Layout color={colors.brand.primary} size={24} />
            </div>
            <div>
              <h1 className="boards-page__title">Panolarım</h1>
              <p className="boards-page__subtitle">Yükleniyor...</p>
            </div>
          </div>
        </div>

        <BoardsPageSkeleton />
      </div>
    );
  }

  // Empty State - Hic pano yoksa
  if (boards.length === 0) {
    return (
      <div className="boards-page__empty">
        {/* Header */}
        <div className="boards-page__header">
          <div className="boards-page__title-section">
            <div className="boards-page__title-icon">
              <Layout color={colors.brand.primary} size={24} />
            </div>
            <div>
              <h1 className="boards-page__title">Panolarım</h1>
            </div>
          </div>
        </div>

        <div className="boards-page__empty-center">
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
    <div className={`boards-page ${isVisible ? "boards-page--visible" : "boards-page--hidden"}`}>
      {/* Main Content */}
      <div className="boards-page__content">
        {/* Header */}
        <div className="boards-page__header">
          <div className="boards-page__header-top">
            {/* Title Section */}
            <div className="boards-page__title-section">
              <div className="boards-page__title-icon">
                <Layout color={colors.brand.primary} size={24} />
              </div>
              <div>
                <h1 className="boards-page__title">Panolarım</h1>
                <p className="boards-page__subtitle">
                  {boards.length} pano &middot; {statusCounts["DEVAM_EDIYOR"] || 0} aktif
                </p>
              </div>
            </div>

            {/* Stats Cards & Panel Toggle */}
            <div className="boards-page__controls">
              {/* Yeni Pano Button */}
              <button onClick={openCreateModal} className="boards-page__create-btn">
                <Plus size={18} strokeWidth={2.5} />
                Yeni Pano
              </button>

              {/* View & Filter Controls */}
              <NavbarViewSwitcher value={viewMode} onChange={setViewMode} />
              <StatusFilterDropdown
                value={statusFilter}
                onChange={setStatusFilter}
                counts={statusCounts}
              />
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
        <div className="boards-page__groups">
          {(statusFilter === "ALL" ? Object.keys(STATUS_LABELS) : [statusFilter]).map((statusKey, groupIndex) => {
            const boardsInStatus = filteredBoards.filter(b => (b.status || "PLANLANDI") === statusKey);

            if (boardsInStatus.length === 0) return null;

            const MAX_VISIBLE = 5;
            const hasMore = boardsInStatus.length > MAX_VISIBLE;
            const visibleBoards = hasMore ? boardsInStatus.slice(0, MAX_VISIBLE) : boardsInStatus;

            return (
              <div
                key={statusKey}
                className={`boards-page__group ${isVisible ? "boards-page__group--visible" : "boards-page__group--hidden"}`}
                style={{ transitionDelay: `${groupIndex * 100}ms` }}
              >
                {/* Group Header */}
                <div className="boards-page__group-header">
                  <div
                    className="boards-page__group-dot"
                    style={{ background: STATUS_COLORS[statusKey], boxShadow: `0 0 12px ${STATUS_COLORS[statusKey]}50` }}
                  />
                  <h2 className="boards-page__group-title">
                    {STATUS_LABELS[statusKey]}
                  </h2>
                  <span className="boards-page__group-count">
                    {boardsInStatus.length}
                  </span>

                  {/* Tumunu Gor linki */}
                  {hasMore && (
                    <button
                      onClick={() => navigate(`/boards/status/${STATUS_SLUGS[statusKey]}`)}
                      className="boards-page__view-all-btn"
                      style={{
                        border: `1px solid ${STATUS_COLORS[statusKey]}30`,
                        background: `${STATUS_COLORS[statusKey]}10`,
                        color: STATUS_COLORS[statusKey],
                      }}
                    >
                      Tümünü Gör ({boardsInStatus.length})
                      <ArrowRight size={16} />
                    </button>
                  )}
                </div>

                {/* Cards Grid/List */}
                <div className={viewMode === 'list' ? "boards-page__card-list" : "boards-page__card-grid"}>
                  {visibleBoards.map((board, cardIndex) => (
                    <div
                      key={board.id}
                      className={`boards-page__card-wrapper ${isVisible ? "boards-page__card-wrapper--visible" : "boards-page__card-wrapper--hidden"}`}
                      style={{ transitionDelay: `${(groupIndex * 100) + (cardIndex * 50)}ms` }}
                    >
                      <BoardCard
                        board={board}
                        onClick={() => navigate(`/boards/${board.slug}`, { state: { from: '/boards' } })}
                        onEdit={() => openEditModal(board)}
                        onShowInfo={() => {
                          navigate(`/boards/info/${board.slug}`, { state: { from: '/boards' } });
                        }}
                        viewMode={viewMode === 'list' ? 'list' : 'grid'}
                        showTypeBadge
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Yeni Pano Olusturma Modali */}
      {isModalOpen && (
        <CreateBoardModal
          key="create-new"
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onCreate={handleCreateBoard}
        />
      )}

      {/* Pano Duzenleme Modali */}
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

export default BoardsPage;
