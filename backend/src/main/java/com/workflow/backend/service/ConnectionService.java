package com.workflow.backend.service;

import com.workflow.backend.dto.ConnectionResponse;
import com.workflow.backend.entity.*;
import com.workflow.backend.exception.BadRequestException;
import com.workflow.backend.exception.ResourceNotFoundException;
import com.workflow.backend.repository.ConnectionRepository;
import com.workflow.backend.repository.UserProfilePictureRepository;
import com.workflow.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ConnectionService {

    private final ConnectionRepository connectionRepository;
    private final UserRepository userRepository;
    private final UserProfilePictureRepository profilePictureRepository;
    private final NotificationService notificationService;
    private final CurrentUserService currentUserService;

    @Transactional
    public ConnectionResponse sendConnectionRequest(Long targetUserId) {
        Long currentUserId = currentUserService.getCurrentUserId();

        if (currentUserId.equals(targetUserId)) {
            throw new BadRequestException("Kendinize baglanti istegi gonderemezsiniz.");
        }

        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Kullanici", "id", currentUserId));

        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Kullanici", "id", targetUserId));

        // Zaten bir baglanti var mi kontrol et
        Optional<Connection> existing = connectionRepository.findBetweenUsers(currentUserId, targetUserId);
        if (existing.isPresent()) {
            Connection conn = existing.get();
            if (conn.getStatus() == ConnectionStatus.PENDING) {
                throw new BadRequestException("Zaten bekleyen bir baglanti istegi var.");
            }
            if (conn.getStatus() == ConnectionStatus.ACCEPTED) {
                throw new BadRequestException("Zaten baglantisiniz.");
            }
            // REJECTED ise yeni istek gonderilebilir - eski kaydi guncelle
            conn.setSender(currentUser);
            conn.setReceiver(targetUser);
            conn.setStatus(ConnectionStatus.PENDING);
            Connection saved = connectionRepository.save(conn);

            notificationService.createNotification(
                    targetUser, currentUser,
                    NotificationType.CONNECTION_REQUEST,
                    currentUser.getUsername() + " size baglanti istegi gonderdi",
                    saved.getId());

            return mapToResponse(saved);
        }

        // Yeni baglanti olustur
        Connection connection = new Connection();
        connection.setSender(currentUser);
        connection.setReceiver(targetUser);
        connection.setStatus(ConnectionStatus.PENDING);
        Connection saved = connectionRepository.save(connection);

        // Bildirim olustur
        notificationService.createNotification(
                targetUser, currentUser,
                NotificationType.CONNECTION_REQUEST,
                currentUser.getUsername() + " size baglanti istegi gonderdi",
                saved.getId());

        return mapToResponse(saved);
    }

    @Transactional
    public ConnectionResponse acceptConnectionRequest(Long connectionId) {
        Long currentUserId = currentUserService.getCurrentUserId();

        Connection connection = connectionRepository.findById(connectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Baglanti", "id", connectionId));

        if (!connection.getReceiver().getId().equals(currentUserId)) {
            throw new BadRequestException("Bu baglanti istegini sadece alan kisi kabul edebilir.");
        }

        if (connection.getStatus() != ConnectionStatus.PENDING) {
            throw new BadRequestException("Bu baglanti istegi zaten islendi.");
        }

        connection.setStatus(ConnectionStatus.ACCEPTED);
        Connection saved = connectionRepository.save(connection);

        // Gondericiye bildirim
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Kullanici", "id", currentUserId));

        // Baglanti istegi bildirimini sil
        notificationService.deleteByReference(connectionId, NotificationType.CONNECTION_REQUEST);

        notificationService.createNotification(
                connection.getSender(), currentUser,
                NotificationType.CONNECTION_ACCEPTED,
                currentUser.getUsername() + " baglanti isteginizi kabul etti",
                saved.getId());

        return mapToResponse(saved);
    }

    @Transactional
    public ConnectionResponse rejectConnectionRequest(Long connectionId) {
        Long currentUserId = currentUserService.getCurrentUserId();

        Connection connection = connectionRepository.findById(connectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Baglanti", "id", connectionId));

        if (!connection.getReceiver().getId().equals(currentUserId)) {
            throw new BadRequestException("Bu baglanti istegini sadece alan kisi reddedebilir.");
        }

        if (connection.getStatus() != ConnectionStatus.PENDING) {
            throw new BadRequestException("Bu baglanti istegi zaten islendi.");
        }

        connection.setStatus(ConnectionStatus.REJECTED);
        Connection saved = connectionRepository.save(connection);

        // Baglanti istegi bildirimini sil
        notificationService.deleteByReference(connectionId, NotificationType.CONNECTION_REQUEST);

        return mapToResponse(saved);
    }

    /**
     * Iki kullanici arasindaki baglanti durumunu dondurur.
     * SELF: Kendi profili
     * PENDING: Istek gonderdim, bekliyorum
     * PENDING_RECEIVED: Bana istek geldi
     * ACCEPTED: Baglantilar
     * REJECTED: Reddedilmis
     * null: Hicbir baglanti yok
     */
    public String getConnectionStatus(Long userId1, Long userId2) {
        if (userId1.equals(userId2)) {
            return "SELF";
        }

        Optional<Connection> connection = connectionRepository.findBetweenUsers(userId1, userId2);
        if (connection.isEmpty()) {
            return null;
        }

        Connection conn = connection.get();
        if (conn.getStatus() == ConnectionStatus.ACCEPTED) {
            return "ACCEPTED";
        }
        if (conn.getStatus() == ConnectionStatus.REJECTED) {
            return "REJECTED";
        }
        // PENDING - kim gonderdi?
        if (conn.getSender().getId().equals(userId1)) {
            return "PENDING";
        }
        return "PENDING_RECEIVED";
    }

    public Long getConnectionId(Long userId1, Long userId2) {
        if (userId1.equals(userId2)) {
            return null;
        }
        return connectionRepository.findBetweenUsers(userId1, userId2)
                .map(Connection::getId)
                .orElse(null);
    }

    public long getConnectionCount(Long userId) {
        return connectionRepository.countAcceptedByUserId(userId);
    }

    public long getMyConnectionCount() {
        Long currentUserId = currentUserService.getCurrentUserId();
        return connectionRepository.countAcceptedByUserId(currentUserId);
    }

    public List<ConnectionResponse> getPendingRequests() {
        Long currentUserId = currentUserService.getCurrentUserId();
        List<Connection> pending = connectionRepository.findByReceiverIdAndStatus(currentUserId, ConnectionStatus.PENDING);
        return pending.stream().map(this::mapToResponse).toList();
    }

    public List<ConnectionResponse> getAcceptedConnections() {
        Long currentUserId = currentUserService.getCurrentUserId();
        List<Connection> accepted = connectionRepository.findAcceptedByUserId(currentUserId);
        return accepted.stream().map(this::mapToResponse).toList();
    }

    @Transactional
    public void removeConnection(Long connectionId) {
        Long currentUserId = currentUserService.getCurrentUserId();

        Connection connection = connectionRepository.findById(connectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Baglanti", "id", connectionId));

        if (!connection.getSender().getId().equals(currentUserId) && !connection.getReceiver().getId().equals(currentUserId)) {
            throw new BadRequestException("Bu baglantiyi sadece taraflardan biri kaldirabilir.");
        }

        if (connection.getStatus() != ConnectionStatus.ACCEPTED) {
            throw new BadRequestException("Sadece kabul edilmis baglantilar kaldirılabilir.");
        }

        connectionRepository.delete(connection);
    }

    private ConnectionResponse mapToResponse(Connection connection) {
        ConnectionResponse response = new ConnectionResponse();
        response.setId(connection.getId());
        response.setSenderId(connection.getSender().getId());
        response.setSenderUsername(connection.getSender().getUsername());
        response.setSenderProfilePicture(
                profilePictureRepository.findPictureDataByUserId(connection.getSender().getId()).orElse(null));
        response.setReceiverId(connection.getReceiver().getId());
        response.setReceiverUsername(connection.getReceiver().getUsername());
        response.setReceiverProfilePicture(
                profilePictureRepository.findPictureDataByUserId(connection.getReceiver().getId()).orElse(null));
        response.setStatus(connection.getStatus().name());
        response.setCreatedAt(connection.getCreatedAt());
        return response;
    }
}
