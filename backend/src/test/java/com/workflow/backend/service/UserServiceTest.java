package com.workflow.backend.service;

import com.workflow.backend.dto.AuthResponse;
import com.workflow.backend.dto.LoginRequest;
import com.workflow.backend.dto.RegisterRequest;
import com.workflow.backend.dto.UpdatePasswordRequest;
import com.workflow.backend.dto.UserSearchResponse;
import com.workflow.backend.entity.AuthProvider;
import com.workflow.backend.entity.RefreshToken;
import com.workflow.backend.entity.User;
import com.workflow.backend.exception.InvalidCredentialsException;
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
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserProfilePictureRepository profilePictureRepository;

    @Mock
    private ProfilePictureStorageService profilePictureStorageService;

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

    @Mock
    private CurrentUserService currentUserService;

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
            when(userRepository.findByUsernameIgnoreCase(anyString())).thenReturn(null);
            when(userRepository.findByEmailIgnoreCase(anyString())).thenReturn(null);
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
            AuthResponse response = userService.register(registerRequest);

            // Assert
            assertThat(response).isNotNull();
            assertThat(response.getUser().getUsername()).isEqualTo("newuser");
            assertThat(response.getUser().getEmail()).isEqualTo("new@example.com");
            assertThat(response.getToken()).isEqualTo("accessToken");
            assertThat(response.getRefreshToken()).isEqualTo("refreshToken");
            verify(userRepository).save(any(User.class));
        }

        @Test
        @DisplayName("Should throw exception when username already exists")
        void register_DuplicateUsername_ThrowsException() {
            // Arrange
            when(userRepository.findByUsernameIgnoreCase("newuser")).thenReturn(testUser);

            // Act & Assert
            assertThatThrownBy(() -> userService.register(registerRequest))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("zaten mevcut");

            verify(userRepository, never()).save(any(User.class));
        }

        @Test
        @DisplayName("Should throw exception when email already exists")
        void register_DuplicateEmail_ThrowsException() {
            // Arrange
            when(userRepository.findByUsernameIgnoreCase(anyString())).thenReturn(null);
            when(userRepository.findByEmailIgnoreCase("new@example.com")).thenReturn(testUser);

            // Act & Assert
            assertThatThrownBy(() -> userService.register(registerRequest))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("zaten mevcut");

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
            when(userRepository.findByUsernameIgnoreCase("testuser")).thenReturn(testUser);
            when(passwordEncoder.matches("password", "encodedPassword")).thenReturn(true);
            when(jwtService.generateAccessToken("testuser", 1L)).thenReturn("accessToken");
            when(profilePictureRepository.findFilePathByUserId(1L)).thenReturn(Optional.empty());

            RefreshToken refreshToken = new RefreshToken();
            refreshToken.setToken("refreshToken");
            when(refreshTokenService.createRefreshToken("testuser")).thenReturn(refreshToken);

            // Act
            AuthResponse response = userService.login(loginRequest);

            // Assert
            assertThat(response).isNotNull();
            assertThat(response.getUser().getUsername()).isEqualTo("testuser");
            assertThat(response.getToken()).isEqualTo("accessToken");
            assertThat(response.getRefreshToken()).isEqualTo("refreshToken");
        }

        @Test
        @DisplayName("Should throw exception when password is invalid")
        void login_InvalidPassword_ThrowsException() {
            // Arrange
            when(userRepository.findByUsernameIgnoreCase("testuser")).thenReturn(testUser);
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
            when(userRepository.findByUsernameIgnoreCase("testuser")).thenReturn(null);

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

        @Test
        @DisplayName("Should revoke all refresh tokens after password change")
        void updatePassword_Success_RevokesRefreshTokens() {
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
            verify(refreshTokenService).deleteAllByUsername("testuser");
        }

        @Test
        @DisplayName("Should throw exception when Google OAuth user tries to update password")
        void updatePassword_GoogleUser_ThrowsException() {
            // Arrange
            User googleUser = new User();
            googleUser.setId(2L);
            googleUser.setUsername("googleuser");
            googleUser.setEmail("google@example.com");
            googleUser.setAuthProvider(AuthProvider.GOOGLE);
            googleUser.setPassword(null);

            UpdatePasswordRequest request = new UpdatePasswordRequest();
            request.setCurrentPassword("anyPassword");
            request.setNewPassword("newPassword123!");

            when(userRepository.findById(2L)).thenReturn(Optional.of(googleUser));
            doNothing().when(authorizationService).verifyUserOwnership(2L);

            // Act & Assert
            assertThatThrownBy(() -> userService.updatePassword(2L, request))
                    .isInstanceOf(InvalidCredentialsException.class)
                    .hasMessageContaining("Google");

            verify(userRepository, never()).save(any(User.class));
            verify(refreshTokenService, never()).deleteAllByUsername(anyString());
        }
    }

    @Nested
    @DisplayName("Search Users Tests")
    class SearchUsersTests {

        @Test
        @DisplayName("Should return matching users when searching by query")
        void searchUsers_ReturnsMatchingUsers() {
            // Arrange
            User user1 = new User();
            user1.setId(10L);
            user1.setUsername("alice");

            User user2 = new User();
            user2.setId(11L);
            user2.setUsername("alicewonder");

            List<User> users = List.of(user1, user2);

            when(currentUserService.getCurrentUserId()).thenReturn(1L);
            when(userRepository.searchByUsername(eq("ali"), eq(1L), any(PageRequest.class)))
                    .thenReturn(users);
            when(profilePictureRepository.findFilePathsByUserIds(List.of(10L, 11L)))
                    .thenReturn(Collections.singletonList(new Object[]{10L, "/path/to/pic"}));

            // Act
            List<UserSearchResponse> results = userService.searchUsers("ali");

            // Assert
            assertThat(results).hasSize(2);
            assertThat(results.get(0).getUsername()).isEqualTo("alice");
            assertThat(results.get(1).getUsername()).isEqualTo("alicewonder");
        }

        @Test
        @DisplayName("Should return empty list when no users match the query")
        void searchUsers_NoMatches_ReturnsEmptyList() {
            // Arrange
            when(currentUserService.getCurrentUserId()).thenReturn(1L);
            when(userRepository.searchByUsername(eq("zzz"), eq(1L), any(PageRequest.class)))
                    .thenReturn(Collections.emptyList());

            // Act
            List<UserSearchResponse> results = userService.searchUsers("zzz");

            // Assert
            assertThat(results).isEmpty();
        }
    }
}
