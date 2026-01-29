import { useNavigate } from "react-router-dom";
import { Bell, AlertCircle, User, Trash2, Check, X } from "lucide-react";
import { useNotifications, useDeleteNotification, useMarkAllNotificationsAsRead } from "../hooks/queries/useNotifications";
import { useAcceptConnectionRequest, useRejectConnectionRequest } from "../hooks/queries/useConnectionMutations";
import { useAcceptBoardMemberInvitation, useRejectBoardMemberInvitation } from "../hooks/queries/useBoardMemberInvitationMutations";
import type { Notification } from "../types";
import "./NotificationsPage.css";

const NotificationsPage = () => {
  const navigate = useNavigate();
  const { data: notifications = [], isLoading, error } = useNotifications();
  const { mutate: deleteNotification } = useDeleteNotification();
  const { mutate: markAllAsRead } = useMarkAllNotificationsAsRead();
  const { mutate: acceptConnection } = useAcceptConnectionRequest();
  const { mutate: rejectConnection } = useRejectConnectionRequest();
  const { mutate: acceptBoardInvitation } = useAcceptBoardMemberInvitation();
  const { mutate: rejectBoardInvitation } = useRejectBoardMemberInvitation();

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

  const handleClickNotification = (notification: Notification) => {
    if (notification.actorUsername) {
      navigate(`/profile/${notification.actorUsername}`);
    }
  };

  if (isLoading) {
    return (
      <div className="notifications-page">
        <div className="notifications-page__loading">
          <div className="notifications-page__spinner" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="notifications-page">
        <div className="notifications-page__error">
          <div className="notifications-page__error-icon">
            <AlertCircle size={32} color="var(--danger)" />
          </div>
          <h2 className="notifications-page__error-title">Bir Hata Olustu</h2>
          <p className="notifications-page__error-text">Bildirimler yuklenirken bir hata olustu.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="notifications-page">
      {/* Header */}
      <div className="notifications-page__header">
        <div className="notifications-page__header-icon">
          <Bell size={22} color="var(--primary)" strokeWidth={2} />
        </div>
        <h1 className="notifications-page__title">Bildirimler</h1>
        <span className="notifications-page__count">{notifications.length}</span>
        {notifications.length > 0 && (
          <button
            className="notifications-page__mark-all"
            onClick={() => markAllAsRead()}
          >
            Tumunu Okundu Isaretle
          </button>
        )}
      </div>

      {/* Content */}
      {notifications.length === 0 ? (
        <div className="notifications-page__empty">
          <div className="notifications-page__empty-icon">
            <Bell size={32} color="var(--text-muted)" />
          </div>
          <h2 className="notifications-page__empty-title">Bildirim yok</h2>
          <p className="notifications-page__empty-text">
            Henuz herhangi bir bildiriminiz bulunmuyor.
          </p>
        </div>
      ) : (
        <div className="notifications-page__list">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`notifications-page__item ${!notification.isRead ? "notifications-page__item--unread" : ""}`}
            >
              <div
                className="notifications-page__avatar"
                onClick={() => handleClickNotification(notification)}
              >
                {notification.actorProfilePicture ? (
                  <img src={notification.actorProfilePicture} alt={notification.actorUsername} />
                ) : (
                  <User size={18} />
                )}
              </div>
              <div
                className="notifications-page__content"
                onClick={() => handleClickNotification(notification)}
              >
                <p className="notifications-page__message">{notification.message}</p>
                <span className="notifications-page__time">{formatTime(notification.createdAt)}</span>
                {notification.type === "CONNECTION_REQUEST" && notification.referenceId && (
                  <div className="notifications-page__actions">
                    <button
                      className="notifications-page__accept"
                      onClick={(e) => { e.stopPropagation(); acceptConnection(notification.referenceId!); }}
                    >
                      <Check size={14} />
                      Kabul Et
                    </button>
                    <button
                      className="notifications-page__reject"
                      onClick={(e) => { e.stopPropagation(); rejectConnection(notification.referenceId!); }}
                    >
                      <X size={14} />
                      Reddet
                    </button>
                  </div>
                )}
                {notification.type === "BOARD_MEMBER_INVITATION" && notification.referenceId && (
                  <div className="notifications-page__actions">
                    <button
                      className="notifications-page__accept"
                      onClick={(e) => { e.stopPropagation(); acceptBoardInvitation(notification.referenceId!); }}
                    >
                      <Check size={14} />
                      Kabul Et
                    </button>
                    <button
                      className="notifications-page__reject"
                      onClick={(e) => { e.stopPropagation(); rejectBoardInvitation(notification.referenceId!); }}
                    >
                      <X size={14} />
                      Reddet
                    </button>
                  </div>
                )}
              </div>
              <button
                className="notifications-page__delete"
                onClick={() => deleteNotification(notification.id)}
                title="Bildirimi sil"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
