package com.workflow.backend.controller;

import com.workflow.backend.dto.LoginRequest;
import com.workflow.backend.dto.RefreshTokenRequest;
import com.workflow.backend.dto.RegisterRequest;
import com.workflow.backend.dto.TokenRefreshResponse;
import com.workflow.backend.dto.UserResponse;
import com.workflow.backend.entity.RefreshToken;
import com.workflow.backend.security.JwtService;
import com.workflow.backend.service.RefreshTokenService;
import com.workflow.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth") // Bu sınıftaki tüm adresler "/auth" ile başlar
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final RefreshTokenService refreshTokenService;
    private final JwtService jwtService;

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
}