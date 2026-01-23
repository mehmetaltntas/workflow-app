package com.workflow.backend.controller;

import com.workflow.backend.dto.*;
import com.workflow.backend.entity.RefreshToken;
import com.workflow.backend.security.JwtService;
import com.workflow.backend.service.GoogleAuthService;
import com.workflow.backend.service.PasswordResetService;
import com.workflow.backend.service.RefreshTokenService;
import com.workflow.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth") // Bu sınıftaki tüm adresler "/auth" ile başlar
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final RefreshTokenService refreshTokenService;
    private final JwtService jwtService;
    private final PasswordResetService passwordResetService;
    private final GoogleAuthService googleAuthService;

    // POST http://localhost:8080/auth/register
    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@Valid @RequestBody RegisterRequest request) {
        UserResponse result = userService.register(request);
        return ResponseEntity.ok(result);
    }

    // POST http://localhost:8080/auth/login
    @PostMapping("/login")
    public ResponseEntity<UserResponse> login(@Valid @RequestBody LoginRequest request) {
        UserResponse result = userService.login(request);
        return ResponseEntity.ok(result);
    }

    // POST http://localhost:8080/auth/refresh
    // Refresh token ile yeni access token al
    @PostMapping("/refresh")
    public ResponseEntity<TokenRefreshResponse> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        String requestRefreshToken = request.getRefreshToken();

        return refreshTokenService.findByToken(requestRefreshToken)
                .map(refreshTokenService::verifyExpiration)
                .map(RefreshToken::getUser)
                .map(user -> {
                    String newAccessToken = jwtService.generateAccessToken(user.getUsername());
                    return ResponseEntity.ok(new TokenRefreshResponse(newAccessToken, requestRefreshToken));
                })
                .orElseThrow(() -> new RuntimeException("Refresh token bulunamadı!"));
    }

    // POST http://localhost:8080/auth/logout
    // Kullanıcının refresh token'ını sil
    @PostMapping("/logout")
    public ResponseEntity<String> logout(@RequestHeader("Authorization") String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            String username = jwtService.extractUsername(token);
            refreshTokenService.deleteByUsername(username);
            return ResponseEntity.ok("Çıkış başarılı");
        }
        return ResponseEntity.badRequest().body("Geçersiz token");
    }

    // ==========================================
    // SIFREMI UNUTTUM ENDPOINT'LERI
    // ==========================================

    // POST http://localhost:8080/auth/forgot-password
    // Email'e 6 haneli dogrulama kodu gonder
    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        passwordResetService.sendResetCode(request.getEmail());
        // Guvenlik icin her zaman ayni mesaji don (kullanici var/yok bilgisi verme)
        return ResponseEntity.ok(Map.of("message", "Eger email adresi sistemde kayitliysa, dogrulama kodu gonderildi."));
    }

    // POST http://localhost:8080/auth/verify-code
    // Dogrulama kodunu kontrol et
    @PostMapping("/verify-code")
    public ResponseEntity<Map<String, Object>> verifyCode(@Valid @RequestBody VerifyCodeRequest request) {
        boolean isValid = passwordResetService.verifyCode(request.getEmail(), request.getCode());
        if (isValid) {
            return ResponseEntity.ok(Map.of("valid", true, "message", "Kod dogrulandi"));
        }
        return ResponseEntity.badRequest().body(Map.of("valid", false, "message", "Gecersiz veya suresi dolmus kod"));
    }

    // POST http://localhost:8080/auth/reset-password
    // Yeni sifre belirle
    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        passwordResetService.resetPassword(request.getEmail(), request.getCode(), request.getNewPassword());
        return ResponseEntity.ok(Map.of("message", "Sifreniz basariyla guncellendi"));
    }

    // ==========================================
    // GOOGLE OAUTH ENDPOINT'I
    // ==========================================

    // POST http://localhost:8080/auth/google
    // Google ile giris/kayit
    @PostMapping("/google")
    public ResponseEntity<UserResponse> googleAuth(@Valid @RequestBody GoogleAuthRequest request) {
        UserResponse result = googleAuthService.authenticateWithGoogle(request.getIdToken());
        return ResponseEntity.ok(result);
    }
}