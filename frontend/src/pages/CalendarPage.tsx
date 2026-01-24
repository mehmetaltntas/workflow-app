import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, LayoutDashboard, ListTodo, CheckSquare } from "lucide-react";
import { useBoards } from "../hooks/useBoards";
import { typography, spacing, radius, cssVars, colors, animation } from "../styles/tokens";
import type { Board, Task, TaskList, Subtask } from "../types";

// Takvim etkinlik tipi
interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: "board" | "tasklist" | "task" | "subtask";
  boardSlug: string;
  boardName: string;
  color: string;
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

  // Tüm board, tasklist, task ve subtask'lardan etkinlikleri çıkar
  const events = useMemo(() => {
    const allEvents: CalendarEvent[] = [];

    boards.forEach((board: Board) => {
      // Board deadline
      if (board.deadline) {
        allEvents.push({
          id: `board-${board.id}`,
          title: board.name,
          date: board.deadline,
          type: "board",
          boardSlug: board.slug,
          boardName: board.name,
          color: colors.status.planned,
        });
      }

      // TaskList due dates
      board.taskLists?.forEach((taskList: TaskList) => {
        if (taskList.dueDate) {
          allEvents.push({
            id: `tasklist-${taskList.id}`,
            title: taskList.name,
            date: taskList.dueDate,
            type: "tasklist",
            boardSlug: board.slug,
            boardName: board.name,
            color: colors.status.inProgress,
          });
        }

        // Task due dates
        taskList.tasks?.forEach((task: Task) => {
          if (task.dueDate) {
            allEvents.push({
              id: `task-${task.id}`,
              title: task.title,
              date: task.dueDate,
              type: "task",
              boardSlug: board.slug,
              boardName: board.name,
              color: colors.status.completed,
            });
          }

          // Subtask due dates
          task.subtasks?.forEach((subtask: Subtask) => {
            if (subtask.dueDate) {
              allEvents.push({
                id: `subtask-${subtask.id}`,
                title: subtask.title,
                date: subtask.dueDate,
                type: "subtask",
                boardSlug: board.slug,
                boardName: board.name,
                color: colors.semantic.warning,
              });
            }
          });
        });
      });
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
  const getEventIcon = (type: string) => {
    switch (type) {
      case "board":
        return <LayoutDashboard size={14} />;
      case "tasklist":
        return <ListTodo size={14} />;
      case "task":
        return <CheckSquare size={14} />;
      case "subtask":
        return <CheckSquare size={12} />;
      default:
        return <CalendarIcon size={14} />;
    }
  };

  // Etkinlik tipine göre Türkçe isim
  const getEventTypeName = (type: string) => {
    switch (type) {
      case "board":
        return "Pano";
      case "tasklist":
        return "Liste";
      case "task":
        return "Görev";
      case "subtask":
        return "Alt Görev";
      default:
        return "";
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
                          padding: `${spacing[0.5]} ${spacing[1]}`,
                          borderRadius: radius.sm,
                          background: event.color,
                          color: "#fff",
                          fontSize: typography.fontSize.xs,
                          fontWeight: typography.fontWeight.medium,
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
                      background: cssVars.bgSecondary,
                      border: `1px solid ${cssVars.border}`,
                      cursor: "pointer",
                      transition: `all ${animation.duration.normal}`,
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
                        {getEventIcon(event.type)}
                      </span>
                      <span
                        style={{
                          fontSize: typography.fontSize.xs,
                          color: cssVars.textMuted,
                          textTransform: "uppercase",
                          letterSpacing: typography.letterSpacing.wide,
                        }}
                      >
                        {getEventTypeName(event.type)}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: typography.fontSize.base,
                        fontWeight: typography.fontWeight.medium,
                        color: cssVars.textMain,
                        marginBottom: spacing[1],
                      }}
                    >
                      {event.title}
                    </div>
                    <div
                      style={{
                        fontSize: typography.fontSize.sm,
                        color: cssVars.textMuted,
                      }}
                    >
                      {event.boardName}
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
                Bu tarihte etkinlik yok
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

          {/* Etkinlik Türleri Açıklaması */}
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
              Renk Kodları
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: spacing[2] }}>
              {[
                { color: colors.status.planned, label: "Pano Deadline" },
                { color: colors.status.inProgress, label: "Liste Bitiş Tarihi" },
                { color: colors.status.completed, label: "Görev Bitiş Tarihi" },
                { color: colors.semantic.warning, label: "Alt Görev Bitiş Tarihi" },
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
