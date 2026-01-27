import { Link } from "react-router-dom";
import { Users, AlertCircle } from "lucide-react";
import { useAcceptedConnections, useRemoveConnection } from "../hooks/queries/useConnectionMutations";
import { useAuthStore } from "../stores/authStore";
import "./ConnectionsPage.css";

const ConnectionsPage = () => {
  const { data: connections, isLoading, error } = useAcceptedConnections();
  const removeConnection = useRemoveConnection();
  const currentUsername = useAuthStore((state) => state.username);

  if (isLoading) {
    return (
      <div className="connections-page">
        <div className="connections-page__loading">
          <div className="connections-page__spinner" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="connections-page">
        <div className="connections-page__error">
          <div className="connections-page__error-icon">
            <AlertCircle size={32} color="var(--danger)" />
          </div>
          <h2 className="connections-page__error-title">Bir Hata Olustu</h2>
          <p className="connections-page__error-text">Baglantilar yuklenirken bir hata olustu.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="connections-page">
      {/* Header */}
      <div className="connections-page__header">
        <div className="connections-page__header-icon">
          <Users size={22} color="var(--primary)" strokeWidth={2} />
        </div>
        <h1 className="connections-page__title">Agim</h1>
        <span className="connections-page__count">{connections?.length ?? 0}</span>
      </div>

      {/* Content */}
      {!connections || connections.length === 0 ? (
        <div className="connections-page__empty">
          <div className="connections-page__empty-icon">
            <Users size={32} color="var(--text-muted)" />
          </div>
          <h2 className="connections-page__empty-title">Henuz baglantiniz yok</h2>
          <p className="connections-page__empty-text">
            Kullanicilari arayarak baglanti istegi gonderebilirsiniz.
          </p>
        </div>
      ) : (
        <div className="connections-page__list">
          {connections.map((connection) => {
            const isCurrentUserSender = connection.senderUsername === currentUsername;
            const otherUsername = isCurrentUserSender ? connection.receiverUsername : connection.senderUsername;
            const otherProfilePicture = isCurrentUserSender ? connection.receiverProfilePicture : connection.senderProfilePicture;
            const initials = otherUsername.substring(0, 2).toUpperCase();

            return (
              <div key={connection.id} className="connections-page__item">
                <div
                  className="connections-page__avatar"
                  style={otherProfilePicture ? {
                    backgroundImage: `url(${otherProfilePicture})`,
                    background: undefined,
                  } : undefined}
                >
                  {!otherProfilePicture && initials}
                </div>
                <div className="connections-page__user-info">
                  <Link to={`/profile/${otherUsername}`} className="connections-page__username-link">
                    {otherUsername}
                  </Link>
                </div>
                <button
                  className="connections-page__remove-btn"
                  onClick={() => removeConnection.mutate(connection.id)}
                  disabled={removeConnection.isPending}
                >
                  Kaldir
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ConnectionsPage;
