package com.workflow.backend.repository;

import com.workflow.backend.entity.Notification;
import com.workflow.backend.entity.NotificationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    @Query("SELECT n FROM Notification n JOIN FETCH n.actor WHERE n.recipient.id = :recipientId ORDER BY n.createdAt DESC")
    List<Notification> findByRecipientIdOrderByCreatedAtDesc(@Param("recipientId") Long recipientId);

    @Query("SELECT COUNT(n) FROM Notification n WHERE n.recipient.id = :recipientId AND n.isRead = false")
    long countUnreadByRecipientId(@Param("recipientId") Long recipientId);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.recipient.id = :recipientId AND n.isRead = false")
    void markAllAsReadByRecipientId(@Param("recipientId") Long recipientId);

    @Modifying
    @Query("DELETE FROM Notification n WHERE n.referenceId = :referenceId AND n.type = :type")
    void deleteByReferenceIdAndType(@Param("referenceId") Long referenceId, @Param("type") NotificationType type);

    @Modifying
    @Query("DELETE FROM Notification n WHERE n.type = 'CONNECTION_REQUEST' " +
            "AND n.referenceId IS NOT NULL " +
            "AND n.referenceId NOT IN (SELECT c.id FROM Connection c WHERE c.status = 'PENDING')")
    void deleteStaleConnectionRequestNotifications();
}
