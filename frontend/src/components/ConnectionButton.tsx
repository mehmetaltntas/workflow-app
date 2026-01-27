import { UserPlus, Clock, Check, X, UserCheck } from "lucide-react";
import { useSendConnectionRequest, useAcceptConnectionRequest, useRejectConnectionRequest } from "../hooks/queries/useConnectionMutations";
import type { ConnectionStatus } from "../types";
import "./ConnectionButton.css";

interface ConnectionButtonProps {
  userId: number;
  connectionStatus: ConnectionStatus;
  referenceId?: number | null;
}

const ConnectionButton = ({ userId, connectionStatus, referenceId }: ConnectionButtonProps) => {
  const { mutate: sendRequest, isPending: isSending } = useSendConnectionRequest();
  const { mutate: acceptRequest, isPending: isAccepting } = useAcceptConnectionRequest();
  const { mutate: rejectRequest, isPending: isRejecting } = useRejectConnectionRequest();

  if (connectionStatus === "SELF") {
    return null;
  }

  if (connectionStatus === "ACCEPTED") {
    return (
      <button className="connection-btn connection-btn--connected" disabled>
        <UserCheck size={16} />
        <span>Baglanti</span>
      </button>
    );
  }

  if (connectionStatus === "PENDING") {
    return (
      <button className="connection-btn connection-btn--pending" disabled>
        <Clock size={16} />
        <span>Istek Gonderildi</span>
      </button>
    );
  }

  if (connectionStatus === "PENDING_RECEIVED") {
    return (
      <div className="connection-btn-group">
        <button
          className="connection-btn connection-btn--accept"
          onClick={() => referenceId && acceptRequest(referenceId)}
          disabled={isAccepting}
        >
          <Check size={16} />
          <span>Kabul Et</span>
        </button>
        <button
          className="connection-btn connection-btn--reject"
          onClick={() => referenceId && rejectRequest(referenceId)}
          disabled={isRejecting}
        >
          <X size={16} />
          <span>Reddet</span>
        </button>
      </div>
    );
  }

  // null veya REJECTED - yeni istek gonderilebilir
  return (
    <button
      className="connection-btn connection-btn--send"
      onClick={() => sendRequest(userId)}
      disabled={isSending}
    >
      <UserPlus size={16} />
      <span>{isSending ? "Gonderiliyor..." : "Baglanti Gonder"}</span>
    </button>
  );
};

export default ConnectionButton;
