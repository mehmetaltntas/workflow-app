package com.workflow.backend.service;

import com.workflow.backend.entity.PasswordResetToken;
import com.workflow.backend.entity.User;
import com.workflow.backend.exception.ExpiredTokenException;
import com.workflow.backend.exception.InvalidCredentialsException;
import com.workflow.backend.repository.PasswordResetTokenRepository;
import com.workflow.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
public class PasswordResetService {

    private static final Logger logger = LoggerFactory.getLogger(PasswordResetService.class);
    private static final int CODE_EXPIRY_MINUTES = 15;

    private final PasswordResetTokenRepository tokenRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    private final SecureRandom secureRandom = new SecureRandom();

    /**
     * Kullanici adi veya email adresine gore 6 haneli sifre sifirlama kodu gonderir
     */
    @Transactional
    public void sendResetCode(String usernameOrEmail) {
        // Oncelikle email olarak ara (case-insensitive)
        User user = userRepository.findByEmailIgnoreCase(usernameOrEmail);

        // Email ile bulunamazsa username olarak ara (case-insensitive)
        if (user == null) {
            user = userRepository.findByUsernameIgnoreCase(usernameOrEmail);
        }

        // Kullanici bulunamasa bile ayni mesaji donuyoruz (guvenlik icin)
        if (user == null) {
            logger.info("Sifre sifirlama istegi: {} - kullanici bulunamadi (guvenlik icin sessizce donuluyor)", usernameOrEmail);
            return; // Sessizce don, hacker'a bilgi verme
        }

        // Google ile kayit olan kullanicilar sifre sifirlayamaz
        if (user.getPassword() == null) {
            logger.warn("Sifre sifirlama istegi: {} - Google hesabi, sifre yok", usernameOrEmail);
            return; // Sessizce don, guvenlik icin
        }

        // Onceki kullanilmamis tokenlari sil
        tokenRepository.deleteByUser(user);

        // Yeni kod olustur
        String code = generateCode();

        // Token kaydet
        PasswordResetToken token = new PasswordResetToken();
        token.setCode(code);
        token.setUser(user);
        token.setExpiresAt(Instant.now().plus(CODE_EXPIRY_MINUTES, ChronoUnit.MINUTES));
        token.setUsed(false);

        tokenRepository.save(token);

        // Email gonder (kullanicinin kayitli email adresine)
        String userEmail = user.getEmail();
        emailService.sendPasswordResetCode(userEmail, code);

        logger.info("Sifre sifirlama kodu olusturuldu: {} (email: {})", usernameOrEmail, userEmail);
    }

    /**
     * Dogrulama kodunu kontrol eder
     */
    public boolean verifyCode(String email, String code) {
        return tokenRepository.findByUserEmailAndCodeAndUsedFalse(email, code)
                .map(token -> {
                    if (token.isExpired()) {
                        logger.warn("Kod suresi dolmus: {} - {}", email, code);
                        return false;
                    }
                    return true;
                })
                .orElse(false);
    }

    /**
     * Sifreyi sifirlar
     */
    @Transactional
    public void resetPassword(String email, String code, String newPassword) {
        PasswordResetToken token = tokenRepository.findByUserEmailAndCodeAndUsedFalse(email, code)
                .orElseThrow(() -> new InvalidCredentialsException("Geçersiz veya süresi dolmuş kod"));

        if (token.isExpired()) {
            throw new ExpiredTokenException("Kodun süresi dolmuş. Lütfen yeni kod isteyin.");
        }

        // Sifreyi guncelle
        User user = token.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Token'i kullanildi olarak isaretle
        token.setUsed(true);
        tokenRepository.save(token);

        logger.info("Sifre basariyla sifirlandi: {}", email);
    }

    /**
     * 6 haneli rastgele kod olusturur
     */
    private String generateCode() {
        int code = secureRandom.nextInt(900000) + 100000; // 100000-999999 arasi
        return String.valueOf(code);
    }
}
