import { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";
import { useUnreadNotificationCount } from "../hooks/queries/useNotifications";
import NotificationDropdown from "./NotificationDropdown";
import "./NotificationBell.css";

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { data: unreadCount = 0 } = useUnreadNotificationCount();

  // Disina tiklaninca kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className="notification-bell" ref={wrapperRef}>
      <button
        className="notification-bell__btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Bildirimler"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="notification-bell__badge">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && <NotificationDropdown onClose={() => setIsOpen(false)} />}
    </div>
  );
};

export default NotificationBell;
