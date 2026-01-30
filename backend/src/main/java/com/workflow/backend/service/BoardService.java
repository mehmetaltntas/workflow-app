package com.workflow.backend.service;

import com.workflow.backend.dto.*;
import com.workflow.backend.entity.Board;
import com.workflow.backend.entity.BoardMember;
import com.workflow.backend.entity.BoardType;
import com.workflow.backend.entity.User;
import com.workflow.backend.exception.DuplicateResourceException;
import com.workflow.backend.exception.ResourceNotFoundException;
import com.workflow.backend.repository.BoardMemberRepository;
import com.workflow.backend.repository.BoardRepository;
import com.workflow.backend.repository.UserProfilePictureRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.CacheManager;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BoardService {

    private static final Logger logger = LoggerFactory.getLogger(BoardService.class);

    private final BoardRepository boardRepository;
    private final BoardMemberRepository boardMemberRepository;
    private final UserProfilePictureRepository profilePictureRepository;
    private final CurrentUserService currentUserService;
    private final AuthorizationService authorizationService;
    private final LabelService labelService;
    private final ConnectionService connectionService;
    private final CacheManager cacheManager;

    // PANO OLUŞTURMA
    @Transactional
    public BoardResponse createBoard(CreateBoardRequest request) {
        // 1. Mevcut kullanıcıyı JWT'den al (request.getUserId() yerine)
        User user = currentUserService.getCurrentUser();

        if (boardRepository.existsByNameAndUser(request.getName(), user)) {
            throw new DuplicateResourceException("Pano", "name", request.getName());
        }

        // 2. Pano Entity'sini oluştur
        Board board = new Board();
        board.setName(request.getName());
        if (request.getStatus() != null && !request.getStatus().isEmpty()) {
            board.setStatus(request.getStatus());
        }
        board.setLink(request.getLink());
        board.setDescription(request.getDescription());
        board.setDeadline(request.getDeadline());
        board.setCategory(request.getCategory());
        if (request.getBoardType() != null) {
            board.setBoardType(BoardType.valueOf(request.getBoardType()));
        }

        // 3. SLUG OLUŞTURMA (YENİ)
        String slug = generateSlug(request.getName());
        board.setSlug(slug);

        // 4. İLİŞKİYİ KUR (Kritik Nokta)
        board.setUser(user); // "Bu panonun sahibi bu kullanıcıdır" dedik.

        // 4. Kaydet (race condition koruması: slug çakışırsa rastgele suffix ile tekrar dene)
        Board savedBoard = null;
        int maxRetries = 3;
        DataIntegrityViolationException lastException = null;
        for (int attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                savedBoard = boardRepository.save(board);
                lastException = null;
                break;
            } catch (DataIntegrityViolationException e) {
                lastException = e;
                if (attempt < maxRetries) {
                    String retrySlug = slug + "-" + UUID.randomUUID().toString().substring(0, 6);
                    board.setSlug(retrySlug);
                } else {
                    throw new DuplicateResourceException("Pano oluşturulamadı, lütfen tekrar deneyin.");
                }
            }
        }
        if (lastException != null) {
            throw new DuplicateResourceException("Pano oluşturulamadı, lütfen tekrar deneyin.");
        }

        // 5. Varsayılan etiketleri oluştur (Kolay, Orta, Zor)
        labelService.createDefaultLabelsForBoard(savedBoard);

        evictProfileStatsCache(user.getUsername());

        // 6. Response'a çevir
        return mapToResponse(savedBoard);
    }

    // KULLANICININ PANOLARINI GETİR (Pagination destekli)
    @Transactional
    public PaginatedResponse<BoardResponse> getAllBoards(Long userId, Pageable pageable) {
        // Kullanıcı sadece kendi panolarına erişebilir
        authorizationService.verifyUserOwnership(userId);

        // Repository'de yazdığımız pagination destekli metodu kullanıyoruz
        Page<Board> boardPage = boardRepository.findByUserId(userId, pageable);

        // Page<Board> -> PaginatedResponse<BoardResponse> dönüşümü
        List<BoardResponse> content = boardPage.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return new PaginatedResponse<>(
                content,
                boardPage.getNumber(),
                boardPage.getSize(),
                boardPage.getTotalElements(),
                boardPage.getTotalPages(),
                boardPage.isFirst(),
                boardPage.isLast()
        );
    }

    // YENİ METOT: Tek bir panonun tüm detaylarını getir
    // N+1 QUERY OPTİMİZASYONU: @BatchSize sayesinde 50+ sorgu yerine ~5-6 sorguya düştü
    @Transactional
    public BoardResponse getBoardDetails(String slug) {
        logger.debug("getBoardDetails called for slug: {}", slug);

        // Query 1: Board + User (tek sorgu, diğer ilişkiler @BatchSize ile yüklenir)
        Board board = boardRepository.findBySlugWithUser(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Pano", "slug", slug));

        // Pano sahibi VEYA kabul edilmiş üye erişebilir
        Long currentUserId = currentUserService.getCurrentUserId();
        boolean isOwner = board.getUser().getId().equals(currentUserId);
        boolean isMember = !isOwner && boardMemberRepository.existsAcceptedByBoardIdAndUserId(board.getId(), currentUserId);

        if (!isOwner && !isMember) {
            authorizationService.verifyBoardOwnership(board.getId()); // Bu exception fırlatır
        }

        logger.debug("Board fetched, @BatchSize will handle lazy collections efficiently");

        // DTO'ya dönüştür (@BatchSize sayesinde N+1 yerine batch sorgular çalışır)
        return mapToResponseWithDetails(board, isOwner, currentUserId);
    }

    // Entity -> DTO Çevirici (Detay sayfası için - @BatchSize ile optimize edilmiş)
    // @BatchSize sayesinde lazy koleksiyonlar batch halinde yüklenir (N+1 yerine ~5-6 sorgu)
    private BoardResponse mapToResponseWithDetails(Board board, boolean isOwner, Long currentUserId) {
        BoardResponse response = new BoardResponse();
        response.setId(board.getId());
        response.setVersion(board.getVersion());
        response.setName(board.getName());
        response.setSlug(board.getSlug());
        response.setStatus(board.getStatus() != null ? board.getStatus() : "PLANLANDI");
        response.setLink(board.getLink());
        response.setDescription(board.getDescription());
        response.setCategory(board.getCategory());
        response.setDeadline(board.getDeadline());
        response.setCreatedAt(board.getCreatedAt());
        response.setOwnerName(board.getUser().getUsername()); // User zaten JOIN FETCH ile yüklendi
        response.setOwnerFirstName(board.getUser().getFirstName());
        response.setOwnerLastName(board.getUser().getLastName());
        response.setBoardType(board.getBoardType() != null ? board.getBoardType().name() : "INDIVIDUAL");
        response.setIsOwner(isOwner);
        response.setCurrentUserId(currentUserId);

        // Mevcut kullanıcının moderatör olup olmadığını kontrol et
        if (!isOwner) {
            response.setIsModerator(boardMemberRepository.isModeratorOnBoard(board.getId(), currentUserId));
        } else {
            response.setIsModerator(false);
        }

        response.setMembers(mapMembers(board.getId(), isOwner, currentUserId));
        response.setLabels(mapLabels(board.getLabels()));
        response.setTaskLists(mapTaskLists(board.getTaskLists()));

        return response;
    }

    private List<BoardMemberDto> mapMembers(Long boardId, boolean isOwner, Long currentUserId) {
        List<BoardMember> boardMembers = boardMemberRepository.findAcceptedByBoardIdWithUser(boardId);
        if (boardMembers == null || boardMembers.isEmpty()) {
            return Collections.emptyList();
        }

        // Üye ise, hangi üyelerle bağlantısı olduğunu toplu sorgu ile bul
        Set<Long> connectedUserIds = null;
        if (!isOwner) {
            List<Long> memberUserIds = boardMembers.stream()
                    .map(m -> m.getUser().getId())
                    .filter(id -> !id.equals(currentUserId))
                    .collect(Collectors.toList());
            connectedUserIds = connectionService.getConnectedUserIds(currentUserId, memberUserIds);
        }

        // Batch: tüm üyelerin profil fotoğraflarını tek sorguda kontrol et
        List<Long> allMemberUserIds = boardMembers.stream()
                .map(m -> m.getUser().getId()).toList();
        Set<Long> membersWithPicture = new java.util.HashSet<>();
        if (!allMemberUserIds.isEmpty()) {
            profilePictureRepository.findFilePathsByUserIds(allMemberUserIds)
                    .forEach(row -> membersWithPicture.add((Long) row[0]));
        }

        final Set<Long> finalConnectedUserIds = connectedUserIds;
        return boardMembers.stream().map(member -> {
            BoardMemberDto memberDto = new BoardMemberDto();
            memberDto.setId(member.getId());
            memberDto.setUsername(member.getUser().getUsername());
            memberDto.setRole(member.getRole() != null ? member.getRole().name() : "MEMBER");
            memberDto.setCreatedAt(member.getCreatedAt());

            Long memberUserId = member.getUser().getId();
            boolean showProfile = isOwner
                    || memberUserId.equals(currentUserId)
                    || (finalConnectedUserIds != null && finalConnectedUserIds.contains(memberUserId));

            if (showProfile) {
                memberDto.setUserId(memberUserId);
                memberDto.setFirstName(member.getUser().getFirstName());
                memberDto.setLastName(member.getUser().getLastName());
                memberDto.setProfilePicture(
                        membersWithPicture.contains(memberUserId)
                                ? "/users/" + memberUserId + "/profile-picture" : null);
            }

            if (member.getAssignments() != null && !member.getAssignments().isEmpty()) {
                memberDto.setAssignments(member.getAssignments().stream().map(assignment -> {
                    BoardMemberAssignmentDto aDto = new BoardMemberAssignmentDto();
                    aDto.setId(assignment.getId());
                    aDto.setTargetType(assignment.getTargetType().name());
                    aDto.setTargetId(assignment.getTargetId());
                    aDto.setCreatedAt(assignment.getCreatedAt());
                    return aDto;
                }).collect(Collectors.toList()));
            }
            return memberDto;
        }).collect(Collectors.toList());
    }

    private LabelDto mapLabel(com.workflow.backend.entity.Label label) {
        LabelDto labelDto = new LabelDto();
        labelDto.setId(label.getId());
        labelDto.setName(label.getName());
        labelDto.setColor(label.getColor());
        labelDto.setIsDefault(label.getIsDefault());
        return labelDto;
    }

    private List<LabelDto> mapLabels(java.util.Collection<com.workflow.backend.entity.Label> labels) {
        if (labels == null || labels.isEmpty()) {
            return null;
        }
        return labels.stream().map(this::mapLabel).collect(Collectors.toList());
    }

    private List<TaskListDto> mapTaskLists(java.util.Collection<com.workflow.backend.entity.TaskList> taskLists) {
        if (taskLists == null) {
            return null;
        }
        return taskLists.stream().map(taskList -> {
            TaskListDto listDto = new TaskListDto();
            listDto.setId(taskList.getId());
            listDto.setVersion(taskList.getVersion());
            listDto.setName(taskList.getName());
            listDto.setDescription(taskList.getDescription());
            listDto.setLink(taskList.getLink());
            listDto.setIsCompleted(taskList.getIsCompleted());
            listDto.setDueDate(taskList.getDueDate());
            listDto.setPriority(taskList.getPriority() != null ? taskList.getPriority().name() : null);
            listDto.setCreatedAt(taskList.getCreatedAt());
            listDto.setLabels(mapLabels(taskList.getLabels()));
            listDto.setTasks(mapTasks(taskList.getTasks()));
            return listDto;
        }).collect(Collectors.toList());
    }

    private List<TaskDto> mapTasks(java.util.Collection<com.workflow.backend.entity.Task> tasks) {
        if (tasks == null) {
            return null;
        }
        return tasks.stream().map(task -> {
            TaskDto taskDto = new TaskDto();
            taskDto.setId(task.getId());
            taskDto.setVersion(task.getVersion());
            taskDto.setTitle(task.getTitle());
            taskDto.setDescription(task.getDescription());
            taskDto.setPosition(task.getPosition());
            taskDto.setLink(task.getLink());
            taskDto.setIsCompleted(task.getIsCompleted());
            taskDto.setCreatedAt(task.getCreatedAt());
            taskDto.setDueDate(task.getDueDate());
            taskDto.setPriority(task.getPriority());
            taskDto.setLabels(mapLabels(task.getLabels()));
            taskDto.setSubtasks(mapSubtasks(task.getSubtasks()));
            return taskDto;
        }).collect(Collectors.toList());
    }

    private List<SubtaskDto> mapSubtasks(java.util.Collection<com.workflow.backend.entity.Subtask> subtasks) {
        if (subtasks == null || subtasks.isEmpty()) {
            return null;
        }
        return subtasks.stream().map(subtask -> {
            SubtaskDto subtaskDto = new SubtaskDto();
            subtaskDto.setId(subtask.getId());
            subtaskDto.setVersion(subtask.getVersion());
            subtaskDto.setTitle(subtask.getTitle());
            subtaskDto.setIsCompleted(subtask.getIsCompleted());
            subtaskDto.setPosition(subtask.getPosition());
            subtaskDto.setDescription(subtask.getDescription());
            subtaskDto.setLink(subtask.getLink());
            subtaskDto.setCreatedAt(subtask.getCreatedAt());
            return subtaskDto;
        }).collect(Collectors.toList());
    }

    // Entity -> DTO Çevirici (Liste sayfası için - nested entity'ler yok, N+1 sorgu yok)
    private BoardResponse mapToResponse(Board board) {
        if (board.getSlug() == null) {
            logger.warn("Board without slug found: id={}, name={}", board.getId(), board.getName());
        }

        BoardResponse response = new BoardResponse();
        response.setId(board.getId());
        response.setVersion(board.getVersion());
        response.setName(board.getName());
        response.setSlug(board.getSlug());
        response.setStatus(board.getStatus() != null ? board.getStatus() : "PLANLANDI");
        response.setLink(board.getLink());
        response.setDescription(board.getDescription());
        response.setCategory(board.getCategory());
        response.setDeadline(board.getDeadline());
        response.setCreatedAt(board.getCreatedAt());
        response.setOwnerName(board.getUser().getUsername()); // User zaten EntityGraph ile fetch edildi
        response.setOwnerFirstName(board.getUser().getFirstName());
        response.setOwnerLastName(board.getUser().getLastName());
        response.setBoardType(board.getBoardType() != null ? board.getBoardType().name() : "INDIVIDUAL");

        // NOT: Liste sayfası için taskLists, tasks, labels yüklenmez (performans)
        // Detay sayfası için getBoardDetails() ve mapToResponseOptimized() kullanılır

        return response;
    }

    // Kullanıcının sorumlu olarak atandığı panoları getir
    @Transactional
    public List<BoardResponse> getAssignedBoards() {
        Long currentUserId = currentUserService.getCurrentUserId();
        List<Board> boards = boardMemberRepository.findAcceptedBoardsByUserId(currentUserId);
        return boards.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    // Kullanıcının kendi oluşturduğu TEAM tipindeki panoları getir
    @Transactional
    public List<BoardResponse> getMyTeamBoards() {
        Long currentUserId = currentUserService.getCurrentUserId();
        List<Board> boards = boardRepository.findTeamBoardsByUserId(currentUserId);
        return boards.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    // PANO SİL
    @Transactional
    public void deleteBoard(Long boardId) {
        // Kullanıcı sadece kendi panosunu silebilir
        authorizationService.verifyBoardOwnership(boardId);

        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new ResourceNotFoundException("Pano", "id", boardId));
        String username = board.getUser().getUsername();

        boardRepository.deleteById(boardId);

        evictProfileStatsCache(username);
    }

    // PANO ADI GÜNCELLE
    // PANO GÜNCELLE
    @Transactional
    public BoardResponse updateBoard(Long boardId, UpdateBoardRequest request) {
        // Kullanıcı sadece kendi panosunu güncelleyebilir
        authorizationService.verifyBoardOwnership(boardId);

        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new ResourceNotFoundException("Pano", "id", boardId));

        if (request.getName() != null && !board.getName().equals(request.getName())) {
            if (boardRepository.existsByNameAndUser(request.getName(), board.getUser())) {
                throw new DuplicateResourceException("Pano", "name", request.getName());
            }
            board.setName(request.getName());
            // Ad değişirse slug da değişmeli mi? Genelde değişmez ama burada sabit
            // kalabilir veya değişebilir.
            // Şimdilik slug sabit kalsın.
        }

        if (request.getStatus() != null)
            board.setStatus(request.getStatus());
        if (request.getLink() != null)
            board.setLink(request.getLink());
        if (request.getDescription() != null)
            board.setDescription(request.getDescription());
        if (request.getDeadline() != null)
            board.setDeadline(request.getDeadline());
        if (request.getCategory() != null)
            board.setCategory(request.getCategory());
        if (request.getBoardType() != null) {
            board.setBoardType(BoardType.valueOf(request.getBoardType()));
        }

        Board savedBoard = boardRepository.save(board);

        evictProfileStatsCache(board.getUser().getUsername());

        return mapToResponse(savedBoard);
    }

    // PANO STATÜ GÜNCELLE
    @Transactional
    public BoardResponse updateBoardStatus(Long boardId, String newStatus) {
        // Kullanıcı sadece kendi panosunun statüsünü güncelleyebilir
        authorizationService.verifyBoardOwnership(boardId);

        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new ResourceNotFoundException("Pano", "id", boardId));
        board.setStatus(newStatus);
        Board savedBoard = boardRepository.save(board);

        evictProfileStatsCache(board.getUser().getUsername());

        return mapToResponse(savedBoard);
    }

    private void evictProfileStatsCache(String username) {
        var cache = cacheManager.getCache("profileStats");
        if (cache != null && username != null) {
            cache.evict(username.toLowerCase(Locale.ROOT));
        }
    }

    // YENİ: Slug üretici yardımcı metot
    private String generateSlug(String name) {
        // 1. Türkçe karakterleri ve boşlukları düzelt
        String slug = toKebabCase(name);

        // 2. Eğer bu slug zaten varsa sonuna sayaç ekle (örn: yeni-proje-1)
        String originalSlug = slug;
        int counter = 1;

        while (boardRepository.existsBySlug(slug)) {
            slug = originalSlug + "-" + counter;
            counter++;
        }

        return slug;
    }

    private String toKebabCase(String input) {
        if (input == null)
            return "";

        String result = input
                .replace("Ğ", "g")
                .replace("Ü", "u")
                .replace("Ş", "s")
                .replace("İ", "i")
                .replace("Ö", "o")
                .replace("Ç", "c")
                .toLowerCase(Locale.forLanguageTag("tr"))
                .replace("ğ", "g")
                .replace("ü", "u")
                .replace("ş", "s")
                .replace("ı", "i")
                .replace("ö", "o")
                .replace("ç", "c")
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-");

        return result;
    }
}
