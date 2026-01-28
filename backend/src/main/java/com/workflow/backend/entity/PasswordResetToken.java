package com.workflow.backend.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.Instant;

@Entity
@Table(name = "password_reset_tokens", indexes = {
    @Index(name = "idx_prt_user_id", columnList = "user_id")
})
@Data
public class PasswordResetToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 6)
    private String code; // 6 haneli dogrulama kodu

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private Instant expiresAt;

    @Column(nullable = false)
    private boolean used = false;

    @Column(nullable = false)
    private int attempts = 0;

    @Version
    private Long version;

    public boolean isExpired() {
        return Instant.now().isAfter(expiresAt);
    }
}
