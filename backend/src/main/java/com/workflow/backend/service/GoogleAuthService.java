package com.workflow.backend.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.workflow.backend.dto.UserResponse;
import com.workflow.backend.entity.AuthProvider;
import com.workflow.backend.entity.RefreshToken;
import com.workflow.backend.entity.User;
import com.workflow.backend.entity.UserProfilePicture;
import com.workflow.backend.exception.ConfigurationException;
import com.workflow.backend.exception.InvalidCredentialsException;
import com.workflow.backend.repository.UserProfilePictureRepository;
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
    private final UserProfilePictureRepository profilePictureRepository;
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
            String givenName = (String) payload.get("given_name");   // May be null
            String familyName = (String) payload.get("family_name"); // May be null
            String picture = (String) payload.get("picture");

            logger.info("Google ile giris: {} - {}", email, googleId);

            // Mevcut kullaniciyi bul veya yeni olustur
            User user = userRepository.findByGoogleId(googleId)
                    .orElseGet(() -> findOrCreateUser(googleId, email, givenName, familyName, name, picture));

            // Token'lari olustur (userId claim ile)
            String accessToken = jwtService.generateAccessToken(user.getUsername(), user.getId());
            RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getUsername());

            // Profil resmini ayri tablodan al
            String pictureData = profilePictureRepository.findPictureDataByUserId(user.getId()).orElse(null);

            // Response olustur
            UserResponse response = new UserResponse();
            response.setId(user.getId());
            response.setUsername(user.getUsername());
            response.setEmail(user.getEmail());
            response.setFirstName(user.getFirstName());
            response.setLastName(user.getLastName());
            response.setProfilePicture(pictureData);
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

    private User findOrCreateUser(String googleId, String email, String givenName,
                                  String familyName, String name, String picture) {
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

            // Eger firstName/lastName bos ise Google'dan set et
            if (existingUser.getFirstName() == null || existingUser.getLastName() == null) {
                String[] names = parseGoogleName(givenName, familyName, name);
                if (existingUser.getFirstName() == null) {
                    existingUser.setFirstName(names[0]);
                }
                if (existingUser.getLastName() == null) {
                    existingUser.setLastName(names[1]);
                }
                logger.info("Eksik firstName/lastName Google'dan guncellendi");
            }

            User savedUser = userRepository.save(existingUser);

            // Profil resmi yoksa ve Google'dan geldiyse kaydet (ayri tabloda)
            if (picture != null) {
                boolean hasPicture = profilePictureRepository.findByUserId(savedUser.getId()).isPresent();
                if (!hasPicture) {
                    profilePictureRepository.save(new UserProfilePicture(savedUser, picture));
                }
            }
            return savedUser;
        }

        // Yeni kullanici olustur
        User newUser = new User();
        newUser.setGoogleId(googleId);
        newUser.setEmail(email);
        newUser.setUsername(generateUniqueUsername(name, email));
        newUser.setAuthProvider(AuthProvider.GOOGLE);
        // Google ile giris yapan kullanicinin sifresi yok
        newUser.setPassword(null);

        // firstName ve lastName ayarla
        String[] names = parseGoogleName(givenName, familyName, name);
        newUser.setFirstName(names[0]);
        newUser.setLastName(names[1]);

        User savedNewUser = userRepository.save(newUser);

        // Profil resmini ayri tabloda sakla
        if (picture != null) {
            profilePictureRepository.save(new UserProfilePicture(savedNewUser, picture));
        }

        return savedNewUser;
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

    /**
     * Google'dan gelen isim bilgilerini firstName ve lastName olarak parse eder.
     *
     * Oncelik sirasi:
     * 1. Google'un sagladigi given_name ve family_name (varsa)
     * 2. name alanini parse et (yoksa)
     * 3. Varsayilan degerler (hicbiri yoksa)
     *
     * @param givenName Google'un given_name alani (null olabilir)
     * @param familyName Google'un family_name alani (null olabilir)
     * @param fullName Google'un name alani (null olabilir)
     * @return String[2] array: [0]=firstName, [1]=lastName
     */
    private String[] parseGoogleName(String givenName, String familyName, String fullName) {
        // 1. ONCELIK: Google'un sagladigi given_name ve family_name
        if (givenName != null && !givenName.trim().isEmpty() &&
            familyName != null && !familyName.trim().isEmpty()) {
            logger.info("Google given_name ve family_name kullaniliyor");
            return new String[]{givenName.trim(), familyName.trim()};
        }

        // 2. ONCELIK: given_name varsa ama family_name yoksa
        if (givenName != null && !givenName.trim().isEmpty()) {
            logger.info("Sadece Google given_name mevcut, family_name varsayilan");
            return new String[]{givenName.trim(), "User"};
        }

        // 3. ONCELIK: name alanini parse et
        if (fullName != null && !fullName.trim().isEmpty()) {
            String cleanedName = fullName.trim().replaceAll("\\s+", " ");

            if (!cleanedName.contains(" ")) {
                // Tek kelime
                logger.info("Tek kelimeli isim tespit edildi: {}", cleanedName);
                return new String[]{cleanedName, "User"};
            }

            // Birden fazla kelime: ilk kelime firstName, geri kalani lastName
            int firstSpaceIndex = cleanedName.indexOf(" ");
            String firstName = cleanedName.substring(0, firstSpaceIndex);
            String lastName = cleanedName.substring(firstSpaceIndex + 1);

            logger.info("Google name parse edildi: '{}' -> firstName='{}', lastName='{}'",
                        fullName, firstName, lastName);
            return new String[]{firstName, lastName};
        }

        // 4. VARSAYILAN: Hicbir isim bilgisi yok
        logger.warn("Google'dan hic isim bilgisi alinmadi, varsayilan degerler kullaniliyor");
        return new String[]{"Google", "User"};
    }
}
