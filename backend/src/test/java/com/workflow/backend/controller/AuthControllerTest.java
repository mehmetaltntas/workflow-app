package com.workflow.backend.controller;

import com.workflow.backend.dto.LoginRequest;
import com.workflow.backend.dto.RefreshTokenRequest;
import com.workflow.backend.dto.RegisterRequest;
import com.workflow.backend.dto.UserResponse;
import com.workflow.backend.entity.RefreshToken;
import com.workflow.backend.entity.User;
import com.workflow.backend.security.JwtService;
import com.workflow.backend.service.RefreshTokenService;
import com.workflow.backend.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock
    private UserService userService;

    @Mock
    private RefreshTokenService refreshTokenService;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private AuthController authController;

    private RegisterRequest registerRequest;
    private LoginRequest loginRequest;
    private UserResponse userResponse;

    @BeforeEach
    void setUp() {
        registerRequest = new RegisterRequest();
        registerRequest.setUsername("testuser");
        registerRequest.setEmail("test@example.com");
        registerRequest.setPassword("Password123!");

        loginRequest = new LoginRequest();
        loginRequest.setUsername("testuser");
        loginRequest.setPassword("Password123!");

        userResponse = new UserResponse();
        userResponse.setId(1L);
        userResponse.setUsername("testuser");
        userResponse.setEmail("test@example.com");
        userResponse.setToken("accessToken");
        userResponse.setRefreshToken("refreshToken");
    }

    @Nested
    @DisplayName("Register Endpoint Tests")
    class RegisterTests {

        @Test
        @DisplayName("Should register user and return 200 with tokens")
        void register_ValidRequest_Returns200() {
            // Arrange
            when(userService.register(any(RegisterRequest.class))).thenReturn(userResponse);

            // Act
            ResponseEntity<UserResponse> response = authController.register(registerRequest);

            // Assert
            assertThat(response.getStatusCode().value()).isEqualTo(200);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().getId()).isEqualTo(1L);
            assertThat(response.getBody().getUsername()).isEqualTo("testuser");
            assertThat(response.getBody().getToken()).isEqualTo("accessToken");
        }

        @Test
        @DisplayName("Should throw exception for duplicate username")
        void register_DuplicateUsername_ThrowsException() {
            // Arrange
            when(userService.register(any(RegisterRequest.class)))
                    .thenThrow(new RuntimeException("Bu kullanıcı adı zaten alınmış!"));

            // Act & Assert
            assertThatThrownBy(() -> authController.register(registerRequest))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("kullanıcı adı zaten alınmış");
        }
    }

    @Nested
    @DisplayName("Login Endpoint Tests")
    class LoginTests {

        @Test
        @DisplayName("Should login user and return tokens")
        void login_ValidCredentials_ReturnsTokens() {
            // Arrange
            when(userService.login(any(LoginRequest.class))).thenReturn(userResponse);

            // Act
            ResponseEntity<UserResponse> response = authController.login(loginRequest);

            // Assert
            assertThat(response.getStatusCode().value()).isEqualTo(200);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().getUsername()).isEqualTo("testuser");
            assertThat(response.getBody().getToken()).isEqualTo("accessToken");
            assertThat(response.getBody().getRefreshToken()).isEqualTo("refreshToken");
        }

        @Test
        @DisplayName("Should throw exception for invalid credentials")
        void login_InvalidCredentials_ThrowsException() {
            // Arrange
            when(userService.login(any(LoginRequest.class)))
                    .thenThrow(new RuntimeException("Kullanıcı adı veya şifre hatalı!"));

            // Act & Assert
            assertThatThrownBy(() -> authController.login(loginRequest))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Kullanıcı adı veya şifre hatalı");
        }
    }

    @Nested
    @DisplayName("Refresh Token Endpoint Tests")
    class RefreshTokenTests {

        @Test
        @DisplayName("Should return new access token for valid refresh token")
        void refresh_ValidToken_ReturnsNewAccessToken() {
            // Arrange
            RefreshTokenRequest refreshRequest = new RefreshTokenRequest();
            refreshRequest.setRefreshToken("validRefreshToken");

            User user = new User();
            user.setId(1L);
            user.setUsername("testuser");

            RefreshToken refreshToken = new RefreshToken();
            refreshToken.setToken("validRefreshToken");
            refreshToken.setUser(user);
            refreshToken.setExpiryDate(Instant.now().plusSeconds(86400));

            when(refreshTokenService.findByToken("validRefreshToken"))
                    .thenReturn(Optional.of(refreshToken));
            when(refreshTokenService.verifyExpiration(any(RefreshToken.class)))
                    .thenReturn(refreshToken);
            when(jwtService.generateAccessToken("testuser"))
                    .thenReturn("newAccessToken");

            // Act
            var response = authController.refreshToken(refreshRequest);

            // Assert
            assertThat(response.getStatusCode().value()).isEqualTo(200);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().getAccessToken()).isEqualTo("newAccessToken");
        }

        @Test
        @DisplayName("Should throw exception for invalid refresh token")
        void refresh_InvalidToken_ThrowsException() {
            // Arrange
            RefreshTokenRequest refreshRequest = new RefreshTokenRequest();
            refreshRequest.setRefreshToken("invalidRefreshToken");

            when(refreshTokenService.findByToken("invalidRefreshToken"))
                    .thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> authController.refreshToken(refreshRequest))
                    .isInstanceOf(RuntimeException.class);
        }
    }

    @Nested
    @DisplayName("Logout Endpoint Tests")
    class LogoutTests {

        @Test
        @DisplayName("Should logout successfully with valid token")
        void logout_ValidToken_ReturnsSuccess() {
            // Arrange
            when(jwtService.extractUsername(anyString())).thenReturn("testuser");

            // Act
            ResponseEntity<String> response = authController.logout("Bearer validToken");

            // Assert
            assertThat(response.getStatusCode().value()).isEqualTo(200);
        }

        @Test
        @DisplayName("Should return 400 for missing authorization header")
        void logout_MissingHeader_Returns400() {
            // Act
            ResponseEntity<String> response = authController.logout(null);

            // Assert
            assertThat(response.getStatusCode().value()).isEqualTo(400);
        }

        @Test
        @DisplayName("Should return 400 for invalid authorization format")
        void logout_InvalidFormat_Returns400() {
            // Act
            ResponseEntity<String> response = authController.logout("InvalidFormat");

            // Assert
            assertThat(response.getStatusCode().value()).isEqualTo(400);
        }
    }
}
