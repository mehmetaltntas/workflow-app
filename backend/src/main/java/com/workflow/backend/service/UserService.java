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
    private final BoardMemberRepository boardMemberRepository;
    private final BoardMemberAssignmentRepository boardMemberAssignmentRepository;

    // KULLANICI ADI MÜSAİTLİK KONTROLÜ (case-insensitive)
    public boolean isUsernameAvailable(String username) {
        return userRepository.findByUsernameIgnoreCase(username) == null;
    }

    // EMAIL MÜSAİTLİK KONTROLÜ (case-insensitive)
    public boolean isEmailAvailable(String email) {
        return userRepository.findByEmailIgnoreCase(email) == null;
    }

    // KAYIT OLMA İŞLEMİ
    public AuthResponse register(RegisterRequest request) {
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
        UserResponse userResponse = mapToResponse(savedUser, null);
        AuthResponse authResponse = new AuthResponse();
        authResponse.setUser(userResponse);
        authResponse.setToken(accessToken);
        authResponse.setRefreshToken(refreshToken.getToken());
        return authResponse;
    }

    // GIRIS YAPMA ISLEMI
    public AuthResponse login(LoginRequest request) {
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
        UserResponse userResponse = mapToResponse(user, profilePictureUrl);
        AuthResponse authResponse = new AuthResponse();
        authResponse.setUser(userResponse);
        authResponse.setToken(accessToken);
        authResponse.setRefreshToken(refreshToken.getToken());
        return authResponse;
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
    public AuthResponse updateProfile(Long id, UpdateProfileRequest request) {
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
        UserResponse userResponse = mapToResponse(savedUser, profilePictureUrl);

        AuthResponse authResponse = new AuthResponse();
        authResponse.setUser(userResponse);

        // Kullanici adi degistiyse yeni token'lar uret
        if (usernameChanged) {
            String accessToken = jwtService.generateAccessToken(savedUser.getUsername(), savedUser.getId());
            RefreshToken refreshToken = refreshTokenService.createRefreshToken(savedUser.getUsername());
            authResponse.setToken(accessToken);
            authResponse.setRefreshToken(refreshToken.getToken());
        }

        return authResponse;
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

        // ÖNEMLİ: Mevcut refresh token'ları iptal et
        refreshTokenService.deleteAllByUsername(user.getUsername());
    }

    // KULLANICI ARAMA
    public List<UserSearchResponse> searchUsers(String query) {
        Long currentUserId = currentUserService.getCurrentUserId();
        List<User> users = userRepository.searchByUsername(query, currentUserId,
                org.springframework.data.domain.PageRequest.of(0, 10));

        // Batch: tüm profil fotoğraflarını tek sorguda kontrol et
        List<Long> userIds = users.stream().map(User::getId).toList();
        Set<Long> usersWithPicture = new java.util.HashSet<>();
        if (!userIds.isEmpty()) {
            profilePictureRepository.findFilePathsByUserIds(userIds)
                    .forEach(row -> usersWithPicture.add((Long) row[0]));
        }

        return users.stream().map(user -> {
            UserSearchResponse response = new UserSearchResponse();
            response.setId(user.getId());
            response.setUsername(user.getUsername());
            response.setProfilePicture(
                usersWithPicture.contains(user.getId())
                    ? "/users/" + user.getId() + "/profile-picture"
                    : null
            );
            return response;
        }).toList();
    }

    public List<UserSearchResponse> searchUsers(String query, int limit) {
        Long currentUserId = currentUserService.getCurrentUserId();
        List<User> users = userRepository.searchByUsername(query, currentUserId,
                org.springframework.data.domain.PageRequest.of(0, limit));

        List<Long> userIds = users.stream().map(User::getId).toList();
        Set<Long> usersWithPicture = new java.util.HashSet<>();
        if (!userIds.isEmpty()) {
            profilePictureRepository.findFilePathsByUserIds(userIds)
                    .forEach(row -> usersWithPicture.add((Long) row[0]));
        }

        return users.stream().map(user -> {
            UserSearchResponse response = new UserSearchResponse();
            response.setId(user.getId());
            response.setUsername(user.getUsername());
            response.setProfilePicture(
                usersWithPicture.contains(user.getId())
                    ? "/users/" + user.getId() + "/profile-picture"
                    : null
            );
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

        calculateBoardStats(response, targetUserId);
        calculateIndividualItemStats(response, targetUserId);
        calculateTeamItemStats(response, targetUserId);
        calculateTotalStats(response);
        calculateOverallProgress(response, targetUserId);
        calculateCategoryStats(response, targetUserId);
        applyPrivacyFilter(response, mode, isSelf, isConnected, targetUser);

        return response;
    }

    private void calculateBoardStats(UserProfileStatsResponse response, Long targetUserId) {
        long ownedTotalBoards = boardRepository.countByUserId(targetUserId);
        long ownedTeamBoardCount = boardRepository.countTeamBoardsByUserId(targetUserId);
        long memberTeamBoardCount = boardMemberRepository.countMemberTeamBoards(targetUserId);

        response.setTotalBoards((int) (ownedTotalBoards + memberTeamBoardCount));
        response.setTeamBoardCount((int) (ownedTeamBoardCount + memberTeamBoardCount));

        // Tum panolarin status dagilimi (sahip olunan panolar)
        Map<String, Integer> boardsByStatus = initStatusMap();
        for (BoardRepository.StatusCount row : boardRepository.countByStatusForUser(targetUserId)) {
            boardsByStatus.merge(row.getStatus(), row.getCount().intValue(), (a, b) -> a + b);
        }
        for (Object[] row : boardMemberRepository.countMemberTeamBoardsByStatus(targetUserId)) {
            boardsByStatus.merge((String) row[0], ((Long) row[1]).intValue(), (a, b) -> a + b);
        }
        response.setBoardsByStatus(boardsByStatus);

        // Bireysel panolarin status dagilimi
        Map<String, Integer> individualBoardsByStatus = initStatusMap();
        for (BoardRepository.StatusCount row : boardRepository.countIndividualByStatusForUser(targetUserId)) {
            individualBoardsByStatus.put(row.getStatus(), row.getCount().intValue());
        }
        response.setIndividualBoardsByStatus(individualBoardsByStatus);

        // Takim panolarinin status dagilimi (sahip olunan + uye olunan)
        Map<String, Integer> teamBoardsByStatus = initStatusMap();
        for (BoardRepository.StatusCount row : boardRepository.countTeamByStatusForUser(targetUserId)) {
            teamBoardsByStatus.merge(row.getStatus(), row.getCount().intValue(), (a, b) -> a + b);
        }
        for (Object[] row : boardMemberRepository.countMemberTeamBoardsByStatus(targetUserId)) {
            teamBoardsByStatus.merge((String) row[0], ((Long) row[1]).intValue(), (a, b) -> a + b);
        }
        response.setTeamBoardsByStatus(teamBoardsByStatus);
    }

    private void calculateIndividualItemStats(UserProfileStatsResponse response, Long targetUserId) {
        Object[] indListStats = extractStats(taskListRepository.countIndividualStatsForUser(targetUserId));
        response.setIndividualTotalLists(asInt(indListStats[0]));
        response.setIndividualCompletedLists(asInt(indListStats[1]));

        Object[] indTaskStats = extractStats(taskRepository.countIndividualStatsForUser(targetUserId));
        response.setIndividualTotalTasks(asInt(indTaskStats[0]));
        response.setIndividualCompletedTasks(asInt(indTaskStats[1]));

        Object[] indSubtaskStats = extractStats(subtaskRepository.countIndividualStatsForUser(targetUserId));
        response.setIndividualTotalSubtasks(asInt(indSubtaskStats[0]));
        response.setIndividualCompletedSubtasks(asInt(indSubtaskStats[1]));
    }

    private void calculateTeamItemStats(UserProfileStatsResponse response, Long targetUserId) {
        // Sahip olunan ekip panolari: tum ogeler sayilir
        Object[] ownedTeamListStats = extractStats(taskListRepository.countOwnedTeamListStatsForUser(targetUserId));
        Object[] ownedTeamTaskStats = extractStats(taskRepository.countOwnedTeamTaskStatsForUser(targetUserId));
        Object[] ownedTeamSubtaskStats = extractStats(subtaskRepository.countOwnedTeamSubtaskStatsForUser(targetUserId));

        // Uye olunan ekip panolari: sadece atanan ogeler sayilir
        Object[] memberListStats = extractStats(boardMemberAssignmentRepository.countAssignedListStatsForMember(targetUserId));
        Object[] memberTaskStats = extractStats(boardMemberAssignmentRepository.countAssignedTaskStatsForMember(targetUserId));
        Object[] memberSubtaskStats = extractStats(boardMemberAssignmentRepository.countAssignedSubtaskStatsForMember(targetUserId));

        response.setTeamTotalLists(asInt(ownedTeamListStats[0]) + asInt(memberListStats[0]));
        response.setTeamCompletedLists(asInt(ownedTeamListStats[1]) + asInt(memberListStats[1]));
        response.setTeamTotalTasks(asInt(ownedTeamTaskStats[0]) + asInt(memberTaskStats[0]));
        response.setTeamCompletedTasks(asInt(ownedTeamTaskStats[1]) + asInt(memberTaskStats[1]));
        response.setTeamTotalSubtasks(asInt(ownedTeamSubtaskStats[0]) + asInt(memberSubtaskStats[0]));
        response.setTeamCompletedSubtasks(asInt(ownedTeamSubtaskStats[1]) + asInt(memberSubtaskStats[1]));
    }

    private void calculateTotalStats(UserProfileStatsResponse response) {
        response.setTotalLists(response.getIndividualTotalLists() + response.getTeamTotalLists());
        response.setCompletedLists(response.getIndividualCompletedLists() + response.getTeamCompletedLists());
        response.setTotalTasks(response.getIndividualTotalTasks() + response.getTeamTotalTasks());
        response.setCompletedTasks(response.getIndividualCompletedTasks() + response.getTeamCompletedTasks());
        response.setTotalSubtasks(response.getIndividualTotalSubtasks() + response.getTeamTotalSubtasks());
        response.setCompletedSubtasks(response.getIndividualCompletedSubtasks() + response.getTeamCompletedSubtasks());
    }

    private void calculateOverallProgress(UserProfileStatsResponse response, Long targetUserId) {
        List<Object[]> taskSubtaskInfo = taskRepository.findTaskSubtaskInfoForUser(targetUserId);
        int leafTotal = 0;
        int leafCompleted = 0;
        int tasksWithSubtasks = 0;

        for (Object[] row : taskSubtaskInfo) {
            Boolean isCompleted = (Boolean) row[0];
            int subtaskCount = (Integer) row[1];

            if (subtaskCount > 0) {
                tasksWithSubtasks++;
            }
            leafTotal++;
            if (Boolean.TRUE.equals(isCompleted)) {
                leafCompleted++;
            }
        }

        // Sahip olunan panolardaki alt gorevleri ekle
        if (tasksWithSubtasks > 0) {
            leafTotal += response.getIndividualTotalSubtasks() + (response.getTeamTotalSubtasks() - response.getIndividualTotalSubtasks());
            leafCompleted += response.getIndividualCompletedSubtasks() + (response.getTeamCompletedSubtasks() - response.getIndividualCompletedSubtasks());
        }

        // Uye olunan panolardaki atanan gorev ve alt gorevleri de ekle
        Object[] memberTaskStats = extractStats(boardMemberAssignmentRepository.countAssignedTaskStatsForMember(targetUserId));
        Object[] memberSubtaskStats = extractStats(boardMemberAssignmentRepository.countAssignedSubtaskStatsForMember(targetUserId));
        leafTotal += asInt(memberTaskStats[0]) + asInt(memberSubtaskStats[0]);
        leafCompleted += asInt(memberTaskStats[1]) + asInt(memberSubtaskStats[1]);

        int overallProgress = leafTotal > 0 ? Math.round((float) leafCompleted / leafTotal * 100) : 0;
        response.setOverallProgress(overallProgress);
    }

    private void calculateCategoryStats(UserProfileStatsResponse response, Long targetUserId) {
        List<BoardRepository.CategoryCount> categoryData = boardRepository.countByCategoryForUser(targetUserId);
        List<UserProfileStatsResponse.CategoryStat> topCategories = new ArrayList<>();
        int limit = Math.min(categoryData.size(), 5);
        for (int i = 0; i < limit; i++) {
            BoardRepository.CategoryCount row = categoryData.get(i);
            String category = row.getCategory();
            int count = row.getCount().intValue();
            topCategories.add(new UserProfileStatsResponse.CategoryStat(category, count));
        }
        response.setTopCategories(topCategories);
    }

    private void applyPrivacyFilter(UserProfileStatsResponse response, PrivacyMode mode,
                                     boolean isSelf, boolean isConnected, User targetUser) {
        if (mode != PrivacyMode.PRIVATE || isSelf || isConnected) {
            return;
        }

        UserPrivacySettings settings = privacySettingsRepository.findByUserId(targetUser.getId())
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
            response.setIndividualTotalLists(0);
            response.setIndividualCompletedLists(0);
        }
        if (!Boolean.TRUE.equals(settings.getShowTaskStats())) {
            response.setTotalTasks(0);
            response.setCompletedTasks(0);
            response.setIndividualTotalTasks(0);
            response.setIndividualCompletedTasks(0);
        }
        if (!Boolean.TRUE.equals(settings.getShowSubtaskStats())) {
            response.setTotalSubtasks(0);
            response.setCompletedSubtasks(0);
            response.setIndividualTotalSubtasks(0);
            response.setIndividualCompletedSubtasks(0);
        }
        if (!Boolean.TRUE.equals(settings.getShowTeamBoardStats())) {
            response.setTeamBoardCount(0);
            response.setTeamBoardsByStatus(null);
            response.setTeamTotalLists(0);
            response.setTeamCompletedLists(0);
            response.setTeamTotalTasks(0);
            response.setTeamCompletedTasks(0);
            response.setTeamTotalSubtasks(0);
            response.setTeamCompletedSubtasks(0);
        }
        if (!Boolean.TRUE.equals(settings.getShowTopCategories())) {
            response.setTopCategories(List.of());
        }
    }

    // Yardimci: Status map'i baslatir
    private Map<String, Integer> initStatusMap() {
        Map<String, Integer> map = new LinkedHashMap<>();
        map.put("PLANLANDI", 0);
        map.put("DEVAM_EDIYOR", 0);
        map.put("TAMAMLANDI", 0);
        map.put("DURDURULDU", 0);
        map.put("BIRAKILDI", 0);
        return map;
    }

    // Yardimci: Sorgu sonucundan istatistik dizisi cikarir
    private Object[] extractStats(List<Object[]> result) {
        return result.isEmpty() ? new Object[]{0L, 0L} : result.get(0);
    }

    // Yardimci: Object'i int'e cevirir (null-safe)
    private int asInt(Object val) {
        return val != null ? ((Number) val).intValue() : 0;
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
        // Token bilgileri AuthResponse icinde donuluyor, UserResponse'da token alani yok.
        return response;
    }
}
