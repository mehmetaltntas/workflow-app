import { useState } from "react";
import { Link } from "react-router-dom";
import { Users, AlertCircle, UserPlus, Check, X, UserX } from "lucide-react";
import { useAcceptedConnections, useRemoveConnection, usePendingRequests, useAcceptConnectionRequest, useRejectConnectionRequest } from "../hooks/queries/useConnectionMutations";
import { useAuthStore } from "../stores/authStore";
import { ActionMenu } from "../components/ActionMenu";
import { ConfirmationModal } from "../components/ConfirmationModal";
import "./ConnectionsPage.css";

const ConnectionsPage = () => {
  const { data: connections, isLoading, error } = useAcceptedConnections();
  const { data: pendingRequests, isLoading: pendingLoading } = usePendingRequests();
  const removeConnection = useRemoveConnection();
  const acceptRequest = useAcceptConnectionRequest();
  const rejectRequest = useRejectConnectionRequest();
  const currentUsername = useAuthStore((state) => state.username);
  const [connectionToRemove, setConnectionToRemove] = useState<{ id: number; displayName: string } | null>(null);

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

      {/* Pending Requests */}
      {!pendingLoading && pendingRequests && pendingRequests.length > 0 && (
        <div className="connections-page__pending-section">
          <div className="connections-page__section-header">
            <div className="connections-page__section-header-icon">
              <UserPlus size={18} color="var(--warning)" strokeWidth={2} />
            </div>
            <h2 className="connections-page__section-title">Baglanti Istekleri</h2>
            <span className="connections-page__pending-badge">{pendingRequests.length}</span>
          </div>
          <div className="connections-page__list">
            {pendingRequests.map((request) => {
              const fullName = request.senderFirstName && request.senderLastName
                ? `${request.senderFirstName} ${request.senderLastName}`
                : null;
              const initials = request.senderFirstName && request.senderLastName
                ? `${request.senderFirstName.charAt(0)}${request.senderLastName.charAt(0)}`.toUpperCase()
                : request.senderUsername.substring(0, 2).toUpperCase();

              return (
                <div key={request.id} className="connections-page__item">
                  <div
                    className="connections-page__avatar"
                    style={request.senderProfilePicture ? {
                      backgroundImage: `url(${request.senderProfilePicture})`,
                      background: undefined,
                    } : undefined}
                  >
                    {!request.senderProfilePicture && initials}
                  </div>
                  <div className="connections-page__user-info">
                    {fullName && (
                      <Link to={`/profile/${request.senderUsername}`} className="connections-page__fullname-link">
                        {fullName}
                      </Link>
                    )}
                    <Link to={`/profile/${request.senderUsername}`} className="connections-page__username-link">
                      @{request.senderUsername}
                    </Link>
                  </div>
                  <div className="connections-page__request-actions">
                    <button
                      className="connections-page__accept-btn"
                      onClick={() => acceptRequest.mutate(request.id)}
                      disabled={acceptRequest.isPending || rejectRequest.isPending}
                    >
                      <Check size={16} />
                      Kabul Et
                    </button>
                    <button
                      className="connections-page__reject-btn"
                      onClick={() => rejectRequest.mutate(request.id)}
                      disabled={acceptRequest.isPending || rejectRequest.isPending}
                    >
                      <X size={16} />
                      Reddet
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
            const otherFirstName = isCurrentUserSender ? connection.receiverFirstName : connection.senderFirstName;
            const otherLastName = isCurrentUserSender ? connection.receiverLastName : connection.senderLastName;
            const otherProfilePicture = isCurrentUserSender ? connection.receiverProfilePicture : connection.senderProfilePicture;
            const fullName = otherFirstName && otherLastName ? `${otherFirstName} ${otherLastName}` : null;
            const initials = otherFirstName && otherLastName
              ? `${otherFirstName.charAt(0)}${otherLastName.charAt(0)}`.toUpperCase()
              : otherUsername.substring(0, 2).toUpperCase();

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
                  {fullName && (
                    <Link to={`/profile/${otherUsername}`} className="connections-page__fullname-link">
                      {fullName}
                    </Link>
                  )}
                  <Link to={`/profile/${otherUsername}`} className="connections-page__username-link">
                    @{otherUsername}
                  </Link>
                </div>
                <ActionMenu
                  items={[{
                    label: "Bağlantıyı Kaldır",
                    onClick: () => setConnectionToRemove({
                      id: connection.id,
                      displayName: fullName || otherUsername,
                    }),
                    variant: "danger",
                    icon: UserX,
                  }]}
                  dropdownPosition="left"
                />
              </div>
            );
          })}
        </div>
      )}

      <ConfirmationModal
        isOpen={!!connectionToRemove}
        title="Bağlantıyı Kaldır"
        message={
          connectionToRemove
            ? `${connectionToRemove.displayName} adlı kullanıcıyı bağlantılardan kaldırmak istediğinize emin misiniz? Endişelenmeyin, WorkFlow ${connectionToRemove.displayName} adlı kullanıcıyı bilgilendirmez.`
            : ""
        }
        confirmText="Evet, Kaldır"
        cancelText="İptal"
        variant="danger"
        onConfirm={() => {
          if (connectionToRemove) {
            removeConnection.mutate(connectionToRemove.id);
          }
          setConnectionToRemove(null);
        }}
        onCancel={() => setConnectionToRemove(null)}
      />
    </div>
  );
};

export default ConnectionsPage;
