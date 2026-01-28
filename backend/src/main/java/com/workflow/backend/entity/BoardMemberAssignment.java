package com.workflow.backend.entity;

import jakarta.persistence.*;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.time.LocalDateTime;

@Entity
@Table(name = "board_member_assignments", indexes = {
    @Index(name = "idx_bma_board_member_id", columnList = "board_member_id"),
    @Index(name = "idx_bma_target", columnList = "target_type, target_id")
}, uniqueConstraints = {
    @UniqueConstraint(name = "uq_bma_member_target", columnNames = {"board_member_id", "target_type", "target_id"})
})
@Getter
@Setter
@ToString(exclude = {"boardMember"})
@EqualsAndHashCode(exclude = {"boardMember"})
public class BoardMemberAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_member_id", nullable = false)
    private BoardMember boardMember;

    @Enumerated(EnumType.STRING)
    @Column(name = "target_type", nullable = false, length = 10)
    private AssignmentTargetType targetType;

    @Column(name = "target_id", nullable = false)
    private Long targetId;

    @Version
    private Long version;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
