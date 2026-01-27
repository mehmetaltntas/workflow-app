package com.workflow.backend.service;

import com.workflow.backend.dto.NotificationResponse;
import com.workflow.backend.entity.ConnectionStatus;
import com.workflow.backend.entity.Notification;
import com.workflow.backend.entity.NotificationType;
import com.workflow.backend.entity.User;
import com.workflow.backend.exception.ResourceNotFoundException;
import com.workflow.backend.repository.ConnectionRepository;
import com.workflow.backend.repository.NotificationRepository;
import com.workflow.backend.repository.UserProfilePictureRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final ConnectionRepository connectionRepository;
    private final UserProfilePictureRepository profilePictureRepository;
    private final CurrentUserService currentUserService;

    public Notification createNotification(User recipient, User actor, NotificationType type, String message, Long referenceId) {
        Notification notification = new Notification();
        notification.setRecipient(recipient);
        notification.setActor(actor);
        notification.setType(type);
        notification.setMessage(message);
        notification.setReferenceId(referenceId);
        return notificationRepository.save(notification);
    }

    public List<NotificationResponse> getNotifications() {
        Long currentUserId = currentUserService.getCurrentUserId();
        List<Notification> notifications = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(currentUserId);

        // Artik PENDING olmayan baglanti isteklerinin bildirimlerini filtrele
        List<Long> connectionRequestRefIds = notifications.stream()
                .filter(n -> n.getType() == NotificationType.CONNECTION_REQUEST && n.getReferenceId() != null)
                .map(Notification::getReferenceId)
                .toList();

        if (!connectionRequestRefIds.isEmpty()) {
            Set<Long> pendingConnectionIds = connectionRepository.findAllById(connectionRequestRefIds).stream()
                    .filter(c -> c.getStatus() == ConnectionStatus.PENDING)
                    .map(c -> c.getId())
                    .collect(Collectors.toSet());

            notifications = notifications.stream()
                    .filter(n -> {
                        if (n.getType() == NotificationType.CONNECTION_REQUEST && n.getReferenceId() != null) {
                            return pendingConnectionIds.contains(n.getReferenceId());
                        }
                        return true;
                    })
                    .toList();
        }

        return notifications.stream().map(this::mapToResponse).toList();
    }

    public long getUnreadCount() {
        Long currentUserId = currentUserService.getCurrentUserId();
        return notificationRepository.countUnreadByRecipientId(currentUserId);
    }

    @Transactional
    public NotificationResponse markAsRead(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Bildirim", "id", notificationId));

        Long currentUserId = currentUserService.getCurrentUserId();
        if (!notification.getRecipient().getId().equals(currentUserId)) {
            throw new ResourceNotFoundException("Bildirim", "id", notificationId);
        }

        notification.setIsRead(true);
        Notification saved = notificationRepository.save(notification);
        return mapToResponse(saved);
    }

    @Transactional
    public void markAllAsRead() {
        Long currentUserId = currentUserService.getCurrentUserId();
        notificationRepository.markAllAsReadByRecipientId(currentUserId);
    }

    @Transactional
    public void deleteByReference(Long referenceId, NotificationType type) {
        notificationRepository.deleteByReferenceIdAndType(referenceId, type);
    }

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void cleanupStaleNotifications() {
        notificationRepository.deleteStaleConnectionRequestNotifications();
        log.info("Eski CONNECTION_REQUEST bildirimleri temizlendi");
    }

    private NotificationResponse mapToResponse(Notification notification) {
        NotificationResponse response = new NotificationResponse();
        response.setId(notification.getId());
        response.setType(notification.getType().name());
        response.setMessage(notification.getMessage());
        response.setIsRead(notification.getIsRead());
        response.setActorId(notification.getActor().getId());
        response.setActorUsername(notification.getActor().getUsername());
        response.setActorProfilePicture(
                profilePictureRepository.findPictureDataByUserId(notification.getActor().getId()).orElse(null));
        response.setReferenceId(notification.getReferenceId());
        response.setCreatedAt(notification.getCreatedAt());
        return response;
    }
}
