package com.workflow.backend.service;

import com.workflow.backend.entity.EmailVerificationToken;
import com.workflow.backend.repository.EmailVerificationTokenRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class EmailVerificationService {

    private static final Logger logger = LoggerFactory.getLogger(EmailVerificationService.class);
    private static final int CODE_EXPIRY_MINUTES = 15;

    private final EmailVerificationTokenRepository tokenRepository;
    private final EmailService emailService;

    private final SecureRandom secureRandom = new SecureRandom();

    @Transactional
    public void sendVerificationCode(String email) {
        // Onceki kodlari temizle
        tokenRepository.deleteByEmail(email);

        // Yeni kod olustur
        String code = generateCode();

        // Token kaydet
        EmailVerificationToken token = new EmailVerificationToken();
        token.setEmail(email);
        token.setCode(code);
        token.setExpiresAt(Instant.now().plus(CODE_EXPIRY_MINUTES, ChronoUnit.MINUTES));
        token.setUsed(false);

        tokenRepository.save(token);

        // Email gonder
        emailService.sendRegistrationVerificationCode(email, code);

        logger.info("Kayit dogrulama kodu olusturuldu: {}", email);
    }

    private static final int MAX_ATTEMPTS = 5;

    @Transactional
    public boolean verifyCode(String email, String code) {
        Optional<EmailVerificationToken> tokenOpt = tokenRepository.findByEmailAndUsedFalse(email);
        if (tokenOpt.isEmpty()) {
            return false;
        }

        EmailVerificationToken token = tokenOpt.get();

        if (token.isExpired()) {
            logger.warn("Kayit dogrulama kodu suresi dolmus: {}", email);
            return false;
        }

        if (token.getAttempts() >= MAX_ATTEMPTS) {
            logger.warn("Kayit dogrulama kodu maksimum deneme sayisina ulasti: {}", email);
            return false;
        }

        if (!token.getCode().equals(code)) {
            token.setAttempts(token.getAttempts() + 1);
            tokenRepository.save(token);
            logger.warn("Kayit dogrulama kodu hatali: {} (deneme: {})", email, token.getAttempts());
            return false;
        }

        return true;
    }

    @Transactional
    public void markCodeAsUsed(String email, String code) {
        tokenRepository.findByEmailAndCodeAndUsedFalse(email, code)
                .ifPresent(token -> {
                    token.setUsed(true);
                    tokenRepository.save(token);
                });
    }

    private String generateCode() {
        int code = secureRandom.nextInt(900000) + 100000;
        return String.valueOf(code);
    }
}
