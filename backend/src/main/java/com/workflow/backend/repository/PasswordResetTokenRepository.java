package com.workflow.backend.repository;

import com.workflow.backend.entity.PasswordResetToken;
import com.workflow.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    // Email ve kod ile token bul (dogrulama icin)
    @Query("SELECT t FROM PasswordResetToken t WHERE t.user.email = :email AND t.code = :code AND t.used = false")
    Optional<PasswordResetToken> findByUserEmailAndCodeAndUsedFalse(@Param("email") String email, @Param("code") String code);

    // Kullanicinin tum tokenlarini sil (yeni kod gonderirken eskilerini temizle)
    void deleteByUser(User user);

    // Kullaniciya ait kullanilmamis token sayisi (rate limiting icin)
    long countByUserAndUsedFalse(User user);
}
