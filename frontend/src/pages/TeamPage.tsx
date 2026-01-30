import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAssignedBoardsQuery, useMyTeamBoardsQuery } from "../hooks/queries/useAssignedBoards";
import {
  Users,
  ArrowLeft,
  Clock,
  LayoutDashboard,
  ChevronRight,
} from "lucide-react";
import type { Board } from "../types";
import BoardCard from "../components/BoardCard";
import { EmptyState } from "../components/ui/EmptyState";
import { NavbarViewSwitcher, type ViewMode } from "../components/ui/NavbarViewSwitcher";
import { SortDropdown, type SortField, type SortDirection } from "../components/ui/SortDropdown";
import { colors } from '../styles/tokens';
import { STATUS_COLORS, STATUS_LABELS } from "../constants";
import "./AssignedBoardsPage.css";

type StatusFilter = "DEVAM_EDIYOR" | "PLANLANDI" | "TAMAMLANDI" | "DURDURULDU" | "BIRAKILDI" | "HEPSI";

const BOARDS_PER_SECTION = 10;

const STATUS_FILTER_OPTIONS: { key: StatusFilter; label: string }[] = [
  { key: "DEVAM_EDIYOR", label: "Devam Ediyor" },
  { key: "PLANLANDI", label: "Planlandı" },
  { key: "TAMAMLANDI", label: "Tamamlandı" },
  { key: "DURDURULDU", label: "Beklemede" },
  { key: "BIRAKILDI", label: "İptal Edildi" },
  { key: "HEPSI", label: "Hepsi" },
];

const TeamPage = () => {
  const navigate = useNavigate();
  const { data: assignedBoards = [], isLoading: loadingAssigned } = useAssignedBoardsQuery();
  const { data: myTeamBoards = [], isLoading: loadingTeam } = useMyTeamBoardsQuery();
  const [isVisible, setIsVisible] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortField, setSortField] = useState<SortField>('alphabetic');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("DEVAM_EDIYOR");

  const loading = loadingAssigned || loadingTeam;

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setIsVisible(true), 50);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  const sortBoards = (boards: Board[]) => {
    return [...boards].sort((a, b) => {
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
  };

  const filterByStatus = (boards: Board[]) => {
    if (statusFilter === "HEPSI") return boards;
    return boards.filter(b => (b.status || "PLANLANDI") === statusFilter);
  };

  // Filtrelenmiş ve sıralanmış panolar
  const filteredCreated = useMemo(
    () => sortBoards(filterByStatus(myTeamBoards)),
    [myTeamBoards, statusFilter, sortField, sortDirection]
  );
  const filteredJoined = useMemo(
    () => sortBoards(filterByStatus(assignedBoards)),
    [assignedBoards, statusFilter, sortField, sortDirection]
  );

  // İstatistikler
  const stats = useMemo(() => {
    const totalAssigned = assignedBoards.length;
    const totalTeam = myTeamBoards.length;
    const activeAssigned = assignedBoards.filter(b => b.status === "DEVAM_EDIYOR").length;
    const activeTeam = myTeamBoards.filter(b => b.status === "DEVAM_EDIYOR").length;
    return { totalAssigned, totalTeam, total: totalAssigned + totalTeam, active: activeAssigned + activeTeam };
  }, [assignedBoards, myTeamBoards]);

  const renderBoardList = (boards: Board[], fromPath: string) => (
    <div className={viewMode === 'list' ? "assigned-page__card-list" : "assigned-page__card-grid"}>
      {boards.slice(0, BOARDS_PER_SECTION).map((board, cardIndex) => (
        <div
          key={board.id}
          className={`assigned-page__card-wrapper ${isVisible ? "assigned-page__card-wrapper--visible" : "assigned-page__card-wrapper--hidden"}`}
          style={{ transitionDelay: `${cardIndex * 50}ms` }}
        >
          <BoardCard
            board={board}
            onClick={() => navigate(`/boards/${board.slug}`, { state: { from: fromPath } })}
            onEdit={() => {}}
            onShowInfo={() => navigate(`/boards/info/${board.slug}`, { state: { from: fromPath } })}
            viewMode={viewMode === 'list' ? 'list' : 'grid'}
            accentColor={colors.assigned.primary}
          />
        </div>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="assigned-page__loading">
        <div className="assigned-page__header">
          <div className="assigned-page__title-section">
            <div className="assigned-page__title-icon">
              <Users color={colors.assigned.primary} size={24} />
            </div>
            <div>
              <h1 className="assigned-page__title">Ekip</h1>
              <p className="assigned-page__subtitle">Yükleniyor...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const hasNoBoards = assignedBoards.length === 0 && myTeamBoards.length === 0;

  if (hasNoBoards) {
    return (
      <div className="assigned-page__empty">
        <div className="assigned-page__header" style={{ padding: '40px 40px 0' }}>
          <div className="assigned-page__title-section">
            <div className="assigned-page__title-icon">
              <Users color={colors.assigned.primary} size={24} />
            </div>
            <div>
              <h1 className="assigned-page__title">Ekip</h1>
            </div>
          </div>
        </div>
        <div className="assigned-page__empty-center">
          <EmptyState
            icon={<Users size={48} strokeWidth={1.5} />}
            title="Henüz ekip panonuz yok"
            description="Bir pano sahibi sizi üye olarak eklediğinde veya siz ekip özellikli pano oluşturduğunuzda burada görünecektir."
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
                <h1 className="assigned-page__title">Ekip</h1>
                <p className="assigned-page__subtitle">
                  Oluşturduğunuz ve katıldığınız ekip panoları
                </p>
              </div>
            </div>

            {/* Stats & Controls */}
            <div className="assigned-page__controls">
              <div className="assigned-page__stat-card assigned-page__stat-card--total">
                <Users size={18} color={colors.assigned.primary} />
                <div>
                  <div className="assigned-page__stat-value" style={{ color: colors.assigned.primary }}>
                    {stats.total}
                  </div>
                  <div className="assigned-page__stat-label">Toplam</div>
                </div>
              </div>

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

          {/* Status Filter */}
          <div className="team-page__filters">
            {STATUS_FILTER_OPTIONS.map(({ key, label }) => {
              const isActive = statusFilter === key;
              const statusColor = key !== "HEPSI" ? STATUS_COLORS[key] : colors.assigned.primary;
              return (
                <button
                  key={key}
                  className={`team-page__filter-chip ${isActive ? "team-page__filter-chip--active" : ""}`}
                  onClick={() => setStatusFilter(key)}
                  style={isActive ? {
                    borderColor: statusColor,
                    background: `${statusColor}15`,
                    color: statusColor,
                  } : undefined}
                >
                  {key !== "HEPSI" && (
                    <span
                      className="team-page__filter-dot"
                      style={{ background: statusColor }}
                    />
                  )}
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section: Oluşturduklarım */}
        <div className="team-page__section">
          <div className="team-page__section-header">
            <div className="team-page__section-icon team-page__section-icon--team">
              <LayoutDashboard size={20} color={colors.assigned.primary} />
            </div>
            <h2 className="team-page__section-title">Oluşturduklarım</h2>
            <span className="assigned-page__group-count">{filteredCreated.length}</span>
            {filteredCreated.length > BOARDS_PER_SECTION && (
              <button className="team-page__more-btn" onClick={() => {}}>
                Daha Fazla
                <ChevronRight size={16} />
              </button>
            )}
          </div>
          {filteredCreated.length > 0 ? (
            renderBoardList(filteredCreated, '/team')
          ) : (
            <div className="team-page__section-empty">
              Bu filtrede oluşturduğunuz pano bulunmuyor.
            </div>
          )}
        </div>

        {/* Section: Katıldıklarım */}
        <div className="team-page__section">
          <div className="team-page__section-header">
            <div className="team-page__section-icon">
              <Users size={20} color={colors.assigned.primary} />
            </div>
            <h2 className="team-page__section-title">Katıldıklarım</h2>
            <span className="assigned-page__group-count">{filteredJoined.length}</span>
            {filteredJoined.length > BOARDS_PER_SECTION && (
              <button className="team-page__more-btn" onClick={() => {}}>
                Daha Fazla
                <ChevronRight size={16} />
              </button>
            )}
          </div>
          {filteredJoined.length > 0 ? (
            renderBoardList(filteredJoined, '/team')
          ) : (
            <div className="team-page__section-empty">
              Bu filtrede katıldığınız pano bulunmuyor.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamPage;
