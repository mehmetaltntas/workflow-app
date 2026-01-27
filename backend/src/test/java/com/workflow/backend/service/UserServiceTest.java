package com.workflow.backend.service;

import com.workflow.backend.dto.LoginRequest;
import com.workflow.backend.dto.RegisterRequest;
import com.workflow.backend.dto.UpdatePasswordRequest;
import com.workflow.backend.dto.UserResponse;
import com.workflow.backend.entity.RefreshToken;
import com.workflow.backend.entity.User;
import com.workflow.backend.repository.UserProfilePictureRepository;
import com.workflow.backend.repository.UserRepository;
import com.workflow.backend.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserProfilePictureRepository profilePictureRepository;

    @Mock
    private JwtService jwtService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private RefreshTokenService refreshTokenService;

    @Mock
    private AuthorizationService authorizationService;

    @Mock
    private EmailVerificationService emailVerificationService;

    @InjectMocks
    private UserService userService;

    private User testUser;
    private RegisterRequest registerRequest;
    private LoginRequest loginRequest;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("testuser");
        testUser.setEmail("test@example.com");
        testUser.setPassword("encodedPassword");

        registerRequest = new RegisterRequest();
        registerRequest.setUsername("newuser");
        registerRequest.setEmail("new@example.com");
        registerRequest.setPassword("Password123!");

        loginRequest = new LoginRequest();
        loginRequest.setUsername("testuser");
        loginRequest.setPassword("password");
    }

    @Nested
    @DisplayName("Register Tests")
    class RegisterTests {

        @Test
        @DisplayName("Should register user successfully")
        void register_Success() {
            // Arrange
            when(userRepository.findByUsername(anyString())).thenReturn(null);
            when(userRepository.findByEmail(anyString())).thenReturn(null);
            when(emailVerificationService.verifyCode(anyString(), anyString())).thenReturn(true);
            when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
                User user = invocation.getArgument(0);
                user.setId(1L);
                return user;
            });
            when(jwtService.generateAccessToken(anyString(), any(Long.class))).thenReturn("accessToken");

            RefreshToken refreshToken = new RefreshToken();
            refreshToken.setToken("refreshToken");
            when(refreshTokenService.createRefreshToken(anyString())).thenReturn(refreshToken);

            registerRequest.setCode("123456");

            // Act
            UserResponse response = userService.register(registerRequest);

            // Assert
            assertThat(response).isNotNull();
            assertThat(response.getUsername()).isEqualTo("newuser");
            assertThat(response.getEmail()).isEqualTo("new@example.com");
            assertThat(response.getToken()).isEqualTo("accessToken");
            assertThat(response.getRefreshToken()).isEqualTo("refreshToken");
            verify(userRepository).save(any(User.class));
        }

        @Test
        @DisplayName("Should throw exception when username already exists")
        void register_DuplicateUsername_ThrowsException() {
            // Arrange
            when(userRepository.findByUsername("newuser")).thenReturn(testUser);

            // Act & Assert
            assertThatThrownBy(() -> userService.register(registerRequest))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("kullanıcı adı zaten alınmış");

            verify(userRepository, never()).save(any(User.class));
        }

        @Test
        @DisplayName("Should throw exception when email already exists")
        void register_DuplicateEmail_ThrowsException() {
            // Arrange
            when(userRepository.findByUsername(anyString())).thenReturn(null);
            when(userRepository.findByEmail("new@example.com")).thenReturn(testUser);

            // Act & Assert
            assertThatThrownBy(() -> userService.register(registerRequest))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("email adresi zaten kullanılıyor");

            verify(userRepository, never()).save(any(User.class));
        }
    }

    @Nested
    @DisplayName("Login Tests")
    class LoginTests {

        @Test
        @DisplayName("Should login user successfully")
        void login_Success() {
            // Arrange
            when(userRepository.findByUsername("testuser")).thenReturn(testUser);
            when(passwordEncoder.matches("password", "encodedPassword")).thenReturn(true);
            when(jwtService.generateAccessToken("testuser", 1L)).thenReturn("accessToken");
            when(profilePictureRepository.findPictureDataByUserId(1L)).thenReturn(Optional.empty());

            RefreshToken refreshToken = new RefreshToken();
            refreshToken.setToken("refreshToken");
            when(refreshTokenService.createRefreshToken("testuser")).thenReturn(refreshToken);

            // Act
            UserResponse response = userService.login(loginRequest);

            // Assert
            assertThat(response).isNotNull();
            assertThat(response.getUsername()).isEqualTo("testuser");
            assertThat(response.getToken()).isEqualTo("accessToken");
            assertThat(response.getRefreshToken()).isEqualTo("refreshToken");
        }

        @Test
        @DisplayName("Should throw exception when password is invalid")
        void login_InvalidPassword_ThrowsException() {
            // Arrange
            when(userRepository.findByUsername("testuser")).thenReturn(testUser);
            when(passwordEncoder.matches("password", "encodedPassword")).thenReturn(false);

            // Act & Assert
            assertThatThrownBy(() -> userService.login(loginRequest))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Kullanıcı adı veya şifre hatalı");
        }

        @Test
        @DisplayName("Should throw exception when user not found")
        void login_UserNotFound_ThrowsException() {
            // Arrange
            when(userRepository.findByUsername("testuser")).thenReturn(null);

            // Act & Assert
            assertThatThrownBy(() -> userService.login(loginRequest))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Kullanıcı adı veya şifre hatalı");
        }
    }

    @Nested
    @DisplayName("Password Update Tests")
    class PasswordUpdateTests {

        @Test
        @DisplayName("Should update password successfully")
        void updatePassword_Success() {
            // Arrange
            UpdatePasswordRequest request = new UpdatePasswordRequest();
            request.setCurrentPassword("currentPassword");
            request.setNewPassword("newPassword123!");

            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(passwordEncoder.matches("currentPassword", "encodedPassword")).thenReturn(true);
            when(passwordEncoder.encode("newPassword123!")).thenReturn("newEncodedPassword");
            doNothing().when(authorizationService).verifyUserOwnership(1L);

            // Act
            userService.updatePassword(1L, request);

            // Assert
            verify(userRepository).save(any(User.class));
        }

        @Test
        @DisplayName("Should throw exception when current password is wrong")
        void updatePassword_WrongCurrentPassword_ThrowsException() {
            // Arrange
            UpdatePasswordRequest request = new UpdatePasswordRequest();
            request.setCurrentPassword("wrongPassword");
            request.setNewPassword("newPassword123!");

            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(passwordEncoder.matches("wrongPassword", "encodedPassword")).thenReturn(false);
            doNothing().when(authorizationService).verifyUserOwnership(1L);

            // Act & Assert
            assertThatThrownBy(() -> userService.updatePassword(1L, request))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Mevcut şifre hatalı");

            verify(userRepository, never()).save(any(User.class));
        }
    }
}
