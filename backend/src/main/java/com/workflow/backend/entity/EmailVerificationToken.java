package com.workflow.backend.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.Instant;

@Entity
@Table(name = "email_verification_tokens", indexes = {
    @Index(name = "idx_evt_email", columnList = "email")
})
@Data
public class EmailVerificationToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false, length = 6)
    private String code;

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
