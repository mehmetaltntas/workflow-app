import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, LayoutDashboard, Users } from "lucide-react";
import { useBoardsQuery } from "../hooks/queries/useBoards";
import { useMyTeamBoardsQuery, useAssignedBoardsQuery } from "../hooks/queries/useAssignedBoards";
import { typography, spacing, radius, cssVars, colors, animation } from "../styles/tokens";
import { STATUS_LABELS, STATUS_COLORS } from "../constants";
import type { Board } from "../types";

// Takvim etkinlik tipi
interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: "board";
  boardSlug: string;
  boardName: string;
  color: string;
  daysRemaining: number;
  status: string;
  isTeamBoard?: boolean;
}

// Türkçe ay isimleri
const MONTH_NAMES = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
];

// Türkçe gün isimleri
const DAY_NAMES = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

// Yerel tarih formatı (timezone sorunu önlenir)
const formatLocalDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Son tarihe göre renk hesapla (component dışında tanımlandı - her renderda yeniden oluşturulmaz)
function getDeadlineColor(deadline: string) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(0, 0, 0, 0);

  const diffTime = deadlineDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { color: '#dc2626', days: diffDays }; // Kırmızı - geçmiş
  } else if (diffDays <= 3) {
    return { color: '#f97316', days: diffDays }; // Turuncu - acil
  } else if (diffDays <= 7) {
    return { color: '#eab308', days: diffDays }; // Sarı - yaklaşıyor
  } else {
    return { color: '#22c55e', days: diffDays }; // Yeşil - normal
  }
}

const CalendarPage = () => {
  const navigate = useNavigate();
  const { data: boards = [], isLoading: loading } = useBoardsQuery();
  const { data: myTeamBoards = [], isLoading: teamLoading } = useMyTeamBoardsQuery();
  const { data: assignedBoards = [], isLoading: assignedLoading } = useAssignedBoardsQuery();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);

  // Board deadline'larından etkinlikleri çıkar (kendi panolar + ekip panolar)
  const events = useMemo(() => {
    const allEvents: CalendarEvent[] = [];
    const addedBoardIds = new Set<number>();

    // Kendi panolari ekle
    boards.forEach((board: Board) => {
      if (board.deadline) {
        const deadlineInfo = getDeadlineColor(board.deadline);
        allEvents.push({
          id: `board-${board.id}`,
          title: board.name,
          date: board.deadline.split('T')[0],
          type: "board",
          boardSlug: board.slug,
          boardName: board.name,
          color: deadlineInfo.color,
          daysRemaining: deadlineInfo.days,
          status: board.status || "PLANLANDI",
          isTeamBoard: board.boardType === 'TEAM',
        });
        addedBoardIds.add(board.id);
      }
    });

    // Ekip panolarini ekle (duplicate kontrolu ile)
    myTeamBoards.forEach((board: Board) => {
      if (board.deadline && !addedBoardIds.has(board.id)) {
        const deadlineInfo = getDeadlineColor(board.deadline);
        allEvents.push({
          id: `team-board-${board.id}`,
          title: board.name,
          date: board.deadline.split('T')[0],
          type: "board",
          boardSlug: board.slug,
          boardName: board.name,
          color: deadlineInfo.color,
          daysRemaining: deadlineInfo.days,
          status: board.status || "PLANLANDI",
          isTeamBoard: true,
        });
        addedBoardIds.add(board.id);
      }
    });

    // Üye olunan ekip panolarini ekle (duplicate kontrolu ile)
    assignedBoards.forEach((board: Board) => {
      if (board.deadline && !addedBoardIds.has(board.id)) {
        const deadlineInfo = getDeadlineColor(board.deadline);
        allEvents.push({
          id: `assigned-board-${board.id}`,
          title: board.name,
          date: board.deadline.split('T')[0],
          type: "board",
          boardSlug: board.slug,
          boardName: board.name,
          color: deadlineInfo.color,
          daysRemaining: deadlineInfo.days,
          status: board.status || "PLANLANDI",
          isTeamBoard: true,
        });
        addedBoardIds.add(board.id);
      }
    });

    return allEvents;
  }, [boards, myTeamBoards, assignedBoards]);

  // Ay başlangıç ve bitiş günlerini hesapla
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Ayın ilk günü
    const firstDay = new Date(year, month, 1);
    // Ayın son günü
    const lastDay = new Date(year, month + 1, 0);

    // Pazartesi'den başlayacak şekilde ayarla (0 = Pazar, 1 = Pazartesi)
    let startDay = firstDay.getDay() - 1;
    if (startDay === -1) startDay = 6; // Pazar -> 6

    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    // Önceki ayın günleri
    for (let i = startDay - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({ date, isCurrentMonth: false });
    }

    // Bu ayın günleri
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i);
      days.push({ date, isCurrentMonth: true });
    }

    // Sonraki ayın günleri (6 satır tamamlanana kadar)
    const remainingDays = 42 - days.length; // 6 satır * 7 gün = 42
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      days.push({ date, isCurrentMonth: false });
    }

    return days;
  }, [currentDate]);

  // Bir güne ait etkinlikleri getir
  const getEventsForDate = (date: Date) => {
    const dateStr = formatLocalDate(date);
    return events.filter((event) => event.date === dateStr);
  };

  // Tarih seçildiğinde ilk panoyu otomatik seç
  const handleDateSelect = (dateStr: string) => {
    setSelectedDate(dateStr);
    const dateEvents = events.filter(e => e.date === dateStr);
    setSelectedBoardId(dateEvents.length > 0 ? dateEvents[0].id : null);
  };

  // Ay değiştir
  const changeMonth = (delta: number) => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + delta);
      return newDate;
    });
  };

  // Bugünün tarihi
  const today = new Date();
  const todayStr = formatLocalDate(today);

  // Seçili güne ait etkinlikler
  const selectedEvents = selectedDate
    ? events.filter((event) => event.date === selectedDate)
    : [];

  // Seçili pano
  const selectedBoard = selectedBoardId
    ? selectedEvents.find(e => e.id === selectedBoardId) || selectedEvents[0] || null
    : selectedEvents[0] || null;

  // Kalan güne göre durum metni
  const getDaysRemainingText = (days: number) => {
    if (days < 0) {
      return `${Math.abs(days)} gün gecikmiş`;
    } else if (days === 0) {
      return 'Bugün';
    } else if (days === 1) {
      return 'Yarın';
    } else {
      return `${days} gün kaldı`;
    }
  };

  if (loading || teamLoading || assignedLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          color: cssVars.textMuted,
        }}
      >
        Yükleniyor...
      </div>
    );
  }

  return (
    <div style={{ padding: spacing[6], maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: spacing[6],
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: spacing[3] }}>
          <CalendarIcon size={28} style={{ color: cssVars.primary }} />
          <h1
            style={{
              fontSize: typography.fontSize["4xl"],
              fontWeight: typography.fontWeight.bold,
              color: cssVars.textMain,
              margin: 0,
            }}
          >
            Takvim
          </h1>
          {/* Son Tarih Durumu göstergeleri */}
          <div style={{ display: "flex", alignItems: "center", gap: spacing[3], marginLeft: spacing[4] }}>
            {[
              { color: '#dc2626', label: "Gecikmiş" },
              { color: '#f97316', label: "Acil" },
              { color: '#eab308', label: "Yaklaşıyor" },
              { color: '#22c55e', label: "Normal" },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: spacing[1],
                }}
              >
                <div
                  style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "3px",
                    background: item.color,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: typography.fontSize.sm,
                    color: cssVars.textMuted,
                    fontWeight: typography.fontWeight.medium,
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Ay Navigasyonu */}
        <div style={{ display: "flex", alignItems: "center", gap: spacing[3] }}>
          <button
            onClick={() => changeMonth(-1)}
            aria-label="Önceki ay"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "36px",
              height: "36px",
              borderRadius: radius.md,
              border: `1px solid ${cssVars.border}`,
              background: cssVars.bgCard,
              color: cssVars.textMain,
              cursor: "pointer",
              transition: `all ${animation.duration.normal}`,
            }}
          >
            <ChevronLeft size={20} />
          </button>

          <span
            style={{
              fontSize: typography.fontSize["2xl"],
              fontWeight: typography.fontWeight.semibold,
              color: cssVars.textMain,
              minWidth: "180px",
              textAlign: "center",
            }}
          >
            {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
          </span>

          <button
            onClick={() => changeMonth(1)}
            aria-label="Sonraki ay"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "36px",
              height: "36px",
              borderRadius: radius.md,
              border: `1px solid ${cssVars.border}`,
              background: cssVars.bgCard,
              color: cssVars.textMain,
              cursor: "pointer",
              transition: `all ${animation.duration.normal}`,
            }}
          >
            <ChevronRight size={20} />
          </button>

          <button
            onClick={() => setCurrentDate(new Date())}
            style={{
              padding: `${spacing[2]} ${spacing[4]}`,
              borderRadius: radius.md,
              border: `1px solid ${cssVars.border}`,
              background: cssVars.bgCard,
              color: cssVars.textMain,
              cursor: "pointer",
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.medium,
              marginLeft: spacing[2],
              transition: `all ${animation.duration.normal}`,
            }}
          >
            Bugün
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: spacing[6] }}>
        {/* Takvim Grid */}
        <div
          style={{
            flex: 1,
            background: cssVars.bgCard,
            borderRadius: radius.xl,
            border: `1px solid ${cssVars.border}`,
            overflow: "hidden",
          }}
        >
          {/* Gün başlıkları */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              borderBottom: `1px solid ${cssVars.border}`,
            }}
          >
            {DAY_NAMES.map((day) => (
              <div
                key={day}
                style={{
                  padding: spacing[3],
                  textAlign: "center",
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.semibold,
                  color: cssVars.textMuted,
                  textTransform: "uppercase",
                  letterSpacing: typography.letterSpacing.wide,
                }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Takvim günleri */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
            }}
          >
            {calendarDays.map(({ date, isCurrentMonth }, index) => {
              const dateStr = formatLocalDate(date);
              const dayEvents = getEventsForDate(date);
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDate;

              return (
                <div
                  key={index}
                  onClick={() => handleDateSelect(dateStr)}
                  style={{
                    minHeight: "100px",
                    padding: spacing[2],
                    borderRight: (index + 1) % 7 !== 0 ? `1px solid ${cssVars.border}` : "none",
                    borderBottom: `1px solid ${cssVars.border}`,
                    cursor: "pointer",
                    background: isSelected
                      ? colors.brand.primaryLight
                      : isToday
                      ? "rgba(77, 171, 247, 0.08)"
                      : "transparent",
                    transition: `background ${animation.duration.normal}`,
                  }}
                >
                  {/* Gün numarası */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      marginBottom: spacing[1],
                    }}
                  >
                    <span
                      style={{
                        width: "28px",
                        height: "28px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: radius.full,
                        fontSize: typography.fontSize.base,
                        fontWeight: isToday
                          ? typography.fontWeight.bold
                          : typography.fontWeight.medium,
                        color: isToday
                          ? "#fff"
                          : isCurrentMonth
                          ? cssVars.textMain
                          : cssVars.textMuted,
                        background: isToday ? cssVars.primary : "transparent",
                      }}
                    >
                      {date.getDate()}
                    </span>
                  </div>

                  {/* Etkinlikler */}
                  <div style={{ display: "flex", flexDirection: "column", gap: spacing[0.5] }}>
                    {dayEvents.slice(0, 2).map((event) => (
                      <div
                        key={event.id}
                        style={{
                          padding: `${spacing[0.5]} ${spacing[1.5]}`,
                          borderRadius: radius.sm,
                          background: event.color,
                          color: "#fff",
                          fontSize: typography.fontSize.sm,
                          fontWeight: typography.fontWeight.semibold,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          lineHeight: "1.3",
                        }}
                        title={event.title}
                      >
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div
                        style={{
                          fontSize: typography.fontSize.xs,
                          color: cssVars.textMuted,
                          textAlign: "center",
                        }}
                      >
                        +{dayEvents.length - 2} daha
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sağ Panel - Seçili gün detayları */}
        <div
          style={{
            width: "320px",
            background: cssVars.bgCard,
            borderRadius: radius.xl,
            border: `1px solid ${cssVars.border}`,
            padding: spacing[5],
            alignSelf: "flex-start",
          }}
        >
          <h3
            style={{
              fontSize: typography.fontSize.xl,
              fontWeight: typography.fontWeight.semibold,
              color: cssVars.textMain,
              marginBottom: spacing[4],
              display: "flex",
              alignItems: "center",
              gap: spacing[2],
            }}
          >
            <CalendarIcon size={18} />
            {selectedDate
              ? new Date(selectedDate + "T00:00:00").toLocaleDateString("tr-TR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : "Bir gün seçin"}
          </h3>

          {selectedDate ? (
            selectedEvents.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: spacing[3] }}>
                {/* Seçili pano detayı */}
                {selectedBoard && (
                  <div
                    style={{
                      padding: spacing[2],
                      borderRadius: radius.md,
                      background: `${selectedBoard.color}15`,
                      border: `1px solid ${selectedBoard.color}40`,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: spacing[2],
                        marginBottom: spacing[1],
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: spacing[2] }}>
                        <span
                          style={{
                            fontSize: typography.fontSize.lg,
                            fontWeight: typography.fontWeight.semibold,
                            color: cssVars.textMain,
                          }}
                        >
                          {selectedBoard.title}
                        </span>
                        {selectedBoard.isTeamBoard && (
                          <span
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: spacing[1],
                              fontSize: typography.fontSize.xs,
                              fontWeight: typography.fontWeight.semibold,
                              color: colors.brand.primary,
                              background: colors.brand.primaryLight,
                              padding: `2px ${spacing[2]}`,
                              borderRadius: radius.full,
                              whiteSpace: "nowrap",
                            }}
                          >
                            <Users size={10} />
                            Ekip
                          </span>
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: typography.fontSize.xs,
                          fontWeight: typography.fontWeight.semibold,
                          color: STATUS_COLORS[selectedBoard.status] || cssVars.textMuted,
                          background: `${STATUS_COLORS[selectedBoard.status] || cssVars.textMuted}18`,
                          border: `1px solid ${STATUS_COLORS[selectedBoard.status] || cssVars.textMuted}30`,
                          padding: `2px ${spacing[2]}`,
                          borderRadius: radius.full,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {STATUS_LABELS[selectedBoard.status] || selectedBoard.status}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: typography.fontSize.sm,
                        color: selectedBoard.color,
                        fontWeight: typography.fontWeight.medium,
                        marginBottom: spacing[2],
                      }}
                    >
                      {getDaysRemainingText(selectedBoard.daysRemaining)}
                    </div>
                    {/* Panoya Git */}
                    <button
                      onClick={() => navigate(`/boards/${selectedBoard.boardSlug}`)}
                      style={{
                        padding: `${spacing[1.5]} ${spacing[3]}`,
                        borderRadius: radius.md,
                        border: "none",
                        background: selectedBoard.color,
                        color: "#fff",
                        fontSize: typography.fontSize.sm,
                        fontWeight: typography.fontWeight.semibold,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: spacing[1],
                        transition: `opacity ${animation.duration.normal}`,
                        whiteSpace: "nowrap",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                    >
                      <LayoutDashboard size={14} />
                      Panoya Git
                    </button>
                  </div>
                )}

                {/* Pano listesi (birden fazla pano varsa) */}
                {selectedEvents.length > 1 && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: spacing[1.5],
                      paddingTop: spacing[2],
                      borderTop: `1px solid ${cssVars.border}`,
                    }}
                  >
                    <h4
                      style={{
                        fontSize: typography.fontSize.xs,
                        fontWeight: typography.fontWeight.semibold,
                        color: cssVars.textMuted,
                        textTransform: "uppercase",
                        letterSpacing: typography.letterSpacing.wide,
                        margin: 0,
                      }}
                    >
                      Panolar ({selectedEvents.length})
                    </h4>
                    {selectedEvents.map((event) => (
                      <div
                        key={event.id}
                        onClick={() => setSelectedBoardId(event.id)}
                        style={{
                          padding: `${spacing[1.5]} ${spacing[2]}`,
                          borderRadius: radius.sm,
                          background: event.id === selectedBoard?.id ? `${event.color}20` : "transparent",
                          border: `1px solid ${event.id === selectedBoard?.id ? event.color + "50" : cssVars.border}`,
                          cursor: "pointer",
                          transition: `all ${animation.duration.normal}`,
                          display: "flex",
                          alignItems: "center",
                          gap: spacing[2],
                        }}
                      >
                        <div
                          style={{
                            width: "10px",
                            height: "10px",
                            borderRadius: "3px",
                            background: event.color,
                            flexShrink: 0,
                          }}
                        />
                        <span
                          style={{
                            fontSize: typography.fontSize.base,
                            fontWeight: event.id === selectedBoard?.id
                              ? typography.fontWeight.semibold
                              : typography.fontWeight.medium,
                            color: cssVars.textMain,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            flex: 1,
                          }}
                        >
                          {event.title}
                        </span>
                        <span
                          style={{
                            fontSize: typography.fontSize.xs,
                            color: event.color,
                            fontWeight: typography.fontWeight.medium,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {getDaysRemainingText(event.daysRemaining)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div
                style={{
                  textAlign: "center",
                  color: cssVars.textMuted,
                  padding: spacing[6],
                }}
              >
                Bu tarihte pano son tarihi yok
              </div>
            )
          ) : (
            <div
              style={{
                textAlign: "center",
                color: cssVars.textMuted,
                padding: spacing[6],
              }}
            >
              Detayları görmek için takvimden bir gün seçin
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
