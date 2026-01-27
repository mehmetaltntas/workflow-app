package com.workflow.backend.service;

import com.workflow.backend.dto.*;
import com.workflow.backend.exception.InvalidVerificationCodeException;
import com.workflow.backend.entity.AuthProvider;
import com.workflow.backend.entity.RefreshToken;
import com.workflow.backend.entity.User;
import com.workflow.backend.entity.UserProfilePicture;
import com.workflow.backend.exception.DuplicateResourceException;
import com.workflow.backend.exception.InvalidCredentialsException;
import com.workflow.backend.exception.ResourceNotFoundException;
import com.workflow.backend.repository.UserProfilePictureRepository;
import com.workflow.backend.repository.UserRepository;
import com.workflow.backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserProfilePictureRepository profilePictureRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final RefreshTokenService refreshTokenService;
    private final AuthorizationService authorizationService;
    private final EmailVerificationService emailVerificationService;
    private final CurrentUserService currentUserService;
    private final ConnectionService connectionService;

    // KULLANICI ADI MÜSAİTLİK KONTROLÜ
    public boolean isUsernameAvailable(String username) {
        return userRepository.findByUsername(username) == null;
    }

    // EMAIL MÜSAİTLİK KONTROLÜ
    public boolean isEmailAvailable(String email) {
        return userRepository.findByEmail(email) == null;
    }

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

        // 3. Email dogrulama kodunu kontrol et
        if (!emailVerificationService.verifyCode(request.getEmail(), request.getCode())) {
            throw new InvalidVerificationCodeException("Geçersiz veya süresi dolmuş doğrulama kodu");
        }

        // Kodu kullanildi olarak isaretle
        emailVerificationService.markCodeAsUsed(request.getEmail(), request.getCode());

        // 4. Entity Oluştur ve Verileri Aktar
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword())); // BCrypt ile şifrele

        // 3. Kaydet
        User savedUser = userRepository.save(user);

        // 4. Access Token Üret (userId claim ile)
        String accessToken = jwtService.generateAccessToken(savedUser.getUsername(), savedUser.getId());

        // 5. Refresh Token Üret
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(savedUser.getUsername());

        // 6. Response DTO'ya cevirip don (yeni kayit, profil resmi yok)
        UserResponse response = mapToResponse(savedUser, null);
        response.setToken(accessToken);
        response.setRefreshToken(refreshToken.getToken());
        return response;
    }

    // GIRIS YAPMA ISLEMI
    public UserResponse login(LoginRequest request) {
        // 1. Kullanıcıyı bul
        User user = userRepository.findByUsername(request.getUsername());

        // 2. Kullanıcı yoksa hata ver
        if (user == null) {
            throw new InvalidCredentialsException("Kullanıcı adı veya şifre hatalı!");
        }

        // 3. Google OAuth kullanıcısı şifre ile giriş yapamaz (password null)
        if (user.getAuthProvider() == AuthProvider.GOOGLE) {
            throw new InvalidCredentialsException(
                    "Bu hesap Google ile oluşturulmuş, lütfen Google ile giriş yapın.");
        }

        // 4. Şifre kontrolü
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new InvalidCredentialsException("Kullanıcı adı veya şifre hatalı!");
        }

        // 3. Access Token Üret (userId claim ile)
        String accessToken = jwtService.generateAccessToken(user.getUsername(), user.getId());

        // 4. Refresh Token Üret
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getUsername());

        // 5. Giris basarili, bilgileri ve token'lari don
        String pictureData = profilePictureRepository.findPictureDataByUserId(user.getId()).orElse(null);
        UserResponse response = mapToResponse(user, pictureData);
        response.setToken(accessToken);
        response.setRefreshToken(refreshToken.getToken());
        return response;
    }

    // KULLANICI BILGILERINI GETIR
    public UserResponse getUserById(Long id) {
        // Kullanici sadece kendi bilgilerini gorebilir
        authorizationService.verifyUserOwnership(id);

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Kullanici", "id", id));

        // Profil resmini ayri sorgu ile al (lazy loading)
        String pictureData = profilePictureRepository.findPictureDataByUserId(id).orElse(null);
        return mapToResponse(user, pictureData);
    }

    // PROFIL GUNCELLEME ISLEMI
    @Transactional
    public UserResponse updateProfile(Long id, UpdateProfileRequest request) {
        // Kullanici sadece kendi profilini guncelleyebilir
        authorizationService.verifyUserOwnership(id);

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Kullanici", "id", id));

        boolean usernameChanged = false;

        // Username guncelleme (eger degistirildiyse ve baskasi kullanmiyorsa)
        if (request.getUsername() != null && !request.getUsername().equals(user.getUsername())) {
            User existingUser = userRepository.findByUsername(request.getUsername());
            if (existingUser != null && !existingUser.getId().equals(id)) {
                throw new DuplicateResourceException("Kullanici adi", "username", request.getUsername());
            }
            user.setUsername(request.getUsername());
            usernameChanged = true;
        }

        // Profil resmi guncelleme (ayri tabloda saklaniyor)
        if (request.getProfilePicture() != null) {
            UserProfilePicture profilePic = profilePictureRepository.findByUserId(id)
                    .orElse(new UserProfilePicture(user, null));
            profilePic.setPictureData(request.getProfilePicture());
            profilePic.setUser(user);
            profilePictureRepository.save(profilePic);
        }

        User savedUser = userRepository.save(user);

        // Profil resmini ayri sorgu ile al (lazy loading nedeniyle)
        String pictureData = profilePictureRepository.findPictureDataByUserId(id).orElse(null);
        UserResponse response = mapToResponse(savedUser, pictureData);

        // Kullanici adi degistiyse yeni token'lar uret
        if (usernameChanged) {
            String accessToken = jwtService.generateAccessToken(savedUser.getUsername(), savedUser.getId());
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

        // Google OAuth kullanıcısı şifre güncelleyemez (password null)
        if (user.getAuthProvider() == AuthProvider.GOOGLE) {
            throw new InvalidCredentialsException(
                    "Bu hesap Google ile oluşturulmuş, şifre işlemleri kullanılamaz.");
        }

        // Mevcut şifre kontrolü
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new InvalidCredentialsException("Mevcut şifre hatalı!");
        }

        // Yeni şifre güncelle
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    // KULLANICI ARAMA
    public List<UserSearchResponse> searchUsers(String query) {
        Long currentUserId = currentUserService.getCurrentUserId();
        List<User> users = userRepository.searchByUsername(query, currentUserId);

        // Max 10 sonuc
        List<User> limited = users.size() > 10 ? users.subList(0, 10) : users;

        return limited.stream().map(user -> {
            UserSearchResponse response = new UserSearchResponse();
            response.setId(user.getId());
            response.setUsername(user.getUsername());
            response.setProfilePicture(
                    profilePictureRepository.findPictureDataByUserId(user.getId()).orElse(null));
            return response;
        }).toList();
    }

    // BASKA KULLANICININ PROFILINI GORUNTULE
    public UserProfileResponse getUserProfile(String username) {
        Long currentUserId = currentUserService.getCurrentUserId();

        User user = userRepository.findByUsername(username);
        if (user == null) {
            throw new ResourceNotFoundException("Kullanici", "username", username);
        }

        String connectionStatus = connectionService.getConnectionStatus(currentUserId, user.getId());
        long connectionCount = connectionService.getConnectionCount(user.getId());
        Long connectionId = connectionService.getConnectionId(currentUserId, user.getId());

        UserProfileResponse response = new UserProfileResponse();
        response.setId(user.getId());
        response.setUsername(user.getUsername());
        response.setIsProfilePublic(user.getIsProfilePublic());
        response.setConnectionStatus(connectionStatus);
        response.setConnectionId(connectionId);

        // Gizli profilde baglanti sayisi ve profil resmi gosterilmez (kendi profili haricinde)
        if (Boolean.TRUE.equals(user.getIsProfilePublic()) || "SELF".equals(connectionStatus) || "ACCEPTED".equals(connectionStatus)) {
            response.setConnectionCount(connectionCount);
            response.setProfilePicture(
                    profilePictureRepository.findPictureDataByUserId(user.getId()).orElse(null));
        } else {
            response.setConnectionCount(null);
            response.setProfilePicture(null);
        }

        return response;
    }

    // GIZLILIK AYARI GUNCELLE
    @Transactional
    public void updatePrivacy(Long userId, UpdatePrivacyRequest request) {
        authorizationService.verifyUserOwnership(userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Kullanici", "id", userId));

        user.setIsProfilePublic(request.getIsProfilePublic());
        userRepository.save(user);
    }

    // Yardimci Metot: Entity -> DTO Cevirici
    // pictureData parametresi profil resminin Base64 verisini icerir (ayri tablodan geliyor).
    private UserResponse mapToResponse(User user, String pictureData) {
        UserResponse response = new UserResponse();
        response.setId(user.getId());
        response.setUsername(user.getUsername());
        response.setEmail(user.getEmail());
        response.setProfilePicture(pictureData);
        // Token burada set edilmiyor, yukarida metot icinde ediliyor.
        return response;
    }
}
