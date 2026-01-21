package com.workflow.backend.service;

import com.workflow.backend.dto.LoginRequest;
import com.workflow.backend.dto.RegisterRequest;
import com.workflow.backend.dto.UpdatePasswordRequest;
import com.workflow.backend.dto.UpdateProfileRequest;
import com.workflow.backend.dto.UserResponse;
import com.workflow.backend.entity.User;
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

    // KAYIT OLMA İŞLEMİ
    public UserResponse register(RegisterRequest request) {
        // 1. Kural: Bu kullanıcı adı zaten var mı?
        if (userRepository.findByUsername(request.getUsername()) != null) {
            throw new RuntimeException("Bu kullanıcı adı zaten alınmış!");
        }

        // 2. Kural: Bu email zaten kullanılıyor mu?
        if (userRepository.findByEmail(request.getEmail()) != null) {
            throw new RuntimeException("Bu email adresi zaten kullanılıyor!");
        }

        // 3. Entity Oluştur ve Verileri Aktar
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword())); // BCrypt ile şifrele

        // 3. Kaydet
        User savedUser = userRepository.save(user);

        // 4. Token Üret
        String token = jwtService.generateToken(savedUser.getUsername());

        // 5. Response DTO'ya çevirip dön
        UserResponse response = mapToResponse(savedUser);
        response.setToken(token); // Token'ı kutuya koyduk
        return response;
    }

    // GİRİŞ YAPMA İŞLEMİ
    public UserResponse login(LoginRequest request) {
        // 1. Kullanıcıyı bul
        User user = userRepository.findByUsername(request.getUsername());

        // 2. Kullanıcı yoksa veya şifre yanlışsa hata ver
        if (user == null || !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Kullanıcı adı veya şifre hatalı!");
        }

        // 3. Token Üret
        String token = jwtService.generateToken(user.getUsername());

        // 4. Giriş başarılı, bilgileri ve token'ı dön
        UserResponse response = mapToResponse(user);
        response.setToken(token);
        return response;
    }

    // KULLANICI BİLGİLERİNİ GETİR
    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı!"));
        return mapToResponse(user);
    }

    // PROFİL GÜNCELLEME İŞLEMİ
    public UserResponse updateProfile(Long id, UpdateProfileRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı!"));

        // Username güncelleme (eğer değiştirildiyse ve başkası kullanmıyorsa)
        if (request.getUsername() != null && !request.getUsername().equals(user.getUsername())) {
            User existingUser = userRepository.findByUsername(request.getUsername());
            if (existingUser != null && !existingUser.getId().equals(id)) {
                throw new RuntimeException("Bu kullanıcı adı zaten kullanılıyor!");
            }
            user.setUsername(request.getUsername());
        }

        // Profil resmi güncelleme
        if (request.getProfilePicture() != null) {
            user.setProfilePicture(request.getProfilePicture());
        }

        User savedUser = userRepository.save(user);
        return mapToResponse(savedUser);
    }

    // ŞİFRE GÜNCELLEME İŞLEMİ
    public void updatePassword(Long id, UpdatePasswordRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı!"));

        // Mevcut şifre kontrolü
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new RuntimeException("Mevcut şifre hatalı!");
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