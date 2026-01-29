package com.workflow.backend.service;

import com.workflow.backend.config.JwtProperties;
import com.workflow.backend.entity.RefreshToken;
import com.workflow.backend.entity.User;
import com.workflow.backend.exception.ExpiredTokenException;
import com.workflow.backend.exception.ResourceNotFoundException;
import com.workflow.backend.repository.RefreshTokenRepository;
import com.workflow.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.hibernate.Hibernate;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;
    private final JwtProperties jwtProperties;

    private static final int MAX_TOKENS_PER_USER = 5;

    /**
     * Kullanıcı için yeni bir refresh token oluşturur.
     * Kullanıcı başına maksimum MAX_TOKENS_PER_USER adet token tutulur.
     * Limit aşılırsa en eski token'lar silinir.
     */
    @Transactional
    public RefreshToken createRefreshToken(String username) {
        User user = userRepository.findByUsername(username);
        if (user == null) {
            throw new ResourceNotFoundException("Kullanıcı", "username", username);
        }

        // Eski token'ları temizle - maksimum MAX_TOKENS_PER_USER token per kullanıcı
        long tokenCount = refreshTokenRepository.countByUser(user);
        if (tokenCount >= MAX_TOKENS_PER_USER) {
            List<RefreshToken> oldTokens = refreshTokenRepository.findByUserOrderByExpiryDateAsc(user);
            long tokensToDelete = tokenCount - MAX_TOKENS_PER_USER + 1; // +1 yeni token için yer aç
            for (int i = 0; i < tokensToDelete && i < oldTokens.size(); i++) {
                refreshTokenRepository.delete(oldTokens.get(i));
            }
        }

        // Yeni refresh token oluştur
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUser(user);
        refreshToken.setToken(UUID.randomUUID().toString());
        refreshToken.setExpiryDate(Instant.now().plusMillis(jwtProperties.getRefreshToken().getExpiration()));

        return refreshTokenRepository.save(refreshToken);
    }

    /**
     * Refresh token'ı doğrular ve döner.
     */
    @Transactional(readOnly = true)
    public Optional<RefreshToken> findByToken(String token) {
        return refreshTokenRepository.findByToken(token);
    }

    /**
     * Refresh token'ı bulur, süresini doğrular ve ilişkili kullanıcıyı yükler.
     * Tek bir transaction içinde çalışır, böylece lazy-loaded User proxy'si başarılı şekilde yüklenir.
     */
    @Transactional
    public RefreshToken findAndVerifyToken(String token) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(token)
                .orElse(null);
        if (refreshToken == null) {
            return null;
        }
        refreshToken = verifyExpiration(refreshToken);
        // Lazy proxy'yi transaction içinde initialize et
        Hibernate.initialize(refreshToken.getUser());
        return refreshToken;
    }

    /**
     * Refresh token'ın süresinin dolup dolmadığını kontrol eder.
     * Süresi dolmuşsa siler ve exception fırlatır.
     */
    @Transactional
    public RefreshToken verifyExpiration(RefreshToken token) {
        if (token.getExpiryDate().isBefore(Instant.now())) {
            refreshTokenRepository.delete(token);
            throw new ExpiredTokenException("Refresh token süresi dolmuş. Lütfen tekrar giriş yapın.");
        }
        return token;
    }

    /**
     * Belirli bir refresh token'ı siler (logout için).
     * Sadece o oturuma ait token silinir, diğer oturumlar etkilenmez.
     */
    @Transactional
    public void deleteByToken(String token) {
        refreshTokenRepository.findByToken(token).ifPresent(refreshTokenRepository::delete);
    }

    /**
     * Kullanıcının tüm refresh token'larını siler (şifre değişikliği vb. için).
     */
    @Transactional
    public void deleteAllByUsername(String username) {
        User user = userRepository.findByUsername(username);
        if (user != null) {
            refreshTokenRepository.deleteByUser(user);
        }
    }

    /**
     * Süresi dolmuş tüm refresh token'ları temizler.
     * Periyodik olarak çağrılabilir (Scheduled task ile).
     */
    @Scheduled(fixedRate = 3600000) // Her saat başı çalışır (1 saat = 3600000 ms)
    @Transactional
    public void deleteExpiredTokens() {
        refreshTokenRepository.deleteExpiredTokens(Instant.now());
    }
}
