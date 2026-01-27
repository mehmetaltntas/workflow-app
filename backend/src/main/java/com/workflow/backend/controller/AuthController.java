package com.workflow.backend.controller;

import com.workflow.backend.dto.*;
import com.workflow.backend.entity.RefreshToken;
import com.workflow.backend.exception.ResourceNotFoundException;
import com.workflow.backend.security.JwtService;
import com.workflow.backend.service.EmailVerificationService;
import com.workflow.backend.service.GoogleAuthService;
import com.workflow.backend.service.PasswordResetService;
import com.workflow.backend.service.RefreshTokenService;
import com.workflow.backend.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "Auth", description = "Kimlik doğrulama işlemleri")
public class AuthController {

    private final UserService userService;
    private final RefreshTokenService refreshTokenService;
    private final JwtService jwtService;
    private final PasswordResetService passwordResetService;
    private final GoogleAuthService googleAuthService;
    private final EmailVerificationService emailVerificationService;

    @Operation(summary = "Kullanıcı adı müsaitlik kontrolü", description = "Verilen kullanıcı adının kullanılabilir olup olmadığını kontrol eder")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Kontrol başarılı")
    })
    @GetMapping("/check-username")
    public ResponseEntity<Map<String, Boolean>> checkUsername(
            @Parameter(description = "Kontrol edilecek kullanıcı adı", required = true)
            @RequestParam String username) {
        boolean available = userService.isUsernameAvailable(username);
        return ResponseEntity.ok(Map.of("available", available));
    }

    @Operation(summary = "Kayıt doğrulama kodu gönder", description = "Username/email müsaitlik kontrolü yapar ve e-posta adresine 6 haneli doğrulama kodu gönderir")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Doğrulama kodu gönderildi"),
            @ApiResponse(responseCode = "400", description = "Geçersiz istek veya kullanıcı adı/email zaten kullanılıyor")
    })
    @PostMapping("/register/send-code")
    public ResponseEntity<Map<String, String>> sendRegistrationCode(@Valid @RequestBody SendVerificationCodeRequest request) {
        // Username musaitlik kontrolu
        if (!userService.isUsernameAvailable(request.getUsername())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Bu kullanıcı adı zaten kullanılıyor"));
        }

        // Email musaitlik kontrolu
        if (!userService.isEmailAvailable(request.getEmail())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Bu e-posta adresi zaten kullanılıyor"));
        }

        // Dogrulama kodu gonder
        emailVerificationService.sendVerificationCode(request.getEmail());
        return ResponseEntity.ok(Map.of("message", "Doğrulama kodu e-posta adresinize gönderildi"));
    }

    @Operation(summary = "Yeni kullanıcı kaydı", description = "Yeni bir kullanıcı hesabı oluşturur ve JWT token döner")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Kayıt başarılı",
                    content = @Content(schema = @Schema(implementation = UserResponse.class))),
            @ApiResponse(responseCode = "400", description = "Geçersiz istek veya kullanıcı adı/email zaten kullanılıyor"),
            @ApiResponse(responseCode = "500", description = "Sunucu hatası")
    })
    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@Valid @RequestBody RegisterRequest request) {
        UserResponse result = userService.register(request);
        return ResponseEntity.ok(result);
    }

    @Operation(summary = "Kullanıcı girişi", description = "Kullanıcı adı ve şifre ile giriş yapar, JWT token döner")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Giriş başarılı",
                    content = @Content(schema = @Schema(implementation = UserResponse.class))),
            @ApiResponse(responseCode = "401", description = "Kullanıcı adı veya şifre hatalı"),
            @ApiResponse(responseCode = "400", description = "Geçersiz istek")
    })
    @PostMapping("/login")
    public ResponseEntity<UserResponse> login(@Valid @RequestBody LoginRequest request) {
        UserResponse result = userService.login(request);
        return ResponseEntity.ok(result);
    }

    @Operation(summary = "Token yenileme", description = "Refresh token ile yeni access token alır")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Token yenileme başarılı",
                    content = @Content(schema = @Schema(implementation = TokenRefreshResponse.class))),
            @ApiResponse(responseCode = "401", description = "Refresh token geçersiz veya süresi dolmuş")
    })
    @PostMapping("/refresh")
    public ResponseEntity<TokenRefreshResponse> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        String requestRefreshToken = request.getRefreshToken();

        return refreshTokenService.findByToken(requestRefreshToken)
                .map(refreshTokenService::verifyExpiration)
                .map(RefreshToken::getUser)
                .map(user -> {
                    String newAccessToken = jwtService.generateAccessToken(user.getUsername(), user.getId());
                    return ResponseEntity.ok(new TokenRefreshResponse(newAccessToken, requestRefreshToken));
                })
                .orElseThrow(() -> new ResourceNotFoundException("Refresh token", "token", requestRefreshToken));
    }

    @Operation(summary = "Çıkış yap", description = "Kullanıcının refresh token'ını siler")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Çıkış başarılı"),
            @ApiResponse(responseCode = "400", description = "Geçersiz token")
    })
    @PostMapping("/logout")
    public ResponseEntity<String> logout(
            @Parameter(description = "Bearer token", required = true)
            @RequestHeader("Authorization") String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            String username = jwtService.extractUsername(token);
            refreshTokenService.deleteByUsername(username);
            return ResponseEntity.ok("Çıkış başarılı");
        }
        return ResponseEntity.badRequest().body("Geçersiz token");
    }

    @Operation(summary = "Şifre sıfırlama kodu gönder", description = "Email adresine 6 haneli doğrulama kodu gönderir")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Kod gönderildi (email kayıtlıysa)"),
            @ApiResponse(responseCode = "400", description = "Geçersiz email formatı")
    })
    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        passwordResetService.sendResetCode(request.getEmail());
        return ResponseEntity.ok(Map.of("message", "Eger email adresi sistemde kayitliysa, dogrulama kodu gonderildi."));
    }

    @Operation(summary = "Doğrulama kodunu kontrol et", description = "Şifre sıfırlama için gönderilen kodu doğrular")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Kod doğrulandı"),
            @ApiResponse(responseCode = "400", description = "Geçersiz veya süresi dolmuş kod")
    })
    @PostMapping("/verify-code")
    public ResponseEntity<Map<String, Object>> verifyCode(@Valid @RequestBody VerifyCodeRequest request) {
        boolean isValid = passwordResetService.verifyCode(request.getEmail(), request.getCode());
        if (isValid) {
            return ResponseEntity.ok(Map.of("valid", true, "message", "Kod dogrulandi"));
        }
        return ResponseEntity.badRequest().body(Map.of("valid", false, "message", "Gecersiz veya suresi dolmus kod"));
    }

    @Operation(summary = "Şifreyi sıfırla", description = "Doğrulama kodu ile yeni şifre belirler")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Şifre güncellendi"),
            @ApiResponse(responseCode = "400", description = "Geçersiz kod veya şifre formatı")
    })
    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        passwordResetService.resetPassword(request.getEmail(), request.getCode(), request.getNewPassword());
        return ResponseEntity.ok(Map.of("message", "Sifreniz basariyla guncellendi"));
    }

    @Operation(summary = "Google ile giriş", description = "Google OAuth ID token ile giriş yapar veya yeni hesap oluşturur")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Giriş başarılı",
                    content = @Content(schema = @Schema(implementation = UserResponse.class))),
            @ApiResponse(responseCode = "400", description = "Geçersiz Google token"),
            @ApiResponse(responseCode = "500", description = "Google OAuth yapılandırılmamış")
    })
    @PostMapping("/google")
    public ResponseEntity<UserResponse> googleAuth(@Valid @RequestBody GoogleAuthRequest request) {
        UserResponse result = googleAuthService.authenticateWithGoogle(request.getIdToken());
        return ResponseEntity.ok(result);
    }
}
