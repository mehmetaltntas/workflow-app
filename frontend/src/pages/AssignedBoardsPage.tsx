import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAssignedBoardsQuery } from "../hooks/queries/useAssignedBoards";
import {
  Users,
  ArrowLeft,
  Clock,
} from "lucide-react";
import type { Board } from "../types";
import BoardCard from "../components/BoardCard";
import { EmptyState } from "../components/ui/EmptyState";
import { NavbarViewSwitcher, type ViewMode } from "../components/ui/NavbarViewSwitcher";
import { SortDropdown, type SortField, type SortDirection } from "../components/ui/SortDropdown";
import { colors } from '../styles/tokens';
import { STATUS_COLORS, STATUS_LABELS } from "../constants";
import "./AssignedBoardsPage.css";

const AssignedBoardsPage = () => {
  const navigate = useNavigate();
  const { data: assignedBoards = [], isLoading: loading } = useAssignedBoardsQuery();
  const [isVisible, setIsVisible] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortField, setSortField] = useState<SortField>('alphabetic');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setIsVisible(true), 50);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  // Status bazli gruplama
  const groupedBoards = useMemo(() => {
    const groups: Record<string, Board[]> = {};

    assignedBoards.forEach(board => {
      const status = board.status || "PLANLANDI";
      if (!groups[status]) groups[status] = [];
      groups[status].push(board);
    });

    // Her grubu sirala
    Object.values(groups).forEach(group => {
      group.sort((a, b) => {
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
    });

    return groups;
  }, [assignedBoards, sortField, sortDirection]);

  // Istatistikler
  const stats = useMemo(() => {
    const total = assignedBoards.length;
    const active = assignedBoards.filter(b => b.status === "DEVAM_EDIYOR").length;
    return { total, active };
  }, [assignedBoards]);

  // Status siralamasi
  const statusOrder = ["DEVAM_EDIYOR", "PLANLANDI", "DURDURULDU", "TAMAMLANDI", "BIRAKILDI"];

  if (loading) {
    return (
      <div className="assigned-page__loading">
        <div className="assigned-page__header">
          <div className="assigned-page__title-section">
            <div className="assigned-page__title-icon">
              <Users color={colors.assigned.primary} size={24} />
            </div>
            <div>
              <h1 className="assigned-page__title">Atanan Panolar</h1>
              <p className="assigned-page__subtitle">Yükleniyor...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (assignedBoards.length === 0) {
    return (
      <div className="assigned-page__empty">
        <div className="assigned-page__header" style={{ padding: '40px 40px 0' }}>
          <div className="assigned-page__title-section">
            <div className="assigned-page__title-icon">
              <Users color={colors.assigned.primary} size={24} />
            </div>
            <div>
              <h1 className="assigned-page__title">Atanan Panolar</h1>
            </div>
          </div>
        </div>
        <div className="assigned-page__empty-center">
          <EmptyState
            icon={<Users size={48} strokeWidth={1.5} />}
            title="Henüz atanmış panonuz yok"
            description="Bir pano sahibi sizi üye olarak eklediğinde, o panolar burada görünecektir."
            action={{
              label: "Ana Sayfaya Dön",
              onClick: () => navigate("/home"),
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`assigned-page ${isVisible ? "assigned-page--visible" : "assigned-page--hidden"}`}>
      <div className="assigned-page__content">
        {/* Header */}
        <div className="assigned-page__header">
          <div className="assigned-page__header-top">
            {/* Title Section */}
            <div className="assigned-page__title-section">
              {/* Geri butonu */}
              <button
                onClick={() => navigate("/home")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                  background: "var(--bg-card)",
                  cursor: "pointer",
                  transition: "all 200ms",
                  color: "var(--text-muted)",
                }}
              >
                <ArrowLeft size={20} />
              </button>

              <div className="assigned-page__title-icon">
                <Users color={colors.assigned.primary} size={24} />
              </div>
              <div>
                <h1 className="assigned-page__title">Atanan Panolar</h1>
                <p className="assigned-page__subtitle">
                  Size atanan tüm panolar
                </p>
              </div>
            </div>

            {/* Stats & Controls */}
            <div className="assigned-page__controls">
              {/* Total */}
              <div className="assigned-page__stat-card assigned-page__stat-card--total">
                <Users size={18} color={colors.assigned.primary} />
                <div>
                  <div className="assigned-page__stat-value" style={{ color: colors.assigned.primary }}>
                    {stats.total}
                  </div>
                  <div className="assigned-page__stat-label">Toplam</div>
                </div>
              </div>

              {/* Active */}
              <div className="assigned-page__stat-card assigned-page__stat-card--active">
                <Clock size={18} color={colors.status.inProgress} />
                <div>
                  <div className="assigned-page__stat-value" style={{ color: colors.status.inProgress }}>
                    {stats.active}
                  </div>
                  <div className="assigned-page__stat-label">Aktif</div>
                </div>
              </div>

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

        {/* Board Groups by Status */}
        <div className="assigned-page__groups">
          {statusOrder.map((statusKey, groupIndex) => {
            const boardsInGroup = groupedBoards[statusKey];
            if (!boardsInGroup || boardsInGroup.length === 0) return null;

            return (
              <div
                key={statusKey}
                className={`assigned-page__group ${isVisible ? "assigned-page__group--visible" : "assigned-page__group--hidden"}`}
                style={{ transitionDelay: `${groupIndex * 100}ms` }}
              >
                {/* Group Header */}
                <div className="assigned-page__group-header">
                  <div
                    className="assigned-page__group-dot"
                    style={{
                      background: STATUS_COLORS[statusKey],
                      boxShadow: `0 0 12px ${STATUS_COLORS[statusKey]}50`,
                    }}
                  />
                  <h2 className="assigned-page__group-title">
                    {STATUS_LABELS[statusKey]}
                  </h2>
                  <span className="assigned-page__group-count">
                    {boardsInGroup.length}
                  </span>
                </div>

                {/* Cards */}
                <div className={viewMode === 'list' ? "assigned-page__card-list" : "assigned-page__card-grid"}>
                  {boardsInGroup.map((board, cardIndex) => (
                    <div
                      key={board.id}
                      className={`assigned-page__card-wrapper ${isVisible ? "assigned-page__card-wrapper--visible" : "assigned-page__card-wrapper--hidden"}`}
                      style={{ transitionDelay: `${(groupIndex * 100) + (cardIndex * 50)}ms` }}
                    >
                      <BoardCard
                        board={board}
                        onClick={() => navigate(`/boards/${board.slug}`, { state: { from: '/assigned-boards' } })}
                        onEdit={() => {}}
                        onShowInfo={() => navigate(`/boards/info/${board.slug}`, { state: { from: '/assigned-boards' } })}
                        viewMode={viewMode === 'list' ? 'list' : 'grid'}
                        accentColor={colors.assigned.primary}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AssignedBoardsPage;
