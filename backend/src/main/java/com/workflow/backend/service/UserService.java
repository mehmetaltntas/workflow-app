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
import com.workflow.backend.repository.*;
import com.workflow.backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

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
    private final BoardRepository boardRepository;
    private final TaskListRepository taskListRepository;
    private final TaskRepository taskRepository;
    private final SubtaskRepository subtaskRepository;

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
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());

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
        response.setFirstName(user.getFirstName());
        response.setLastName(user.getLastName());
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

    // KULLANICI PROFIL ISTATISTIKLERINI GETIR
    @Cacheable(value = "profileStats", key = "#username")
    @Transactional(readOnly = true)
    public UserProfileStatsResponse getUserProfileStats(String username) {
        Long currentUserId = currentUserService.getCurrentUserId();

        User targetUser = userRepository.findByUsername(username);
        if (targetUser == null) {
            throw new ResourceNotFoundException("Kullanici", "username", username);
        }

        Long targetUserId = targetUser.getId();

        // Erisim kontrolu: SELF, ACCEPTED baglanti veya herkese acik profil
        String connectionStatus = connectionService.getConnectionStatus(currentUserId, targetUserId);
        boolean isSelf = "SELF".equals(connectionStatus);
        boolean isConnected = "ACCEPTED".equals(connectionStatus);
        boolean isPublic = Boolean.TRUE.equals(targetUser.getIsProfilePublic());

        if (!isSelf && !isConnected && !isPublic) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bu kullanicinin istatistiklerine erisim yetkiniz yok.");
        }

        UserProfileStatsResponse response = new UserProfileStatsResponse();

        // Board istatistikleri
        long totalBoards = boardRepository.countByUserId(targetUserId);
        response.setTotalBoards((int) totalBoards);

        long teamBoardCount = boardRepository.countTeamBoardsByUserId(targetUserId);
        response.setTeamBoardCount((int) teamBoardCount);

        Map<String, Integer> boardsByStatus = new LinkedHashMap<>();
        boardsByStatus.put("PLANLANDI", 0);
        boardsByStatus.put("DEVAM_EDIYOR", 0);
        boardsByStatus.put("TAMAMLANDI", 0);
        boardsByStatus.put("DURDURULDU", 0);
        boardsByStatus.put("BIRAKILDI", 0);
        for (Object[] row : boardRepository.countByStatusForUser(targetUserId)) {
            String status = (String) row[0];
            int count = ((Long) row[1]).intValue();
            boardsByStatus.put(status, count);
        }
        response.setBoardsByStatus(boardsByStatus);

        // Liste istatistikleri
        Object[] listStats = taskListRepository.countStatsForUser(targetUserId);
        int totalLists = listStats[0] != null ? ((Long) listStats[0]).intValue() : 0;
        int completedLists = listStats[1] != null ? ((Long) listStats[1]).intValue() : 0;
        response.setTotalLists(totalLists);
        response.setCompletedLists(completedLists);

        // Gorev istatistikleri
        Object[] taskStats = taskRepository.countStatsForUser(targetUserId);
        int totalTasks = taskStats[0] != null ? ((Long) taskStats[0]).intValue() : 0;
        int completedTasks = taskStats[1] != null ? ((Long) taskStats[1]).intValue() : 0;
        response.setTotalTasks(totalTasks);
        response.setCompletedTasks(completedTasks);

        // Alt gorev istatistikleri
        Object[] subtaskStats = subtaskRepository.countStatsForUser(targetUserId);
        int totalSubtasks = subtaskStats[0] != null ? ((Long) subtaskStats[0]).intValue() : 0;
        int completedSubtasks = subtaskStats[1] != null ? ((Long) subtaskStats[1]).intValue() : 0;
        response.setTotalSubtasks(totalSubtasks);
        response.setCompletedSubtasks(completedSubtasks);

        // Leaf-node progress hesaplamasi
        // Alt gorevi olan gorevlerde: alt gorevleri + parent gorevi say
        // Alt gorevi olmayan gorevlerde: gorevi say
        List<Object[]> taskSubtaskInfo = taskRepository.findTaskSubtaskInfoForUser(targetUserId);
        int leafTotal = 0;
        int leafCompleted = 0;
        int tasksWithSubtasks = 0;

        for (Object[] row : taskSubtaskInfo) {
            Boolean isCompleted = (Boolean) row[0];
            int subtaskCount = (Integer) row[1];

            if (subtaskCount > 0) {
                tasksWithSubtasks++;
                // Parent gorevi de say - tum subtask'lar bitse bile parent tamamlanmadiysa %100 olmaz
                leafTotal++;
                if (Boolean.TRUE.equals(isCompleted)) {
                    leafCompleted++;
                }
            } else {
                // Leaf node: gorev kendisi
                leafTotal++;
                if (Boolean.TRUE.equals(isCompleted)) {
                    leafCompleted++;
                }
            }
        }

        // Alt gorevi olan gorevlerin alt gorevlerini ekle
        if (tasksWithSubtasks > 0) {
            leafTotal += totalSubtasks;
            leafCompleted += completedSubtasks;
        }

        int overallProgress = leafTotal > 0 ? Math.round((float) leafCompleted / leafTotal * 100) : 0;
        response.setOverallProgress(overallProgress);

        // Kategori istatistikleri (top 5)
        List<Object[]> categoryData = boardRepository.countByCategoryForUser(targetUserId);
        List<UserProfileStatsResponse.CategoryStat> topCategories = new ArrayList<>();
        int limit = Math.min(categoryData.size(), 5);
        for (int i = 0; i < limit; i++) {
            Object[] row = categoryData.get(i);
            String category = (String) row[0];
            int count = ((Long) row[1]).intValue();
            topCategories.add(new UserProfileStatsResponse.CategoryStat(category, count));
        }
        response.setTopCategories(topCategories);

        return response;
    }

    // Yardimci Metot: Entity -> DTO Cevirici
    // pictureData parametresi profil resminin Base64 verisini icerir (ayri tablodan geliyor).
    private UserResponse mapToResponse(User user, String pictureData) {
        UserResponse response = new UserResponse();
        response.setId(user.getId());
        response.setUsername(user.getUsername());
        response.setEmail(user.getEmail());
        response.setFirstName(user.getFirstName());
        response.setLastName(user.getLastName());
        response.setProfilePicture(pictureData);
        // Token burada set edilmiyor, yukarida metot icinde ediliyor.
        return response;
    }
}
