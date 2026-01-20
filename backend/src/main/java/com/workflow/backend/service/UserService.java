package com.workflow.backend.service;

import com.workflow.backend.dto.LoginRequest;
import com.workflow.backend.dto.RegisterRequest;
import com.workflow.backend.dto.UserResponse;
import com.workflow.backend.entity.User;
import com.workflow.backend.repository.UserRepository;
import com.workflow.backend.security.JwtService; // JWT Servisini ekledik
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final JwtService jwtService; // Token üretmek için servisi çağırdık

    // KAYIT OLMA İŞLEMİ
    public UserResponse register(RegisterRequest request) {
        // 1. Kural: Bu kullanıcı adı zaten var mı?
        if (userRepository.findByUsername(request.getUsername()) != null) {
            throw new RuntimeException("Bu kullanıcı adı zaten alınmış!");
        }

        // 2. Entity Oluştur ve Verileri Aktar
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(request.getPassword()); // Şimdilik düz metin (Prodüksiyonda BCrypt kullanılır)

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
        if (user == null || !user.getPassword().equals(request.getPassword())) {
            throw new RuntimeException("Kullanıcı adı veya şifre hatalı!");
        }

        // 3. Token Üret
        String token = jwtService.generateToken(user.getUsername());

        // 4. Giriş başarılı, bilgileri ve token'ı dön
        UserResponse response = mapToResponse(user);
        response.setToken(token);
        return response;
    }

    // Yardımcı Metot: Entity -> DTO Çevirici
    private UserResponse mapToResponse(User user) {
        UserResponse response = new UserResponse();
        response.setId(user.getId());
        response.setUsername(user.getUsername());
        response.setEmail(user.getEmail());
        // Token burada set edilmiyor, yukarıda metot içinde ediliyor.
        return response;
    }
}