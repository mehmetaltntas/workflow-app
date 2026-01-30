package com.workflow.backend.controller;

import com.workflow.backend.dto.AuthResponse;
import com.workflow.backend.dto.LoginRequest;
import com.workflow.backend.dto.RegisterRequest;
import com.workflow.backend.dto.UserResponse;
import com.workflow.backend.entity.RefreshToken;
import com.workflow.backend.entity.User;
import com.workflow.backend.security.JwtService;
import com.workflow.backend.service.EmailVerificationService;
import com.workflow.backend.service.GoogleAuthService;
import com.workflow.backend.service.PasswordResetService;
import com.workflow.backend.service.RefreshTokenService;
import com.workflow.backend.service.UserService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.env.Environment;
import org.springframework.http.ResponseEntity;

import java.time.Instant;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.atLeast;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock
    private UserService userService;

    @Mock
    private RefreshTokenService refreshTokenService;

    @Mock
    private JwtService jwtService;

    @Mock
    private PasswordResetService passwordResetService;

    @Mock
    private GoogleAuthService googleAuthService;

    @Mock
    private EmailVerificationService emailVerificationService;

    @Mock
    private Environment environment;

    @Mock
    private HttpServletRequest mockRequest;

    @Mock
    private HttpServletResponse mockResponse;

    @InjectMocks
    private AuthController authController;

    private RegisterRequest registerRequest;
    private LoginRequest loginRequest;
    private AuthResponse authResponse;

    @BeforeEach
    void setUp() {
        lenient().when(environment.getActiveProfiles()).thenReturn(new String[]{});

        registerRequest = new RegisterRequest();
        registerRequest.setUsername("testuser");
        registerRequest.setEmail("test@example.com");
        registerRequest.setPassword("Password123!");

        loginRequest = new LoginRequest();
        loginRequest.setUsername("testuser");
        loginRequest.setPassword("Password123!");

        UserResponse userResponse = new UserResponse();
        userResponse.setId(1L);
        userResponse.setUsername("testuser");
        userResponse.setEmail("test@example.com");

        authResponse = new AuthResponse();
        authResponse.setUser(userResponse);
        authResponse.setToken("accessToken");
        authResponse.setRefreshToken("refreshToken");
    }

    @Nested
    @DisplayName("Register Endpoint Tests")
    class RegisterTests {

        @Test
        @DisplayName("Should register user and return 200 with user data (tokens in cookies)")
        void register_ValidRequest_Returns200() {
            // Arrange
            when(userService.register(any(RegisterRequest.class))).thenReturn(authResponse);

            // Act
            ResponseEntity<UserResponse> response = authController.register(registerRequest, mockResponse);

            // Assert
            assertThat(response.getStatusCode().value()).isEqualTo(200);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().getId()).isEqualTo(1L);
            assertThat(response.getBody().getUsername()).isEqualTo("testuser");
            // Verify cookies were set (access_token + refresh_token)
            verify(mockResponse, times(2)).addCookie(any(Cookie.class));
        }

        @Test
        @DisplayName("Should throw exception for duplicate username")
        void register_DuplicateUsername_ThrowsException() {
            // Arrange
            when(userService.register(any(RegisterRequest.class)))
                    .thenThrow(new RuntimeException("Bu kullanıcı adı zaten alınmış!"));

            // Act & Assert
            assertThatThrownBy(() -> authController.register(registerRequest, mockResponse))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("kullanıcı adı zaten alınmış");
        }
    }

    @Nested
    @DisplayName("Login Endpoint Tests")
    class LoginTests {

        @Test
        @DisplayName("Should login user and set tokens as cookies")
        void login_ValidCredentials_SetsCookies() {
            // Arrange
            when(userService.login(any(LoginRequest.class))).thenReturn(authResponse);

            // Act
            ResponseEntity<UserResponse> response = authController.login(loginRequest, mockResponse);

            // Assert
            assertThat(response.getStatusCode().value()).isEqualTo(200);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().getUsername()).isEqualTo("testuser");
            // Verify cookies were set (access_token + refresh_token)
            verify(mockResponse, times(2)).addCookie(any(Cookie.class));
        }

        @Test
        @DisplayName("Should throw exception for invalid credentials")
        void login_InvalidCredentials_ThrowsException() {
            // Arrange
            when(userService.login(any(LoginRequest.class)))
                    .thenThrow(new RuntimeException("Kullanıcı adı veya şifre hatalı!"));

            // Act & Assert
            assertThatThrownBy(() -> authController.login(loginRequest, mockResponse))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Kullanıcı adı veya şifre hatalı");
        }
    }

    @Nested
    @DisplayName("Refresh Token Endpoint Tests")
    class RefreshTokenTests {

        @Test
        @DisplayName("Should return success message and set new access token cookie")
        void refresh_ValidToken_SetsNewAccessTokenCookie() {
            // Arrange
            User user = new User();
            user.setId(1L);
            user.setUsername("testuser");

            RefreshToken refreshToken = new RefreshToken();
            refreshToken.setToken("validRefreshToken");
            refreshToken.setUser(user);
            refreshToken.setExpiryDate(Instant.now().plusSeconds(86400));

            Cookie refreshCookie = new Cookie("refresh_token", "validRefreshToken");
            when(mockRequest.getCookies()).thenReturn(new Cookie[]{refreshCookie});
            when(refreshTokenService.findAndVerifyToken("validRefreshToken"))
                    .thenReturn(refreshToken);
            when(jwtService.generateAccessToken("testuser", 1L))
                    .thenReturn("newAccessToken");

            // Act
            ResponseEntity<Map<String, String>> response = authController.refreshToken(mockRequest, mockResponse);

            // Assert
            assertThat(response.getStatusCode().value()).isEqualTo(200);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().get("message")).isEqualTo("Token yenilendi");
            verify(mockResponse).addCookie(any(Cookie.class));
        }

        @Test
        @DisplayName("Should return 401 when refresh token cookie is missing")
        void refresh_MissingCookie_Returns401() {
            // Arrange
            when(mockRequest.getCookies()).thenReturn(null);

            // Act
            ResponseEntity<Map<String, String>> response = authController.refreshToken(mockRequest, mockResponse);

            // Assert
            assertThat(response.getStatusCode().value()).isEqualTo(401);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().get("message")).isEqualTo("Refresh token bulunamadı");
        }
    }

    @Nested
    @DisplayName("Logout Endpoint Tests")
    class LogoutTests {

        @Test
        @DisplayName("Should logout successfully and delete specific refresh token from cookie")
        void logout_ValidRefreshTokenCookie_ReturnsSuccess() {
            // Arrange
            Cookie refreshCookie = new Cookie("refresh_token", "validRefreshToken");
            when(mockRequest.getCookies()).thenReturn(new Cookie[]{refreshCookie});

            // Act
            ResponseEntity<String> response = authController.logout(null, mockRequest, mockResponse);

            // Assert
            assertThat(response.getStatusCode().value()).isEqualTo(200);
            verify(refreshTokenService).deleteByToken("validRefreshToken");
            // Verify cookies were cleared (access_token + refresh_token)
            verify(mockResponse, atLeast(2)).addCookie(any(Cookie.class));
        }

        @Test
        @DisplayName("Should logout and clear cookies even without refresh token cookie")
        void logout_NoRefreshTokenCookie_StillClearsCookies() {
            // Arrange
            Cookie accessCookie = new Cookie("access_token", "tokenFromCookie");
            when(mockRequest.getCookies()).thenReturn(new Cookie[]{accessCookie});

            // Act
            ResponseEntity<String> response = authController.logout(null, mockRequest, mockResponse);

            // Assert
            assertThat(response.getStatusCode().value()).isEqualTo(200);
            verify(refreshTokenService, never()).deleteByToken(anyString());
            // Verify cookies were cleared (access_token + refresh_token)
            verify(mockResponse, atLeast(2)).addCookie(any(Cookie.class));
        }

        @Test
        @DisplayName("Should still return 200 and clear cookies when no token available")
        void logout_NoToken_StillClearsCookies() {
            // Arrange
            when(mockRequest.getCookies()).thenReturn(null);

            // Act
            ResponseEntity<String> response = authController.logout(null, mockRequest, mockResponse);

            // Assert
            assertThat(response.getStatusCode().value()).isEqualTo(200);
            // Verify cookies were cleared (access_token + refresh_token)
            verify(mockResponse, atLeast(2)).addCookie(any(Cookie.class));
        }
    }
}
