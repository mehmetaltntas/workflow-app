import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAssignedBoardsQuery, useMyTeamBoardsQuery } from "../hooks/queries/useAssignedBoards";
import {
  Users,
  ArrowLeft,
  LayoutDashboard,
  ChevronRight,
} from "lucide-react";
import type { Board } from "../types";
import BoardCard from "../components/BoardCard";
import { EmptyState } from "../components/ui/EmptyState";
import { NavbarViewSwitcher, type ViewMode } from "../components/ui/NavbarViewSwitcher";
import { StatusFilterDropdown } from "../components/ui/StatusFilterDropdown";
import { STATUS_LABELS, STATUS_COLORS, STATUS_SLUGS } from "../constants";
import { colors } from '../styles/tokens';
import "./AssignedBoardsPage.css";

const BOARDS_PER_SECTION = 10;
const BOARDS_PER_STATUS_IN_ALL = 5;

const STATUS_ORDER = ["DEVAM_EDIYOR", "PLANLANDI", "TAMAMLANDI", "DURDURULDU", "BIRAKILDI"];

const TeamPage = () => {
  const navigate = useNavigate();
  const { data: assignedBoards = [], isLoading: loadingAssigned } = useAssignedBoardsQuery();
  const { data: myTeamBoards = [], isLoading: loadingTeam } = useMyTeamBoardsQuery();
  const [isVisible, setIsVisible] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [statusFilter, setStatusFilter] = useState("DEVAM_EDIYOR");

  const loading = loadingAssigned || loadingTeam;

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setIsVisible(true), 50);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  const filterByStatus = (boards: Board[]) => {
    if (statusFilter === "ALL") return boards;
    return boards.filter(b => (b.status || "PLANLANDI") === statusFilter);
  };

  // Dropdown için status sayıları (her iki bölümün toplamı)
  const statusCounts = useMemo(() => {
    const allBoards = [...myTeamBoards, ...assignedBoards];
    const counts: Record<string, number> = {};
    allBoards.forEach(b => {
      const status = b.status || "PLANLANDI";
      counts[status] = (counts[status] || 0) + 1;
    });
    return counts;
  }, [myTeamBoards, assignedBoards]);

  const filteredCreated = useMemo(
    () => filterByStatus(myTeamBoards),
    [myTeamBoards, statusFilter]
  );
  const filteredJoined = useMemo(
    () => filterByStatus(assignedBoards),
    [assignedBoards, statusFilter]
  );

  const groupByStatus = (boards: Board[]) => {
    const grouped: Record<string, Board[]> = {};
    boards.forEach(board => {
      const status = board.status || "PLANLANDI";
      if (!grouped[status]) grouped[status] = [];
      grouped[status].push(board);
    });
    return grouped;
  };

  const renderBoardCards = (boards: Board[], fromPath: string, limit: number) => (
    <div className={viewMode === 'list' ? "assigned-page__card-list" : "assigned-page__card-grid"}>
      {boards.slice(0, limit).map((board, cardIndex) => (
        <div
          key={board.id}
          className={`assigned-page__card-wrapper ${isVisible ? "assigned-page__card-wrapper--visible" : "assigned-page__card-wrapper--hidden"}`}
          style={{ transitionDelay: `${cardIndex * 50}ms` }}
        >
          <BoardCard
            board={board}
            onClick={() => navigate(`/boards/${board.slug}`, { state: { from: fromPath } })}
            onShowInfo={() => navigate(`/boards/info/${board.slug}`, { state: { from: fromPath } })}
            viewMode={viewMode === 'list' ? 'list' : 'grid'}
            accentColor={colors.assigned.primary}
          />
        </div>
      ))}
    </div>
  );

  const renderBoardList = (boards: Board[], fromPath: string, sectionSlug: string) => {
    if (statusFilter === "ALL") {
      const grouped = groupByStatus(boards);
      const statusesWithBoards = STATUS_ORDER.filter(s => grouped[s]?.length > 0);
      if (statusesWithBoards.length === 0) return null;
      return (
        <div className="team-page__status-groups">
          {statusesWithBoards.map(status => (
            <div key={status} className="team-page__status-group">
              <div className="team-page__status-subheader">
                <span
                  className="team-page__status-dot"
                  style={{ background: STATUS_COLORS[status] }}
                />
                <h3 className="team-page__status-subtitle">{STATUS_LABELS[status]}</h3>
                <span className="assigned-page__group-count">{grouped[status].length}</span>
                {grouped[status].length > BOARDS_PER_STATUS_IN_ALL && (
                  <button className="team-page__more-btn" onClick={() => navigate(`/team/status/${sectionSlug}/${STATUS_SLUGS[status]}`)}>
                    Daha Fazla
                    <ChevronRight size={16} />
                  </button>
                )}
              </div>
              {renderBoardCards(grouped[status], fromPath, BOARDS_PER_STATUS_IN_ALL)}
            </div>
          ))}
        </div>
      );
    }
    return renderBoardCards(boards, fromPath, BOARDS_PER_SECTION);
  };

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

            {/* Controls */}
            <div className="assigned-page__controls">
              <NavbarViewSwitcher value={viewMode} onChange={setViewMode} />
              <StatusFilterDropdown
                value={statusFilter}
                onChange={setStatusFilter}
                counts={statusCounts}
              />
            </div>
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
            {statusFilter !== "ALL" && filteredCreated.length > BOARDS_PER_SECTION && (
              <button className="team-page__more-btn" onClick={() => navigate(`/team/status/olusturduklarim/${STATUS_SLUGS[statusFilter]}`)}>
                Daha Fazla
                <ChevronRight size={16} />
              </button>
            )}
          </div>
          {filteredCreated.length > 0 ? (
            renderBoardList(filteredCreated, '/team', 'olusturduklarim')
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
            {statusFilter !== "ALL" && filteredJoined.length > BOARDS_PER_SECTION && (
              <button className="team-page__more-btn" onClick={() => navigate(`/team/status/katildiklarim/${STATUS_SLUGS[statusFilter]}`)}>
                Daha Fazla
                <ChevronRight size={16} />
              </button>
            )}
          </div>
          {filteredJoined.length > 0 ? (
            renderBoardList(filteredJoined, '/team', 'katildiklarim')
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
