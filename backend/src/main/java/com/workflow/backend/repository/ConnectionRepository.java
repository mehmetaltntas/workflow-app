package com.workflow.backend.repository;

import com.workflow.backend.entity.Connection;
import com.workflow.backend.entity.ConnectionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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

    @Query("SELECT c FROM Connection c JOIN FETCH c.sender JOIN FETCH c.receiver WHERE (c.sender.id = :userId OR c.receiver.id = :userId) AND c.status = 'ACCEPTED' ORDER BY c.updatedAt DESC")
    List<Connection> findAcceptedByUserId(@Param("userId") Long userId);
}
