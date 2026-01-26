package com.workflow.backend.service;

import com.workflow.backend.dto.BoardResponse;
import com.workflow.backend.dto.CreateBoardRequest;
import com.workflow.backend.dto.LabelDto;
import com.workflow.backend.dto.PaginatedResponse;
import com.workflow.backend.dto.SubtaskDto;
import com.workflow.backend.dto.TaskDto;
import com.workflow.backend.dto.TaskListDto;
import com.workflow.backend.entity.Board;
import com.workflow.backend.entity.User;
import com.workflow.backend.exception.DuplicateResourceException;
import com.workflow.backend.exception.ResourceNotFoundException;
import com.workflow.backend.repository.BoardRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BoardService {

    private static final Logger logger = LoggerFactory.getLogger(BoardService.class);

    private final BoardRepository boardRepository;
    private final CurrentUserService currentUserService;
    private final AuthorizationService authorizationService;
    private final LabelService labelService;

    // PANO OLUŞTURMA
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

        // 3. SLUG OLUŞTURMA (YENİ)
        String slug = generateSlug(request.getName());
        board.setSlug(slug);

        // 4. İLİŞKİYİ KUR (Kritik Nokta)
        board.setUser(user); // "Bu panonun sahibi bu kullanıcıdır" dedik.

        // 4. Kaydet
        Board savedBoard = boardRepository.save(board);

        // 5. Varsayılan etiketleri oluştur (Kolay, Orta, Zor)
        labelService.createDefaultLabelsForBoard(savedBoard);

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

        // Kullanıcı sadece kendi panosuna erişebilir
        authorizationService.verifyBoardOwnership(board.getId());

        logger.debug("Board fetched, @BatchSize will handle lazy collections efficiently");

        // DTO'ya dönüştür (@BatchSize sayesinde N+1 yerine batch sorgular çalışır)
        return mapToResponseWithDetails(board);
    }

    // Entity -> DTO Çevirici (Detay sayfası için - @BatchSize ile optimize edilmiş)
    // @BatchSize sayesinde lazy koleksiyonlar batch halinde yüklenir (N+1 yerine ~5-6 sorgu)
    private BoardResponse mapToResponseWithDetails(Board board) {
        BoardResponse response = new BoardResponse();
        response.setId(board.getId());
        response.setName(board.getName());
        response.setSlug(board.getSlug());
        response.setStatus(board.getStatus() != null ? board.getStatus() : "PLANLANDI");
        response.setLink(board.getLink());
        response.setDescription(board.getDescription());
        response.setCategory(board.getCategory());
        response.setDeadline(board.getDeadline());
        response.setOwnerName(board.getUser().getUsername()); // User zaten JOIN FETCH ile yüklendi

        // Board Labels (@BatchSize ile batch yüklenir)
        if (board.getLabels() != null && !board.getLabels().isEmpty()) {
            List<LabelDto> labelDtos = board.getLabels().stream().map(label -> {
                LabelDto labelDto = new LabelDto();
                labelDto.setId(label.getId());
                labelDto.setName(label.getName());
                labelDto.setColor(label.getColor());
                labelDto.setIsDefault(label.getIsDefault());
                return labelDto;
            }).collect(Collectors.toList());
            response.setLabels(labelDtos);
        }

        // TaskLists (@BatchSize ile batch yüklenir)
        if (board.getTaskLists() != null) {
            List<TaskListDto> listDtos = board.getTaskLists().stream().map(taskList -> {
                TaskListDto listDto = new TaskListDto();
                listDto.setId(taskList.getId());
                listDto.setName(taskList.getName());
                listDto.setDescription(taskList.getDescription());
                listDto.setLink(taskList.getLink());
                listDto.setIsCompleted(taskList.getIsCompleted());
                listDto.setDueDate(taskList.getDueDate());
                listDto.setPriority(taskList.getPriority() != null ? taskList.getPriority().name() : null);

                // Oluşturulma tarihi
                listDto.setCreatedAt(taskList.getCreatedAt());

                // TaskList Labels (@BatchSize ile batch yüklenir)
                if (taskList.getLabels() != null && !taskList.getLabels().isEmpty()) {
                    List<LabelDto> listLabelDtos = taskList.getLabels().stream().map(label -> {
                        LabelDto labelDto = new LabelDto();
                        labelDto.setId(label.getId());
                        labelDto.setName(label.getName());
                        labelDto.setColor(label.getColor());
                        labelDto.setIsDefault(label.getIsDefault());
                        return labelDto;
                    }).collect(Collectors.toList());
                    listDto.setLabels(listLabelDtos);
                }

                // Tasks (@BatchSize ile batch yüklenir)
                if (taskList.getTasks() != null) {
                    List<TaskDto> taskDtos = taskList.getTasks().stream().map(task -> {
                        TaskDto taskDto = new TaskDto();
                        taskDto.setId(task.getId());
                        taskDto.setTitle(task.getTitle());
                        taskDto.setDescription(task.getDescription());
                        taskDto.setPosition(task.getPosition());
                        taskDto.setLink(task.getLink());
                        taskDto.setIsCompleted(task.getIsCompleted());
                        taskDto.setCreatedAt(task.getCreatedAt());
                        taskDto.setDueDate(task.getDueDate());
                        taskDto.setPriority(task.getPriority());

                        // Task Labels (@BatchSize ile batch yüklenir)
                        if (task.getLabels() != null && !task.getLabels().isEmpty()) {
                            taskDto.setLabels(task.getLabels().stream().map(label -> {
                                LabelDto labelDto = new LabelDto();
                                labelDto.setId(label.getId());
                                labelDto.setName(label.getName());
                                labelDto.setColor(label.getColor());
                                labelDto.setIsDefault(label.getIsDefault());
                                return labelDto;
                            }).collect(Collectors.toList()));
                        }

                        // Subtasks (@BatchSize ile batch yüklenir)
                        if (task.getSubtasks() != null && !task.getSubtasks().isEmpty()) {
                            taskDto.setSubtasks(task.getSubtasks().stream().map(subtask -> {
                                SubtaskDto subtaskDto = new SubtaskDto();
                                subtaskDto.setId(subtask.getId());
                                subtaskDto.setTitle(subtask.getTitle());
                                subtaskDto.setIsCompleted(subtask.getIsCompleted());
                                subtaskDto.setPosition(subtask.getPosition());
                                subtaskDto.setDescription(subtask.getDescription());
                                subtaskDto.setLink(subtask.getLink());
                                return subtaskDto;
                            }).collect(Collectors.toList()));
                        }

                        return taskDto;
                    }).collect(Collectors.toList());

                    listDto.setTasks(taskDtos);
                }

                return listDto;
            }).collect(Collectors.toList());

            response.setTaskLists(listDtos);
        }

        return response;
    }

    // Entity -> DTO Çevirici (Liste sayfası için - nested entity'ler yok, N+1 sorgu yok)
    private BoardResponse mapToResponse(Board board) {
        // Legacy Data Fix: Slug yoksa oluştur ve kaydet
        if (board.getSlug() == null) {
            board.setSlug(generateSlug(board.getName()));
            boardRepository.save(board);
        }

        BoardResponse response = new BoardResponse();
        response.setId(board.getId());
        response.setName(board.getName());
        response.setSlug(board.getSlug());
        response.setStatus(board.getStatus() != null ? board.getStatus() : "PLANLANDI");
        response.setLink(board.getLink());
        response.setDescription(board.getDescription());
        response.setCategory(board.getCategory());
        response.setDeadline(board.getDeadline());
        response.setOwnerName(board.getUser().getUsername()); // User zaten EntityGraph ile fetch edildi

        // NOT: Liste sayfası için taskLists, tasks, labels yüklenmez (performans)
        // Detay sayfası için getBoardDetails() ve mapToResponseOptimized() kullanılır

        return response;
    }

    // PANO SİL
    public void deleteBoard(Long boardId) {
        // Kullanıcı sadece kendi panosunu silebilir
        authorizationService.verifyBoardOwnership(boardId);
        boardRepository.deleteById(boardId);
    }

    // PANO ADI GÜNCELLE
    // PANO GÜNCELLE
    @Transactional
    public BoardResponse updateBoard(Long boardId, CreateBoardRequest request) {
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

        Board savedBoard = boardRepository.save(board);
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
        return mapToResponse(savedBoard);
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

        String result = input.toLowerCase()
                .replace("ğ", "g")
                .replace("ü", "u")
                .replace("ş", "s")
                .replace("ı", "i")
                .replace("ö", "o")
                .replace("ç", "c")
                .replaceAll("[^a-z0-9\\s-]", "") // Harf, sayı, boşluk ve tire dışındakileri sil
                .replaceAll("\\s+", "-"); // Boşlukları tire yap

        return result;
    }
}
