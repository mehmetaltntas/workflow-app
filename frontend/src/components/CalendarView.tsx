import React, { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Calendar, Flag, CheckCircle2 } from "lucide-react";
import type { Board, Task, Priority } from "../types";
import { colors, cssVars } from "../styles/tokens";

interface CalendarViewProps {
  board: Board;
  onTaskClick: (task: Task) => void;
}

interface DayTasks {
  date: Date;
  tasks: Task[];
}

// Priority renkleri
const getPriorityColor = (priority: Priority | undefined): string => {
  switch (priority) {
    case 'HIGH': return colors.priority.high;
    case 'MEDIUM': return colors.priority.medium;
    case 'LOW': return colors.priority.low;
    default: return colors.brand.primary;
  }
};

// Ay isimleri (Türkçe)
const MONTH_NAMES = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
];

// Gün isimleri (Türkçe)
const DAY_NAMES = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

export const CalendarView: React.FC<CalendarViewProps> = ({ board, onTaskClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Tüm görevleri düz liste olarak al
  const allTasks = useMemo(() => {
    const tasks: Task[] = [];
    board.taskLists?.forEach(list => {
      list.tasks?.forEach(task => {
        if (task.dueDate) {
          tasks.push(task);
        }
      });
    });
    return tasks;
  }, [board]);

  // Ayın günlerini hesapla
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Ayın ilk günü
    const firstDay = new Date(year, month, 1);
    // Ayın son günü
    const lastDay = new Date(year, month + 1, 0);

    // Haftanın hangi günü başlıyor (0 = Pazar, 1 = Pazartesi, ...)
    // Pazartesi'den başlaması için ayarlama
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek < 0) startDayOfWeek = 6;

    const days: DayTasks[] = [];

    // Önceki aydan günler (boş)
    for (let i = 0; i < startDayOfWeek; i++) {
      const prevDate = new Date(year, month, -startDayOfWeek + i + 1);
      days.push({ date: prevDate, tasks: [] });
    }

    // Bu ayın günleri
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      const dayTasks = allTasks.filter(task => {
        const taskDate = new Date(task.dueDate!);
        return (
          taskDate.getFullYear() === date.getFullYear() &&
          taskDate.getMonth() === date.getMonth() &&
          taskDate.getDate() === date.getDate()
        );
      });
      days.push({ date, tasks: dayTasks });
    }

    // Sonraki aydan günler (6 satır tamamlamak için)
    const remainingDays = 42 - days.length; // 6 satır x 7 gün = 42
    for (let i = 1; i <= remainingDays; i++) {
      const nextDate = new Date(year, month + 1, i);
      days.push({ date: nextDate, tasks: [] });
    }

    return days;
  }, [currentDate, allTasks]);

  // Önceki ay
  const goToPrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  // Sonraki ay
  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Bugüne git
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Bugün mü kontrol
  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Bu ay mı kontrol
  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  return (
    <div style={{
      background: colors.dark.bg.overlay,
      borderRadius: "16px",
      padding: "20px",
      margin: "20px",
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "20px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button
            onClick={goToPrevMonth}
            style={{
              background: colors.dark.bg.hover,
              border: `1px solid ${cssVars.border}`,
              borderRadius: "8px",
              padding: "8px",
              cursor: "pointer",
              color: colors.dark.text.secondary,
              display: "flex",
              alignItems: "center",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = colors.dark.bg.active}
            onMouseLeave={e => e.currentTarget.style.background = colors.dark.bg.hover}
          >
            <ChevronLeft size={20} />
          </button>

          <h2 style={{
            fontSize: "20px",
            fontWeight: "700",
            color: "var(--text-main)",
            minWidth: "180px",
            textAlign: "center",
          }}>
            {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>

          <button
            onClick={goToNextMonth}
            style={{
              background: colors.dark.bg.hover,
              border: `1px solid ${cssVars.border}`,
              borderRadius: "8px",
              padding: "8px",
              cursor: "pointer",
              color: colors.dark.text.secondary,
              display: "flex",
              alignItems: "center",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = colors.dark.bg.active}
            onMouseLeave={e => e.currentTarget.style.background = colors.dark.bg.hover}
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <button
          onClick={goToToday}
          style={{
            background: colors.brand.primary,
            border: "none",
            borderRadius: "8px",
            padding: "8px 16px",
            cursor: "pointer",
            color: cssVars.textInverse,
            fontSize: "13px",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            transition: "all 0.2s",
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
          onMouseLeave={e => e.currentTarget.style.opacity = "1"}
        >
          <Calendar size={14} />
          Bugün
        </button>
      </div>

      {/* Day Headers */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(7, 1fr)",
        gap: "4px",
        marginBottom: "8px",
      }}>
        {DAY_NAMES.map(day => (
          <div
            key={day}
            style={{
              textAlign: "center",
              fontSize: "12px",
              fontWeight: "600",
              color: colors.dark.text.tertiary,
              padding: "8px",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(7, 1fr)",
        gap: "4px",
      }}>
        {calendarDays.map((day, index) => (
          <div
            key={index}
            style={{
              minHeight: "100px",
              background: isToday(day.date)
                ? colors.brand.primaryLight
                : isCurrentMonth(day.date)
                  ? colors.dark.glass.bg
                  : colors.dark.bg.hover,
              borderRadius: "8px",
              padding: "8px",
              border: isToday(day.date)
                ? `1px solid ${colors.dark.border.focus}`
                : `1px solid ${colors.dark.border.subtle}`,
              opacity: isCurrentMonth(day.date) ? 1 : 0.4,
            }}
          >
            {/* Day Number */}
            <div style={{
              fontSize: "13px",
              fontWeight: isToday(day.date) ? "700" : "500",
              color: isToday(day.date) ? colors.brand.primary : colors.dark.text.secondary,
              marginBottom: "6px",
            }}>
              {day.date.getDate()}
            </div>

            {/* Tasks */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {day.tasks.slice(0, 3).map(task => (
                <div
                  key={task.id}
                  onClick={() => onTaskClick(task)}
                  style={{
                    fontSize: "11px",
                    padding: "4px 6px",
                    borderRadius: "4px",
                    background: task.isCompleted
                      ? colors.semantic.successLight
                      : `${getPriorityColor(task.priority)}20`,
                    color: task.isCompleted
                      ? colors.semantic.success
                      : colors.dark.text.secondary,
                    cursor: "pointer",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    borderLeft: `2px solid ${task.isCompleted ? colors.semantic.success : getPriorityColor(task.priority)}`,
                    transition: "all 0.2s",
                    textDecoration: task.isCompleted ? "line-through" : "none",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = task.isCompleted
                      ? `${colors.semantic.success}40`
                      : `${getPriorityColor(task.priority)}35`;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = task.isCompleted
                      ? colors.semantic.successLight
                      : `${getPriorityColor(task.priority)}20`;
                  }}
                >
                  {task.isCompleted && <CheckCircle2 size={10} />}
                  {!task.isCompleted && task.priority && task.priority !== 'NONE' && (
                    <Flag size={9} style={{ color: getPriorityColor(task.priority) }} />
                  )}
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                    {task.title}
                  </span>
                </div>
              ))}

              {/* More indicator */}
              {day.tasks.length > 3 && (
                <div style={{
                  fontSize: "10px",
                  color: colors.dark.text.tertiary,
                  textAlign: "center",
                  padding: "2px",
                }}>
                  +{day.tasks.length - 3} daha
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{
        display: "flex",
        justifyContent: "center",
        gap: "20px",
        marginTop: "16px",
        paddingTop: "16px",
        borderTop: `1px solid ${colors.dark.border.subtle}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: colors.dark.text.tertiary }}>
          <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: colors.priority.high }} />
          Yüksek Öncelik
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: colors.dark.text.tertiary }}>
          <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: colors.priority.medium }} />
          Orta Öncelik
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: colors.dark.text.tertiary }}>
          <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: colors.priority.low }} />
          Düşük / Tamamlandı
        </div>
      </div>
    </div>
  );
};
