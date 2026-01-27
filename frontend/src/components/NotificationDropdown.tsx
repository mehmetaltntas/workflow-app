import { User, Check, X, CheckCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNotifications, useMarkAllNotificationsAsRead } from "../hooks/queries/useNotifications";
import { useAcceptConnectionRequest, useRejectConnectionRequest } from "../hooks/queries/useConnectionMutations";
import type { Notification } from "../types";
import "./NotificationDropdown.css";

interface NotificationDropdownProps {
  onClose: () => void;
}

const NotificationDropdown = ({ onClose }: NotificationDropdownProps) => {
  const navigate = useNavigate();
  const { data: notifications = [], isLoading } = useNotifications();
  const { mutate: markAllAsRead } = useMarkAllNotificationsAsRead();
  const { mutate: acceptConnection } = useAcceptConnectionRequest();
  const { mutate: rejectConnection } = useRejectConnectionRequest();

  const handleAccept = (e: React.MouseEvent, referenceId: number | null) => {
    e.stopPropagation();
    if (referenceId) {
      acceptConnection(referenceId);
    }
  };

  const handleReject = (e: React.MouseEvent, referenceId: number | null) => {
    e.stopPropagation();
    if (referenceId) {
      rejectConnection(referenceId);
    }
  };

  const handleClickNotification = (notification: Notification) => {
    onClose();
    if (notification.actorUsername) {
      navigate(`/profile/${notification.actorUsername}`);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffMin < 1) return "Az once";
    if (diffMin < 60) return `${diffMin}dk`;
    if (diffHour < 24) return `${diffHour}sa`;
    if (diffDay < 7) return `${diffDay}g`;
    return date.toLocaleDateString("tr-TR");
  };

  return (
    <div className="notification-dropdown">
      <div className="notification-dropdown__header">
        <span className="notification-dropdown__title">Bildirimler</span>
        {notifications.length > 0 && (
          <button
            className="notification-dropdown__mark-all"
            onClick={() => markAllAsRead()}
          >
            <CheckCheck size={14} />
            Tumunu okundu isaretle
          </button>
        )}
      </div>

      <div className="notification-dropdown__list">
        {isLoading && (
          <div className="notification-dropdown__empty">Yukleniyor...</div>
        )}
        {!isLoading && notifications.length === 0 && (
          <div className="notification-dropdown__empty">Bildirim yok</div>
        )}
        {!isLoading && notifications.map((notification) => (
          <div
            key={notification.id}
            className={`notification-dropdown__item ${!notification.isRead ? "notification-dropdown__item--unread" : ""}`}
            onClick={() => handleClickNotification(notification)}
          >
            <div className="notification-dropdown__avatar">
              {notification.actorProfilePicture ? (
                <img src={notification.actorProfilePicture} alt={notification.actorUsername} />
              ) : (
                <User size={16} />
              )}
            </div>
            <div className="notification-dropdown__content">
              <p className="notification-dropdown__message">{notification.message}</p>
              <span className="notification-dropdown__time">{formatTime(notification.createdAt)}</span>
              {notification.type === "CONNECTION_REQUEST" && !notification.isRead && notification.referenceId && (
                <div className="notification-dropdown__actions">
                  <button
                    className="notification-dropdown__accept"
                    onClick={(e) => handleAccept(e, notification.referenceId)}
                  >
                    <Check size={14} />
                    Kabul Et
                  </button>
                  <button
                    className="notification-dropdown__reject"
                    onClick={(e) => handleReject(e, notification.referenceId)}
                  >
                    <X size={14} />
                    Reddet
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationDropdown;
