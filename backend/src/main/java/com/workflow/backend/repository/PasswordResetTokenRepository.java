package com.workflow.backend.repository;

import com.workflow.backend.entity.PasswordResetToken;
import com.workflow.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    // Email ve kod ile token bul (dogrulama icin)
    Optional<PasswordResetToken> findByUserEmailAndCodeAndUsedFalse(String email, String code);

    // Kullanicinin tum tokenlarini sil (yeni kod gonderirken eskilerini temizle)
    void deleteByUser(User user);

    // Kullaniciya ait kullanilmamis token sayisi (rate limiting icin)
    long countByUserAndUsedFalse(User user);
}
