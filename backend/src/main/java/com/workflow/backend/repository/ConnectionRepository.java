package com.workflow.backend.repository;

import com.workflow.backend.entity.Connection;
import com.workflow.backend.entity.ConnectionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;

import java.util.List;
import java.util.Optional;

public interface ConnectionRepository extends JpaRepository<Connection, Long> {

    @Query("SELECT c FROM Connection c JOIN FETCH c.sender JOIN FETCH c.receiver WHERE " +
            "(c.sender.id = :userId1 AND c.receiver.id = :userId2) OR " +
            "(c.sender.id = :userId2 AND c.receiver.id = :userId1)")
    Optional<Connection> findBetweenUsers(@Param("userId1") Long userId1, @Param("userId2") Long userId2);

    @Query("SELECT CASE WHEN COUNT(c) > 0 THEN true ELSE false END FROM Connection c WHERE " +
            "((c.sender.id = :userId1 AND c.receiver.id = :userId2) OR " +
            "(c.sender.id = :userId2 AND c.receiver.id = :userId1)) AND c.status = :status")
    boolean existsBetweenUsersWithStatus(@Param("userId1") Long userId1, @Param("userId2") Long userId2, @Param("status") ConnectionStatus status);

    @Query("SELECT COUNT(c) FROM Connection c WHERE " +
            "(c.sender.id = :userId OR c.receiver.id = :userId) AND c.status = 'ACCEPTED'")
    long countAcceptedByUserId(@Param("userId") Long userId);

    @Query("SELECT c FROM Connection c JOIN FETCH c.sender JOIN FETCH c.receiver WHERE c.receiver.id = :receiverId AND c.status = :status ORDER BY c.createdAt DESC")
    List<Connection> findByReceiverIdAndStatus(@Param("receiverId") Long receiverId, @Param("status") ConnectionStatus status);

    @Query("SELECT c FROM Connection c JOIN FETCH c.sender JOIN FETCH c.receiver WHERE c.sender.id = :senderId AND c.status = :status ORDER BY c.createdAt DESC")
    List<Connection> findBySenderIdAndStatus(@Param("senderId") Long senderId, @Param("status") ConnectionStatus status);

    @Query("SELECT c FROM Connection c JOIN FETCH c.sender JOIN FETCH c.receiver WHERE (c.sender.id = :userId OR c.receiver.id = :userId) AND c.status = 'ACCEPTED' ORDER BY c.updatedAt DESC")
    List<Connection> findAcceptedByUserId(@Param("userId") Long userId);

    @Query(value = "SELECT c FROM Connection c JOIN FETCH c.sender JOIN FETCH c.receiver WHERE (c.sender.id = :userId OR c.receiver.id = :userId) AND c.status = 'ACCEPTED' ORDER BY c.updatedAt DESC",
            countQuery = "SELECT COUNT(c) FROM Connection c WHERE (c.sender.id = :userId OR c.receiver.id = :userId) AND c.status = 'ACCEPTED'")
    Page<Connection> findAcceptedByUserIdPaged(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT CASE WHEN c.sender.id = :userId THEN c.receiver.id ELSE c.sender.id END " +
            "FROM Connection c WHERE c.status = 'ACCEPTED' AND " +
            "((c.sender.id = :userId AND c.receiver.id IN :targetUserIds) OR " +
            "(c.receiver.id = :userId AND c.sender.id IN :targetUserIds))")
    List<Long> findConnectedUserIds(@Param("userId") Long userId, @Param("targetUserIds") List<Long> targetUserIds);

    @Modifying
    @Query("DELETE FROM Connection c WHERE c.status = 'PENDING' AND c.createdAt < :expireDate")
    int deleteExpiredPendingConnections(@Param("expireDate") LocalDateTime expireDate);
}
