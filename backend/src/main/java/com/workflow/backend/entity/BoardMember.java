package com.workflow.backend.entity;

import jakarta.persistence.*;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import org.hibernate.annotations.BatchSize;
import org.hibernate.annotations.ColumnDefault;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "board_members", indexes = {
    @Index(name = "idx_board_members_board_id", columnList = "board_id"),
    @Index(name = "idx_board_members_user_id", columnList = "user_id")
}, uniqueConstraints = {
    @UniqueConstraint(name = "uq_board_members_board_user", columnNames = {"board_id", "user_id"})
})
@Getter
@Setter
@ToString(exclude = {"board", "user", "assignments"})
@EqualsAndHashCode(exclude = {"board", "user", "assignments"})
public class BoardMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Version
    @Column(nullable = false)
    private Long version = 0L;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_id", nullable = false)
    private Board board;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @ColumnDefault("'ACCEPTED'")
    private BoardMemberStatus status = BoardMemberStatus.ACCEPTED;

    @OneToMany(mappedBy = "boardMember", cascade = CascadeType.ALL, orphanRemoval = true)
    @BatchSize(size = 20)
    private List<BoardMemberAssignment> assignments = new ArrayList<>();

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
