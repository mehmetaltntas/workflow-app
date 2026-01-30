package com.workflow.backend.service;

import com.workflow.backend.dto.*;
import com.workflow.backend.exception.InvalidVerificationCodeException;
import com.workflow.backend.entity.*;
import com.workflow.backend.exception.DuplicateResourceException;
import com.workflow.backend.exception.InvalidCredentialsException;
import com.workflow.backend.exception.ResourceNotFoundException;
import com.workflow.backend.exception.UnauthorizedAccessException;
import com.workflow.backend.repository.*;
import com.workflow.backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserProfilePictureRepository profilePictureRepository;
    private final UserPrivacySettingsRepository privacySettingsRepository;
    private final ProfilePictureStorageService profilePictureStorageService;
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

    // KULLANICI ADI MÜSAİTLİK KONTROLÜ (case-insensitive)
    public boolean isUsernameAvailable(String username) {
        return userRepository.findByUsernameIgnoreCase(username) == null;
    }

    // EMAIL MÜSAİTLİK KONTROLÜ (case-insensitive)
    public boolean isEmailAvailable(String email) {
        return userRepository.findByEmailIgnoreCase(email) == null;
    }

    // KAYIT OLMA İŞLEMİ
    public UserResponse register(RegisterRequest request) {
        // Kullanici adi ve email her zaman kucuk harfle saklanir
        String username = request.getUsername().toLowerCase();
        String email = request.getEmail().toLowerCase();

        // 1. Kural: Bu kullanıcı adı zaten var mı? (case-insensitive)
        if (userRepository.findByUsernameIgnoreCase(username) != null) {
            throw new DuplicateResourceException("Kullanıcı adı", "username", username);
        }

        // 2. Kural: Bu email zaten kullanılıyor mu? (case-insensitive)
        if (userRepository.findByEmailIgnoreCase(email) != null) {
            throw new DuplicateResourceException("Email adresi", "email", email);
        }

        // 3. Email dogrulama kodunu kontrol et
        if (!emailVerificationService.verifyCode(email, request.getCode())) {
            throw new InvalidVerificationCodeException("Geçersiz veya süresi dolmuş doğrulama kodu");
        }

        // Kodu kullanildi olarak isaretle
        emailVerificationService.markCodeAsUsed(email, request.getCode());

        // 4. Entity Oluştur ve Verileri Aktar
        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
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
        // 1. Kullanıcıyı bul (case-insensitive)
        User user = userRepository.findByUsernameIgnoreCase(request.getUsername());

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
        String profilePictureUrl = getProfilePictureUrl(user.getId());
        UserResponse response = mapToResponse(user, profilePictureUrl);
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

        // Profil resmi URL'ini al
        String profilePictureUrl = getProfilePictureUrl(id);
        return mapToResponse(user, profilePictureUrl);
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
        if (request.getUsername() != null && !request.getUsername().toLowerCase().equals(user.getUsername())) {
            String newUsername = request.getUsername().toLowerCase();
            User existingUser = userRepository.findByUsernameIgnoreCase(newUsername);
            if (existingUser != null && !existingUser.getId().equals(id)) {
                throw new DuplicateResourceException("Kullanici adi", "username", newUsername);
            }
            user.setUsername(newUsername);
            usernameChanged = true;
        }

        // İsim guncelleme
        if (request.getFirstName() != null) {
            user.setFirstName(request.getFirstName());
        }

        // Soyisim guncelleme
        if (request.getLastName() != null) {
            user.setLastName(request.getLastName());
        }

        // Profil resmi guncelleme (dosya sisteminde saklaniyor)
        if (request.getProfilePicture() != null) {
            UserProfilePicture profilePic = profilePictureRepository.findByUserId(id)
                    .orElse(new UserProfilePicture(user, null));

            // Eski dosyayi sil
            if (profilePic.getFilePath() != null) {
                profilePictureStorageService.delete(profilePic.getFilePath());
            }

            // Yeni dosyayi kaydet
            String filePath = profilePictureStorageService.save(id, request.getProfilePicture());
            profilePic.setFilePath(filePath);
            profilePic.setUser(user);
            profilePictureRepository.save(profilePic);
        }

        User savedUser = userRepository.save(user);

        // Profil resmi URL'ini al
        String profilePictureUrl = getProfilePictureUrl(id);
        UserResponse response = mapToResponse(savedUser, profilePictureUrl);

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
            response.setProfilePicture(getProfilePictureUrl(user.getId()));
            return response;
        }).toList();
    }

    // BASKA KULLANICININ PROFILINI GORUNTULE
    public UserProfileResponse getUserProfile(String username) {
        Long currentUserId = currentUserService.getCurrentUserId();

        User user = userRepository.findByUsernameIgnoreCase(username);
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
        response.setPrivacyMode(user.getPrivacyMode().name());
        response.setConnectionStatus(connectionStatus);
        response.setConnectionId(connectionId);

        boolean isSelfOrConnected = "SELF".equals(connectionStatus) || "ACCEPTED".equals(connectionStatus);
        PrivacyMode mode = user.getPrivacyMode();

        if (mode == PrivacyMode.PUBLIC || isSelfOrConnected) {
            // Tam gorunurluk
            response.setConnectionCount(connectionCount);
            response.setProfilePicture(getProfilePictureUrl(user.getId()));
        } else if (mode == PrivacyMode.PRIVATE) {
            // Granular gorunurluk
            UserPrivacySettings settings = privacySettingsRepository.findByUserId(user.getId())
                    .orElse(new UserPrivacySettings(user));
            response.setProfilePicture(
                    Boolean.TRUE.equals(settings.getShowProfilePicture()) ? getProfilePictureUrl(user.getId()) : null
            );
            response.setConnectionCount(
                    Boolean.TRUE.equals(settings.getShowConnectionCount()) ? connectionCount : null
            );

            // Granular ayarlari response'a ekle (frontend hangi bolumu gosterecegini bilsin)
            PrivacySettingsResponse privacyResponse = buildPrivacySettingsResponse(user.getPrivacyMode(), settings);
            response.setPrivacySettings(privacyResponse);
        } else {
            // HIDDEN mod - baglanti disindakilere profil resmi ve baglanti sayisi gosterilmez
            response.setConnectionCount(null);
            response.setProfilePicture(null);
        }

        return response;
    }

    // GIZLILIK AYARI GUNCELLE
    @Transactional
    public PrivacySettingsResponse updatePrivacy(Long userId, UpdatePrivacyRequest request) {
        authorizationService.verifyUserOwnership(userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Kullanici", "id", userId));

        user.setPrivacyMode(request.getPrivacyMode());

        // PRIVATE modunda granular ayarlari kaydet/guncelle
        if (request.getPrivacyMode() == PrivacyMode.PRIVATE && request.getGranularSettings() != null) {
            UserPrivacySettings settings = privacySettingsRepository.findByUserId(userId)
                    .orElse(new UserPrivacySettings(user));

            UpdatePrivacyRequest.GranularPrivacySettings gs = request.getGranularSettings();
            if (gs.getShowProfilePicture() != null) settings.setShowProfilePicture(gs.getShowProfilePicture());
            if (gs.getShowOverallProgress() != null) settings.setShowOverallProgress(gs.getShowOverallProgress());
            if (gs.getShowBoardStats() != null) settings.setShowBoardStats(gs.getShowBoardStats());
            if (gs.getShowListStats() != null) settings.setShowListStats(gs.getShowListStats());
            if (gs.getShowTaskStats() != null) settings.setShowTaskStats(gs.getShowTaskStats());
            if (gs.getShowSubtaskStats() != null) settings.setShowSubtaskStats(gs.getShowSubtaskStats());
            if (gs.getShowTeamBoardStats() != null) settings.setShowTeamBoardStats(gs.getShowTeamBoardStats());
            if (gs.getShowTopCategories() != null) settings.setShowTopCategories(gs.getShowTopCategories());
            if (gs.getShowConnectionCount() != null) settings.setShowConnectionCount(gs.getShowConnectionCount());

            settings.setUser(user);
            privacySettingsRepository.save(settings);
        }

        userRepository.save(user);
        return getPrivacySettings(userId);
    }

    // GIZLILIK AYARLARINI GETIR
    public PrivacySettingsResponse getPrivacySettings(Long userId) {
        authorizationService.verifyUserOwnership(userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Kullanici", "id", userId));

        UserPrivacySettings settings = privacySettingsRepository.findByUserId(userId)
                .orElse(new UserPrivacySettings(user));

        return buildPrivacySettingsResponse(user.getPrivacyMode(), settings);
    }

    // Yardimci: PrivacySettingsResponse olustur
    private PrivacySettingsResponse buildPrivacySettingsResponse(PrivacyMode mode, UserPrivacySettings settings) {
        PrivacySettingsResponse response = new PrivacySettingsResponse();
        response.setPrivacyMode(mode);
        response.setShowProfilePicture(settings.getShowProfilePicture());
        response.setShowOverallProgress(settings.getShowOverallProgress());
        response.setShowBoardStats(settings.getShowBoardStats());
        response.setShowListStats(settings.getShowListStats());
        response.setShowTaskStats(settings.getShowTaskStats());
        response.setShowSubtaskStats(settings.getShowSubtaskStats());
        response.setShowTeamBoardStats(settings.getShowTeamBoardStats());
        response.setShowTopCategories(settings.getShowTopCategories());
        response.setShowConnectionCount(settings.getShowConnectionCount());
        return response;
    }

    // KULLANICI PROFIL ISTATISTIKLERINI GETIR
    @Cacheable(value = "profileStats", key = "#username.toLowerCase()")
    @Transactional(readOnly = true)
    public UserProfileStatsResponse getUserProfileStats(String username) {
        Long currentUserId = currentUserService.getCurrentUserId();

        User targetUser = userRepository.findByUsernameIgnoreCase(username);
        if (targetUser == null) {
            throw new ResourceNotFoundException("Kullanici", "username", username);
        }

        Long targetUserId = targetUser.getId();

        // Erisim kontrolu: SELF, ACCEPTED baglanti, herkese acik veya ozel profil
        String connectionStatus = connectionService.getConnectionStatus(currentUserId, targetUserId);
        boolean isSelf = "SELF".equals(connectionStatus);
        boolean isConnected = "ACCEPTED".equals(connectionStatus);
        PrivacyMode mode = targetUser.getPrivacyMode();

        // HIDDEN modda sadece SELF ve ACCEPTED erisebilir
        if (mode == PrivacyMode.HIDDEN && !isSelf && !isConnected) {
            throw new UnauthorizedAccessException("kullanıcı istatistikleri", targetUserId);
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

        // Bireysel panolarin status dagilimi
        Map<String, Integer> individualBoardsByStatus = new LinkedHashMap<>();
        individualBoardsByStatus.put("PLANLANDI", 0);
        individualBoardsByStatus.put("DEVAM_EDIYOR", 0);
        individualBoardsByStatus.put("TAMAMLANDI", 0);
        individualBoardsByStatus.put("DURDURULDU", 0);
        individualBoardsByStatus.put("BIRAKILDI", 0);
        for (Object[] row : boardRepository.countIndividualByStatusForUser(targetUserId)) {
            String status = (String) row[0];
            int count = ((Long) row[1]).intValue();
            individualBoardsByStatus.put(status, count);
        }
        response.setIndividualBoardsByStatus(individualBoardsByStatus);

        // Takim panolarinin status dagilimi
        Map<String, Integer> teamBoardsByStatus = new LinkedHashMap<>();
        teamBoardsByStatus.put("PLANLANDI", 0);
        teamBoardsByStatus.put("DEVAM_EDIYOR", 0);
        teamBoardsByStatus.put("TAMAMLANDI", 0);
        teamBoardsByStatus.put("DURDURULDU", 0);
        teamBoardsByStatus.put("BIRAKILDI", 0);
        for (Object[] row : boardRepository.countTeamByStatusForUser(targetUserId)) {
            String status = (String) row[0];
            int count = ((Long) row[1]).intValue();
            teamBoardsByStatus.put(status, count);
        }
        response.setTeamBoardsByStatus(teamBoardsByStatus);

        // Liste istatistikleri
        List<Object[]> listStatsResult = taskListRepository.countStatsForUser(targetUserId);
        Object[] listStats = listStatsResult.isEmpty() ? new Object[]{0L, 0L} : listStatsResult.get(0);
        int totalLists = listStats[0] != null ? ((Number) listStats[0]).intValue() : 0;
        int completedLists = listStats[1] != null ? ((Number) listStats[1]).intValue() : 0;
        response.setTotalLists(totalLists);
        response.setCompletedLists(completedLists);

        // Gorev istatistikleri
        List<Object[]> taskStatsResult = taskRepository.countStatsForUser(targetUserId);
        Object[] taskStats = taskStatsResult.isEmpty() ? new Object[]{0L, 0L} : taskStatsResult.get(0);
        int totalTasks = taskStats[0] != null ? ((Number) taskStats[0]).intValue() : 0;
        int completedTasks = taskStats[1] != null ? ((Number) taskStats[1]).intValue() : 0;
        response.setTotalTasks(totalTasks);
        response.setCompletedTasks(completedTasks);

        // Alt gorev istatistikleri
        List<Object[]> subtaskStatsResult = subtaskRepository.countStatsForUser(targetUserId);
        Object[] subtaskStats = subtaskStatsResult.isEmpty() ? new Object[]{0L, 0L} : subtaskStatsResult.get(0);
        int totalSubtasks = subtaskStats[0] != null ? ((Number) subtaskStats[0]).intValue() : 0;
        int completedSubtasks = subtaskStats[1] != null ? ((Number) subtaskStats[1]).intValue() : 0;
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

        // PRIVATE modda granular filtreleme uygula (SELF ve ACCEPTED haric)
        if (mode == PrivacyMode.PRIVATE && !isSelf && !isConnected) {
            UserPrivacySettings settings = privacySettingsRepository.findByUserId(targetUserId)
                    .orElse(new UserPrivacySettings(targetUser));

            if (!Boolean.TRUE.equals(settings.getShowOverallProgress())) {
                response.setOverallProgress(0);
            }
            if (!Boolean.TRUE.equals(settings.getShowBoardStats())) {
                response.setTotalBoards(0);
                response.setBoardsByStatus(null);
                response.setIndividualBoardsByStatus(null);
            }
            if (!Boolean.TRUE.equals(settings.getShowListStats())) {
                response.setTotalLists(0);
                response.setCompletedLists(0);
            }
            if (!Boolean.TRUE.equals(settings.getShowTaskStats())) {
                response.setTotalTasks(0);
                response.setCompletedTasks(0);
            }
            if (!Boolean.TRUE.equals(settings.getShowSubtaskStats())) {
                response.setTotalSubtasks(0);
                response.setCompletedSubtasks(0);
            }
            if (!Boolean.TRUE.equals(settings.getShowTeamBoardStats())) {
                response.setTeamBoardCount(0);
                response.setTeamBoardsByStatus(null);
            }
            if (!Boolean.TRUE.equals(settings.getShowTopCategories())) {
                response.setTopCategories(List.of());
            }
        }

        return response;
    }

    // HESAP SILME ZAMANLAMA
    @Transactional
    public UserResponse scheduleDeletion(Long userId) {
        authorizationService.verifyUserOwnership(userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Kullanici", "id", userId));

        user.setDeletionScheduledAt(LocalDateTime.now());
        User savedUser = userRepository.save(user);

        String profilePictureUrl = getProfilePictureUrl(userId);
        return mapToResponse(savedUser, profilePictureUrl);
    }

    // HESAP SILME IPTAL
    @Transactional
    public UserResponse cancelDeletion(Long userId) {
        authorizationService.verifyUserOwnership(userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Kullanici", "id", userId));

        user.setDeletionScheduledAt(null);
        User savedUser = userRepository.save(user);

        String profilePictureUrl = getProfilePictureUrl(userId);
        return mapToResponse(savedUser, profilePictureUrl);
    }

    // ZAMANLANMIS HESAPLARI SIL (Her gece 02:00'de calisir)
    @Scheduled(cron = "0 0 2 * * *")
    @Transactional
    public void processScheduledDeletions() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(30);
        List<User> usersToDelete = userRepository.findUsersScheduledForDeletion(cutoff);

        for (User user : usersToDelete) {
            log.info("Zamanlanmis hesap siliniyor: userId={}, username={}", user.getId(), user.getUsername());

            // Profil resmi dosyasini sil
            profilePictureRepository.findFilePathByUserId(user.getId())
                    .ifPresent(profilePictureStorageService::delete);

            userRepository.delete(user);
        }

        if (!usersToDelete.isEmpty()) {
            log.info("Toplam {} hesap silindi", usersToDelete.size());
        }
    }

    /**
     * Kullanici ID'sine gore profil resmi URL'i dondurur.
     * Dosya yolu varsa "/users/{userId}/profile-picture" formatinda URL uretir.
     */
    private String getProfilePictureUrl(Long userId) {
        return profilePictureRepository.findFilePathByUserId(userId)
                .map(filePath -> "/users/" + userId + "/profile-picture")
                .orElse(null);
    }

    // Yardimci Metot: Entity -> DTO Cevirici
    // profilePictureUrl parametresi profil resminin URL yolunu icerir.
    private UserResponse mapToResponse(User user, String profilePictureUrl) {
        UserResponse response = new UserResponse();
        response.setId(user.getId());
        response.setUsername(user.getUsername());
        response.setEmail(user.getEmail());
        response.setFirstName(user.getFirstName());
        response.setLastName(user.getLastName());
        response.setProfilePicture(profilePictureUrl);
        response.setDeletionScheduledAt(user.getDeletionScheduledAt());
        // Token burada set edilmiyor, yukarida metot icinde ediliyor.
        return response;
    }
}
