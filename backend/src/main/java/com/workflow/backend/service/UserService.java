package com.workflow.backend.service;

import com.workflow.backend.dto.LoginRequest;
import com.workflow.backend.dto.RegisterRequest;
import com.workflow.backend.dto.UpdatePasswordRequest;
import com.workflow.backend.dto.UpdateProfileRequest;
import com.workflow.backend.dto.UserResponse;
import com.workflow.backend.entity.RefreshToken;
import com.workflow.backend.entity.User;
import com.workflow.backend.exception.DuplicateResourceException;
import com.workflow.backend.exception.InvalidCredentialsException;
import com.workflow.backend.exception.ResourceNotFoundException;
import com.workflow.backend.repository.UserRepository;
import com.workflow.backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final RefreshTokenService refreshTokenService;
    private final AuthorizationService authorizationService;

    // KAYIT OLMA İŞLEMİ
    public UserResponse register(RegisterRequest request) {
        // 1. Kural: Bu kullanıcı adı zaten var mı?
        if (userRepository.findByUsername(request.getUsername()) != null) {
            throw new DuplicateResourceException("Kullanıcı adı", "username", request.getUsername());
        }

        // 2. Kural: Bu email zaten kullanılıyor mu?
        if (userRepository.findByEmail(request.getEmail()) != null) {
            throw new DuplicateResourceException("Email adresi", "email", request.getEmail());
        }

        // 3. Entity Oluştur ve Verileri Aktar
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword())); // BCrypt ile şifrele

        // 3. Kaydet
        User savedUser = userRepository.save(user);

        // 4. Access Token Üret
        String accessToken = jwtService.generateAccessToken(savedUser.getUsername());

        // 5. Refresh Token Üret
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(savedUser.getUsername());

        // 6. Response DTO'ya çevirip dön
        UserResponse response = mapToResponse(savedUser);
        response.setToken(accessToken);
        response.setRefreshToken(refreshToken.getToken());
        return response;
    }

    // GİRİŞ YAPMA İŞLEMİ
    public UserResponse login(LoginRequest request) {
        // 1. Kullanıcıyı bul
        User user = userRepository.findByUsername(request.getUsername());

        // 2. Kullanıcı yoksa veya şifre yanlışsa hata ver
        if (user == null || !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new InvalidCredentialsException("Kullanıcı adı veya şifre hatalı!");
        }

        // 3. Access Token Üret
        String accessToken = jwtService.generateAccessToken(user.getUsername());

        // 4. Refresh Token Üret
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getUsername());

        // 5. Giriş başarılı, bilgileri ve token'ları dön
        UserResponse response = mapToResponse(user);
        response.setToken(accessToken);
        response.setRefreshToken(refreshToken.getToken());
        return response;
    }

    // KULLANICI BİLGİLERİNİ GETİR
    public UserResponse getUserById(Long id) {
        // Kullanıcı sadece kendi bilgilerini görebilir
        authorizationService.verifyUserOwnership(id);

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Kullanıcı", "id", id));
        return mapToResponse(user);
    }

    // PROFİL GÜNCELLEME İŞLEMİ
    public UserResponse updateProfile(Long id, UpdateProfileRequest request) {
        // Kullanıcı sadece kendi profilini güncelleyebilir
        authorizationService.verifyUserOwnership(id);

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Kullanıcı", "id", id));

        boolean usernameChanged = false;

        // Username güncelleme (eğer değiştirildiyse ve başkası kullanmıyorsa)
        if (request.getUsername() != null && !request.getUsername().equals(user.getUsername())) {
            User existingUser = userRepository.findByUsername(request.getUsername());
            if (existingUser != null && !existingUser.getId().equals(id)) {
                throw new DuplicateResourceException("Kullanıcı adı", "username", request.getUsername());
            }
            user.setUsername(request.getUsername());
            usernameChanged = true;
        }

        // Profil resmi güncelleme
        if (request.getProfilePicture() != null) {
            user.setProfilePicture(request.getProfilePicture());
        }

        User savedUser = userRepository.save(user);
        UserResponse response = mapToResponse(savedUser);

        // Kullanıcı adı değiştiyse yeni token'lar üret
        if (usernameChanged) {
            String accessToken = jwtService.generateAccessToken(savedUser.getUsername());
            RefreshToken refreshToken = refreshTokenService.createRefreshToken(savedUser.getUsername());
            response.setToken(accessToken);
            response.setRefreshToken(refreshToken.getToken());
        }

        return response;
    }

    // ŞİFRE GÜNCELLEME İŞLEMİ
    public void updatePassword(Long id, UpdatePasswordRequest request) {
        // Kullanıcı sadece kendi şifresini güncelleyebilir
        authorizationService.verifyUserOwnership(id);

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Kullanıcı", "id", id));

        // Mevcut şifre kontrolü
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new InvalidCredentialsException("Mevcut şifre hatalı!");
        }

        // Yeni şifre güncelle
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    // Yardımcı Metot: Entity -> DTO Çevirici
    private UserResponse mapToResponse(User user) {
        UserResponse response = new UserResponse();
        response.setId(user.getId());
        response.setUsername(user.getUsername());
        response.setEmail(user.getEmail());
        response.setProfilePicture(user.getProfilePicture());
        // Token burada set edilmiyor, yukarıda metot içinde ediliyor.
        return response;
    }
}
