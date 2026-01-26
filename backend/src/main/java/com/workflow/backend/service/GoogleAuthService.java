package com.workflow.backend.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.workflow.backend.dto.UserResponse;
import com.workflow.backend.entity.AuthProvider;
import com.workflow.backend.entity.RefreshToken;
import com.workflow.backend.entity.User;
import com.workflow.backend.exception.ConfigurationException;
import com.workflow.backend.exception.InvalidCredentialsException;
import com.workflow.backend.repository.UserRepository;
import com.workflow.backend.security.JwtService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;

@Service
@RequiredArgsConstructor
public class GoogleAuthService {

    private static final Logger logger = LoggerFactory.getLogger(GoogleAuthService.class);

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;

    @Value("${google.client-id:}")
    private String googleClientId;

    private GoogleIdTokenVerifier verifier;

    @PostConstruct
    public void init() {
        if (googleClientId != null && !googleClientId.isEmpty()) {
            verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), GsonFactory.getDefaultInstance())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();
            logger.info("Google OAuth verifier basariyla olusturuldu");
        } else {
            logger.warn("Google Client ID yapilandirilmamis, Google OAuth devre disi");
        }
    }

    /**
     * Google ID Token ile giris yapar veya yeni kullanici olusturur
     */
    @Transactional
    public UserResponse authenticateWithGoogle(String idToken) {
        if (verifier == null) {
            throw new ConfigurationException("Google OAuth yapılandırılmamış");
        }

        try {
            // Token'i dogrula
            GoogleIdToken googleIdToken = verifier.verify(idToken);
            if (googleIdToken == null) {
                throw new InvalidCredentialsException("Geçersiz Google token");
            }

            GoogleIdToken.Payload payload = googleIdToken.getPayload();

            String googleId = payload.getSubject();
            String email = payload.getEmail();
            String name = (String) payload.get("name");
            String picture = (String) payload.get("picture");

            logger.info("Google ile giris: {} - {}", email, googleId);

            // Mevcut kullaniciyi bul veya yeni olustur
            User user = userRepository.findByGoogleId(googleId)
                    .orElseGet(() -> findOrCreateUser(googleId, email, name, picture));

            // Token'lari olustur
            String accessToken = jwtService.generateAccessToken(user.getUsername());
            RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getUsername());

            // Response olustur
            UserResponse response = new UserResponse();
            response.setId(user.getId());
            response.setUsername(user.getUsername());
            response.setEmail(user.getEmail());
            response.setProfilePicture(user.getProfilePicture());
            response.setToken(accessToken);
            response.setRefreshToken(refreshToken.getToken());

            return response;

        } catch (ConfigurationException | InvalidCredentialsException e) {
            throw e;
        } catch (Exception e) {
            logger.error("Google authentication hatasi: {}", e.getMessage());
            throw new InvalidCredentialsException("Google ile giriş başarısız: " + e.getMessage());
        }
    }

    private User findOrCreateUser(String googleId, String email, String name, String picture) {
        // Oncelikle ayni email ile kayitli kullanici var mi kontrol et
        User existingUser = userRepository.findByEmail(email);

        if (existingUser != null) {
            // Yerel hesap varsa, Google ile baglamaya izin verme (hesap ele gecirme riski)
            if (existingUser.getAuthProvider() == AuthProvider.LOCAL) {
                throw new InvalidCredentialsException(
                        "Bu e-posta adresi zaten bir yerel hesapla kayıtlı. Lütfen şifrenizle giriş yapın.");
            }
            // Sadece Google hesabi ise bagla
            existingUser.setGoogleId(googleId);
            existingUser.setAuthProvider(AuthProvider.GOOGLE);
            if (existingUser.getProfilePicture() == null && picture != null) {
                existingUser.setProfilePicture(picture);
            }
            return userRepository.save(existingUser);
        }

        // Yeni kullanici olustur
        User newUser = new User();
        newUser.setGoogleId(googleId);
        newUser.setEmail(email);
        newUser.setUsername(generateUniqueUsername(name, email));
        newUser.setAuthProvider(AuthProvider.GOOGLE);
        newUser.setProfilePicture(picture);
        // Google ile giris yapan kullanicinin sifresi yok
        newUser.setPassword(null);

        return userRepository.save(newUser);
    }

    private String generateUniqueUsername(String name, String email) {
        // Oncelikle ismi kullan
        String baseUsername = name != null ? name.replaceAll("\\s+", "").toLowerCase() :
                email.split("@")[0].toLowerCase();

        String username = baseUsername;
        int counter = 1;

        // Benzersiz username bulana kadar numara ekle
        while (userRepository.findByUsername(username) != null) {
            username = baseUsername + counter;
            counter++;
        }

        return username;
    }
}
