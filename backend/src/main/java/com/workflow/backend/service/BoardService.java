package com.workflow.backend.service;

import com.workflow.backend.dto.BoardResponse;
import com.workflow.backend.dto.CreateBoardRequest;
import com.workflow.backend.dto.LabelDto;
import com.workflow.backend.dto.SubtaskDto;
import com.workflow.backend.dto.TaskDto;
import com.workflow.backend.dto.TaskListDto;
import com.workflow.backend.entity.Board;
import com.workflow.backend.entity.User;
import com.workflow.backend.repository.BoardRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BoardService {

    private final BoardRepository boardRepository;
    private final CurrentUserService currentUserService;
    private final AuthorizationService authorizationService;

    // PANO OLUŞTURMA
    public BoardResponse createBoard(CreateBoardRequest request) {
        // 1. Mevcut kullanıcıyı JWT'den al (request.getUserId() yerine)
        User user = currentUserService.getCurrentUser();

        if (boardRepository.existsByNameAndUser(request.getName(), user)) {
            throw new RuntimeException("Bu isimde bir pano zaten var!");
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

        // 3. SLUG OLUŞTURMA (YENİ)
        String slug = generateSlug(request.getName());
        board.setSlug(slug);

        // 4. İLİŞKİYİ KUR (Kritik Nokta)
        board.setUser(user); // "Bu panonun sahibi bu kullanıcıdır" dedik.

        // 4. Kaydet
        Board savedBoard = boardRepository.save(board);

        // 5. Response'a çevir
        return mapToResponse(savedBoard);
    }

    // KULLANICININ PANOLARINI GETİR
    @Transactional
    public List<BoardResponse> getAllBoards(Long userId) {
        // Kullanıcı sadece kendi panolarına erişebilir
        authorizationService.verifyUserOwnership(userId);

        // Repository'de yazdığımız özel metodu kullanıyoruz
        List<Board> boards = boardRepository.findByUserId(userId);

        // List<Board> -> List<BoardResponse> dönüşümü (Java 8 Stream API)
        return boards.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // ... BoardService içindeyiz ...

    // YENİ METOT: Tek bir panonun tüm detaylarını getir
    @Transactional // ÖNEMLİ: Lazy yüklenen listeleri hata almadan çekmek için işlem bitene kadar
                   // bağlantıyı tut.
    public BoardResponse getBoardDetails(String slug) {
        Board board = boardRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("Pano bulunamadı!"));

        // Kullanıcı sadece kendi panosuna erişebilir
        authorizationService.verifyBoardOwnership(board.getId());

        return mapToResponse(board);
    }

    // Entity -> DTO Çevirici (GÜNCELLENDİ)
    private BoardResponse mapToResponse(Board board) {
        // Legacy Data Fix: Slug yoksa oluştur ve kaydet
        if (board.getSlug() == null) {
            board.setSlug(generateSlug(board.getName()));
            boardRepository.save(board);
        }

        BoardResponse response = new BoardResponse();
        response.setId(board.getId());
        response.setName(board.getName());
        response.setSlug(board.getSlug()); // YENİ
        response.setStatus(board.getStatus() != null ? board.getStatus() : "PLANLANDI");
        response.setLink(board.getLink());
        response.setDescription(board.getDescription());
        response.setDeadline(board.getDeadline());
        response.setOwnerName(board.getUser().getUsername());

        // 1. Panodaki Listeleri Çek ve DTO'ya çevir
        if (board.getTaskLists() != null) {
            List<TaskListDto> listDtos = board.getTaskLists().stream().map(taskList -> {

                TaskListDto listDto = new TaskListDto();
                listDto.setId(taskList.getId());
                listDto.setName(taskList.getName());
                listDto.setLink(taskList.getLink());

                // 2. Listenin içindeki Görevleri Çek ve DTO'ya çevir
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

                        // Görevin etiketlerini ekle
                        if (task.getLabels() != null && !task.getLabels().isEmpty()) {
                            taskDto.setLabels(task.getLabels().stream().map(label -> {
                                LabelDto labelDto = new LabelDto();
                                labelDto.setId(label.getId());
                                labelDto.setName(label.getName());
                                labelDto.setColor(label.getColor());
                                return labelDto;
                            }).collect(Collectors.toList()));
                        }

                        // Alt görevleri ekle
                        if (task.getSubtasks() != null && !task.getSubtasks().isEmpty()) {
                            taskDto.setSubtasks(task.getSubtasks().stream().map(subtask -> {
                                SubtaskDto subtaskDto = new SubtaskDto();
                                subtaskDto.setId(subtask.getId());
                                subtaskDto.setTitle(subtask.getTitle());
                                subtaskDto.setIsCompleted(subtask.getIsCompleted());
                                subtaskDto.setPosition(subtask.getPosition());
                                return subtaskDto;
                            }).collect(Collectors.toList()));
                        }

                        return taskDto;
                    }).collect(Collectors.toList());

                    listDto.setTasks(taskDtos); // Görevleri listeye koy
                }

                return listDto;
            }).collect(Collectors.toList());

            response.setTaskLists(listDtos); // Listeleri panoya koy
        }

        // Pano etiketlerini ekle
        if (board.getLabels() != null && !board.getLabels().isEmpty()) {
            List<LabelDto> labelDtos = board.getLabels().stream().map(label -> {
                LabelDto labelDto = new LabelDto();
                labelDto.setId(label.getId());
                labelDto.setName(label.getName());
                labelDto.setColor(label.getColor());
                return labelDto;
            }).collect(Collectors.toList());
            response.setLabels(labelDtos);
        }

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
    public BoardResponse updateBoard(Long boardId, CreateBoardRequest request) {
        // Kullanıcı sadece kendi panosunu güncelleyebilir
        authorizationService.verifyBoardOwnership(boardId);

        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new RuntimeException("Pano bulunamadı"));

        if (request.getName() != null && !board.getName().equals(request.getName())) {
            if (boardRepository.existsByNameAndUser(request.getName(), board.getUser())) {
                throw new RuntimeException("Bu isimde bir pano zaten var!");
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

        Board savedBoard = boardRepository.save(board);
        return mapToResponse(savedBoard);
    }

    // PANO STATÜ GÜNCELLE
    public BoardResponse updateBoardStatus(Long boardId, String newStatus) {
        // Kullanıcı sadece kendi panosunun statüsünü güncelleyebilir
        authorizationService.verifyBoardOwnership(boardId);

        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new RuntimeException("Pano bulunamadı"));
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