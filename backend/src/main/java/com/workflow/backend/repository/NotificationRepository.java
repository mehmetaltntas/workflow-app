package com.workflow.backend.repository;

import com.workflow.backend.entity.Notification;
import com.workflow.backend.entity.NotificationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    @Query("SELECT n FROM Notification n JOIN FETCH n.actor WHERE n.recipient.id = :recipientId ORDER BY n.createdAt DESC")
    List<Notification> findByRecipientIdOrderByCreatedAtDesc(@Param("recipientId") Long recipientId);

    @Query(value = "SELECT n FROM Notification n JOIN FETCH n.actor WHERE n.recipient.id = :recipientId ORDER BY n.createdAt DESC",
            countQuery = "SELECT COUNT(n) FROM Notification n WHERE n.recipient.id = :recipientId")
    Page<Notification> findByRecipientIdPaged(@Param("recipientId") Long recipientId, Pageable pageable);

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
            "AND NOT EXISTS (SELECT 1 FROM Connection c WHERE c.id = n.referenceId AND c.status = 'PENDING')")
    void deleteStaleConnectionRequestNotifications();

}
