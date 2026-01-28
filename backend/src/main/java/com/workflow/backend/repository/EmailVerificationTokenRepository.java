package com.workflow.backend.repository;

import com.workflow.backend.entity.EmailVerificationToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationToken, Long> {

    Optional<EmailVerificationToken> findByEmailAndCodeAndUsedFalse(String email, String code);

    Optional<EmailVerificationToken> findByEmailAndUsedFalse(String email);

    void deleteByEmail(String email);
}
