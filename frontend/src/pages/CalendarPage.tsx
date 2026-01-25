import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, LayoutDashboard } from "lucide-react";
import { useBoards } from "../hooks/useBoards";
import { typography, spacing, radius, cssVars, colors, animation } from "../styles/tokens";
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
}

// Türkçe ay isimleri
const MONTH_NAMES = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
];

// Türkçe gün isimleri
const DAY_NAMES = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

const CalendarPage = () => {
  const navigate = useNavigate();
  const { boards, loading } = useBoards();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Son tarihe göre renk hesapla
  const getDeadlineColor = (deadline: string) => {
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
  };

  // Sadece board deadline'larından etkinlikleri çıkar
  const events = useMemo(() => {
    const allEvents: CalendarEvent[] = [];

    boards.forEach((board: Board) => {
      // Sadece Board deadline
      if (board.deadline) {
        const deadlineInfo = getDeadlineColor(board.deadline);
        allEvents.push({
          id: `board-${board.id}`,
          title: board.name,
          date: board.deadline.split('T')[0], // Sadece tarih kısmını al
          type: "board",
          boardSlug: board.slug,
          boardName: board.name,
          color: deadlineInfo.color,
          daysRemaining: deadlineInfo.days,
        });
      }
    });

    return allEvents;
  }, [boards]);

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
    const dateStr = date.toISOString().split("T")[0];
    return events.filter((event) => event.date === dateStr);
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
  const todayStr = today.toISOString().split("T")[0];

  // Seçili güne ait etkinlikler
  const selectedEvents = selectedDate
    ? events.filter((event) => event.date === selectedDate)
    : [];

  // Etkinlik tipine göre ikon
  const getEventIcon = () => {
    return <LayoutDashboard size={14} />;
  };

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

  if (loading) {
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
        </div>

        {/* Ay Navigasyonu */}
        <div style={{ display: "flex", alignItems: "center", gap: spacing[3] }}>
          <button
            onClick={() => changeMonth(-1)}
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
              const dateStr = date.toISOString().split("T")[0];
              const dayEvents = getEventsForDate(date);
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDate;

              return (
                <div
                  key={index}
                  onClick={() => setSelectedDate(dateStr)}
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
                    {dayEvents.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        style={{
                          padding: `${spacing[1]} ${spacing[1.5]}`,
                          borderRadius: radius.sm,
                          background: event.color,
                          color: "#fff",
                          fontSize: typography.fontSize.sm,
                          fontWeight: typography.fontWeight.semibold,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={event.title}
                      >
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div
                        style={{
                          fontSize: typography.fontSize.xs,
                          color: cssVars.textMuted,
                          textAlign: "center",
                        }}
                      >
                        +{dayEvents.length - 3} daha
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
                {selectedEvents.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => navigate(`/boards/${event.boardSlug}`)}
                    style={{
                      padding: spacing[3],
                      borderRadius: radius.md,
                      background: `${event.color}15`,
                      border: `1px solid ${event.color}40`,
                      cursor: "pointer",
                      transition: `all ${animation.duration.normal}`,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: spacing[2],
                        marginBottom: spacing[2],
                      }}
                    >
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "24px",
                          height: "24px",
                          borderRadius: radius.sm,
                          background: event.color,
                          color: "#fff",
                        }}
                      >
                        {getEventIcon()}
                      </span>
                      <span
                        style={{
                          fontSize: typography.fontSize.xs,
                          color: event.color,
                          textTransform: "uppercase",
                          letterSpacing: typography.letterSpacing.wide,
                          fontWeight: typography.fontWeight.semibold,
                        }}
                      >
                        Pano
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: typography.fontSize.lg,
                        fontWeight: typography.fontWeight.semibold,
                        color: cssVars.textMain,
                        marginBottom: spacing[1],
                      }}
                    >
                      {event.title}
                    </div>
                    <div
                      style={{
                        fontSize: typography.fontSize.sm,
                        color: event.color,
                        fontWeight: typography.fontWeight.medium,
                      }}
                    >
                      {getDaysRemainingText(event.daysRemaining)}
                    </div>
                  </div>
                ))}
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

          {/* Renk Kodları Açıklaması */}
          <div
            style={{
              marginTop: spacing[6],
              paddingTop: spacing[4],
              borderTop: `1px solid ${cssVars.border}`,
            }}
          >
            <h4
              style={{
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.semibold,
                color: cssVars.textMuted,
                marginBottom: spacing[3],
                textTransform: "uppercase",
                letterSpacing: typography.letterSpacing.wide,
              }}
            >
              Son Tarih Durumu
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: spacing[2] }}>
              {[
                { color: '#dc2626', label: "Gecikmiş" },
                { color: '#f97316', label: "Acil (3 gün veya daha az)" },
                { color: '#eab308', label: "Yaklaşıyor (7 gün veya daha az)" },
                { color: '#22c55e', label: "Normal (7 günden fazla)" },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: spacing[2],
                  }}
                >
                  <div
                    style={{
                      width: "12px",
                      height: "12px",
                      borderRadius: radius.sm,
                      background: item.color,
                    }}
                  />
                  <span
                    style={{
                      fontSize: typography.fontSize.sm,
                      color: cssVars.textMuted,
                    }}
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
