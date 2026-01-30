package com.workflow.backend.controller;

import com.workflow.backend.dto.*;
import com.workflow.backend.entity.RefreshToken;
import com.workflow.backend.exception.ResourceNotFoundException;
import com.workflow.backend.security.JwtService;
import com.workflow.backend.util.CookieUtils;
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
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.core.env.Environment;
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
    private final Environment environment;

    @Operation(summary = "Kullanıcı adı müsaitlik kontrolü", description = "Verilen kullanıcı adının kullanılabilir olup olmadığını kontrol eder")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Kontrol başarılı")
    })
    @GetMapping("/check-username")
    public ResponseEntity<Map<String, Boolean>> checkUsername(
            @Parameter(description = "Kontrol edilecek kullanıcı adı", required = true)
            @RequestParam @Size(max = 50) String username) {
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
    public ResponseEntity<UserResponse> register(@Valid @RequestBody RegisterRequest request, HttpServletResponse response) {
        UserResponse result = userService.register(request);
        addTokenCookies(response, result.getToken(), result.getRefreshToken());
        result.setToken(null);
        result.setRefreshToken(null);
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
    public ResponseEntity<UserResponse> login(@Valid @RequestBody LoginRequest request, HttpServletResponse response) {
        UserResponse result = userService.login(request);
        addTokenCookies(response, result.getToken(), result.getRefreshToken());
        result.setToken(null);
        result.setRefreshToken(null);
        return ResponseEntity.ok(result);
    }

    @Operation(summary = "Token yenileme", description = "Refresh token ile yeni access token alır")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Token yenileme başarılı"),
            @ApiResponse(responseCode = "401", description = "Refresh token geçersiz veya süresi dolmuş")
    })
    @PostMapping("/refresh")
    public ResponseEntity<Map<String, String>> refreshToken(HttpServletRequest request, HttpServletResponse response) {
        String requestRefreshToken = CookieUtils.extractCookieValue(request, "refresh_token");

        if (requestRefreshToken == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Refresh token bulunamadı"));
        }

        RefreshToken refreshToken = refreshTokenService.findAndVerifyToken(requestRefreshToken);
        if (refreshToken == null) {
            throw new ResourceNotFoundException("Refresh token", "token", requestRefreshToken);
        }

        String newAccessToken = jwtService.generateAccessToken(
                refreshToken.getUser().getUsername(), refreshToken.getUser().getId());
        addTokenCookies(response, newAccessToken, null);
        return ResponseEntity.ok(Map.of("message", "Token yenilendi"));
    }

    @Operation(summary = "Çıkış yap", description = "Kullanıcının refresh token'ını siler")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Çıkış başarılı"),
            @ApiResponse(responseCode = "400", description = "Geçersiz token")
    })
    @PostMapping("/logout")
    public ResponseEntity<String> logout(
            @Parameter(description = "Bearer token")
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            HttpServletRequest request,
            HttpServletResponse response) {

        // Refresh token cookie'sinden sadece bu oturumun token'ını sil
        String refreshToken = CookieUtils.extractCookieValue(request, "refresh_token");
        if (refreshToken != null) {
            refreshTokenService.deleteByToken(refreshToken);
        }

        clearTokenCookies(response);
        return ResponseEntity.ok("Çıkış başarılı");
    }

    @Operation(summary = "Şifre sıfırlama kodu gönder", description = "Kullanici adi veya email adresine 6 haneli doğrulama kodu gönderir")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Kod gönderildi (kullanici kayitliysa)"),
            @ApiResponse(responseCode = "400", description = "Geçersiz giriş")
    })
    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        passwordResetService.sendResetCode(request.getUsernameOrEmail());
        return ResponseEntity.ok(Map.of("message", "Eger kullanici sistemde kayitliysa, dogrulama kodu email adresine gonderildi."));
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
    public ResponseEntity<UserResponse> googleAuth(@Valid @RequestBody GoogleAuthRequest request, HttpServletResponse response) {
        UserResponse result = googleAuthService.authenticateWithGoogle(request.getIdToken());
        addTokenCookies(response, result.getToken(), result.getRefreshToken());
        result.setToken(null);
        result.setRefreshToken(null);
        return ResponseEntity.ok(result);
    }

    // --- Cookie helper methods ---

    private boolean isSecureCookie() {
        return !java.util.Arrays.asList(environment.getActiveProfiles()).contains("dev");
    }

    private void addTokenCookies(HttpServletResponse response, String accessToken, String refreshToken) {
        boolean secure = isSecureCookie();

        Cookie accessCookie = new Cookie("access_token", accessToken);
        accessCookie.setHttpOnly(true);
        accessCookie.setSecure(secure);
        accessCookie.setPath("/");
        accessCookie.setMaxAge(900); // 15 minutes (matches JWT access token expiry)
        accessCookie.setAttribute("SameSite", "Lax");
        response.addCookie(accessCookie);

        if (refreshToken != null) {
            Cookie refreshCookie = new Cookie("refresh_token", refreshToken);
            refreshCookie.setHttpOnly(true);
            refreshCookie.setSecure(secure);
            refreshCookie.setPath("/auth");
            refreshCookie.setMaxAge(259200); // 3 days (matches jwt.refresh-token.expiration)
            refreshCookie.setAttribute("SameSite", "Lax");
            response.addCookie(refreshCookie);
        }
    }

    private void clearTokenCookies(HttpServletResponse response) {
        boolean secure = isSecureCookie();

        Cookie accessCookie = new Cookie("access_token", "");
        accessCookie.setHttpOnly(true);
        accessCookie.setSecure(secure);
        accessCookie.setPath("/");
        accessCookie.setMaxAge(0);
        accessCookie.setAttribute("SameSite", "Lax");
        response.addCookie(accessCookie);

        Cookie refreshCookie = new Cookie("refresh_token", "");
        refreshCookie.setHttpOnly(true);
        refreshCookie.setSecure(secure);
        refreshCookie.setPath("/auth");
        refreshCookie.setMaxAge(0);
        refreshCookie.setAttribute("SameSite", "Lax");
        response.addCookie(refreshCookie);
    }
}
