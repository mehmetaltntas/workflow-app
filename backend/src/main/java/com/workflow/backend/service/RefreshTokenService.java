package com.workflow.backend.service;

import com.workflow.backend.config.JwtProperties;
import com.workflow.backend.entity.RefreshToken;
import com.workflow.backend.entity.User;
import com.workflow.backend.repository.RefreshTokenRepository;
import com.workflow.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;
    private final JwtProperties jwtProperties;

    /**
     * Kullanıcı için yeni bir refresh token oluşturur.
     * Eğer kullanıcının mevcut bir refresh token'ı varsa, önce onu siler.
     */
    @Transactional
    public RefreshToken createRefreshToken(String username) {
        User user = userRepository.findByUsername(username);
        if (user == null) {
            throw new RuntimeException("Kullanıcı bulunamadı: " + username);
        }

        // Mevcut refresh token'ı sil (varsa)
        refreshTokenRepository.deleteByUser(user);

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
    public Optional<RefreshToken> findByToken(String token) {
        return refreshTokenRepository.findByToken(token);
    }

    /**
     * Refresh token'ın süresinin dolup dolmadığını kontrol eder.
     * Süresi dolmuşsa siler ve exception fırlatır.
     */
    @Transactional
    public RefreshToken verifyExpiration(RefreshToken token) {
        if (token.getExpiryDate().isBefore(Instant.now())) {
            refreshTokenRepository.delete(token);
            throw new RuntimeException("Refresh token süresi dolmuş. Lütfen tekrar giriş yapın.");
        }
        return token;
    }

    /**
     * Kullanıcının refresh token'ını siler (logout için).
     */
    @Transactional
    public void deleteByUsername(String username) {
        User user = userRepository.findByUsername(username);
        if (user != null) {
            refreshTokenRepository.deleteByUser(user);
        }
    }

    /**
     * Süresi dolmuş tüm refresh token'ları temizler.
     * Periyodik olarak çağrılabilir (Scheduled task ile).
     */
    @Transactional
    public void deleteExpiredTokens() {
        refreshTokenRepository.deleteExpiredTokens(Instant.now());
    }
}
