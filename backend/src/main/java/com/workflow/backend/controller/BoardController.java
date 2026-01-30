package com.workflow.backend.controller;

import com.workflow.backend.dto.BoardResponse;
import com.workflow.backend.dto.CreateBoardRequest;
import com.workflow.backend.dto.LabelDto;
import com.workflow.backend.dto.UpdateBoardRequest;
import com.workflow.backend.dto.UpdateBoardStatusRequest;
import com.workflow.backend.entity.Board;
import com.workflow.backend.hateoas.assembler.BoardModelAssembler;
import com.workflow.backend.hateoas.assembler.LabelModelAssembler;
import com.workflow.backend.hateoas.model.BoardModel;
import com.workflow.backend.hateoas.model.LabelModel;
import com.workflow.backend.service.BoardService;
import com.workflow.backend.service.LabelService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.hateoas.CollectionModel;
import org.springframework.hateoas.PagedModel;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.*;

@RestController
@RequestMapping("/boards")
@RequiredArgsConstructor
@Tag(name = "Boards", description = "Pano (board) işlemleri")
@SecurityRequirement(name = "bearerAuth")
public class BoardController {

    private static final Logger logger = LoggerFactory.getLogger(BoardController.class);

    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of(
            "id", "name", "status", "createdAt", "deadline", "category", "slug"
    );
    private static final String DEFAULT_SORT_FIELD = "createdAt";
    private static final int MAX_PAGE_SIZE = 50;

    private final BoardService boardService;
    private final BoardModelAssembler boardAssembler;
    private final LabelService labelService;
    private final LabelModelAssembler labelAssembler;

    @Operation(summary = "Yeni pano oluştur", description = "Giriş yapmış kullanıcı için yeni bir pano oluşturur")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Pano oluşturuldu",
                    content = @Content(schema = @Schema(implementation = BoardModel.class))),
            @ApiResponse(responseCode = "400", description = "Geçersiz istek veya bu isimde pano zaten var"),
            @ApiResponse(responseCode = "401", description = "Kimlik doğrulama gerekli")
    })
    @PostMapping
    public ResponseEntity<BoardModel> createBoard(@Valid @RequestBody CreateBoardRequest request) {
        BoardResponse result = boardService.createBoard(request);
        BoardModel model = boardAssembler.toModel(result);
        return ResponseEntity.status(HttpStatus.CREATED).body(model);
    }

    @Operation(summary = "Kullanıcının panolarını getir", description = "Belirtilen kullanıcının panolarını sayfalanmış olarak getirir")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Panolar başarıyla getirildi"),
            @ApiResponse(responseCode = "401", description = "Kimlik doğrulama gerekli"),
            @ApiResponse(responseCode = "403", description = "Bu kullanıcının panolarına erişim yetkiniz yok")
    })
    @GetMapping("/user/{userId}")
    public ResponseEntity<PagedModel<BoardModel>> getUserBoards(
            @Parameter(description = "Kullanıcı ID") @PathVariable Long userId,
            @Parameter(description = "Sayfa numarası (0'dan başlar)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Sayfa başına kayıt sayısı") @RequestParam(defaultValue = "10") int size,
            @Parameter(description = "Sıralama alanı") @RequestParam(defaultValue = "id") String sortBy,
            @Parameter(description = "Sıralama yönü (asc/desc)") @RequestParam(defaultValue = "desc") String sortDir,
            @Parameter(description = "Durum filtresi") @RequestParam(required = false) String status,
            @Parameter(description = "Kategori filtresi") @RequestParam(required = false) String category,
            @Parameter(description = "Pano tipi filtresi") @RequestParam(required = false) String boardType) {
        // Güvenlik: sortBy alanını whitelist ile doğrula
        String safeSortBy = ALLOWED_SORT_FIELDS.contains(sortBy) ? sortBy : DEFAULT_SORT_FIELD;
        // Güvenlik: size üst sınırını uygula (DoS koruması)
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(safeSortBy).ascending() : Sort.by(safeSortBy).descending();
        Pageable pageable = PageRequest.of(page, safeSize, sort);
        var paginatedResult = boardService.getAllBoardsFiltered(userId, status, category, boardType, pageable);

        List<BoardModel> boardModels = paginatedResult.content().stream()
                .map(boardAssembler::toModel)
                .collect(Collectors.toList());

        PagedModel.PageMetadata metadata = new PagedModel.PageMetadata(
                paginatedResult.size(),
                paginatedResult.page(),
                paginatedResult.totalElements(),
                paginatedResult.totalPages()
        );

        PagedModel<BoardModel> pagedModel = PagedModel.of(boardModels, metadata);

        pagedModel.add(linkTo(methodOn(BoardController.class)
                .getUserBoards(userId, page, size, sortBy, sortDir, status, category, boardType))
                .withSelfRel());

        if (!paginatedResult.first()) {
            pagedModel.add(linkTo(methodOn(BoardController.class)
                    .getUserBoards(userId, page - 1, size, sortBy, sortDir, status, category, boardType))
                    .withRel("prev"));
            pagedModel.add(linkTo(methodOn(BoardController.class)
                    .getUserBoards(userId, 0, size, sortBy, sortDir, status, category, boardType))
                    .withRel("first"));
        }

        if (!paginatedResult.last()) {
            pagedModel.add(linkTo(methodOn(BoardController.class)
                    .getUserBoards(userId, page + 1, size, sortBy, sortDir, status, category, boardType))
                    .withRel("next"));
            pagedModel.add(linkTo(methodOn(BoardController.class)
                    .getUserBoards(userId, paginatedResult.totalPages() - 1, size, sortBy, sortDir, status, category, boardType))
                    .withRel("last"));
        }

        pagedModel.add(linkTo(methodOn(BoardController.class).createBoard(null))
                .withRel("create-board"));

        return ResponseEntity.ok(pagedModel);
    }

    @Operation(summary = "Atandığım panoları getir", description = "Kullanıcının sorumlu olarak atandığı panoları getirir")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Atandığım panolar başarıyla getirildi"),
            @ApiResponse(responseCode = "401", description = "Kimlik doğrulama gerekli")
    })
    @GetMapping("/assigned")
    public ResponseEntity<PagedModel<BoardModel>> getAssignedBoards(
            @Parameter(description = "Sayfa numarası (0'dan başlar)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Sayfa başına kayıt sayısı") @RequestParam(defaultValue = "20") int size) {
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        Pageable pageable = PageRequest.of(page, safeSize, Sort.by("createdAt").descending());
        var paginatedResult = boardService.getAssignedBoards(pageable);

        List<BoardModel> boardModels = paginatedResult.content().stream()
                .map(boardAssembler::toModel)
                .collect(Collectors.toList());

        PagedModel.PageMetadata metadata = new PagedModel.PageMetadata(
                paginatedResult.size(), paginatedResult.page(),
                paginatedResult.totalElements(), paginatedResult.totalPages());

        PagedModel<BoardModel> pagedModel = PagedModel.of(boardModels, metadata);
        pagedModel.add(linkTo(methodOn(BoardController.class).getAssignedBoards(page, size)).withSelfRel());

        return ResponseEntity.ok(pagedModel);
    }

    @Operation(summary = "Takım panolarımı getir", description = "Kullanıcının kendi oluşturduğu TEAM tipindeki panoları getirir")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Takım panoları başarıyla getirildi"),
            @ApiResponse(responseCode = "401", description = "Kimlik doğrulama gerekli")
    })
    @GetMapping("/my-team-boards")
    public ResponseEntity<PagedModel<BoardModel>> getMyTeamBoards(
            @Parameter(description = "Sayfa numarası (0'dan başlar)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Sayfa başına kayıt sayısı") @RequestParam(defaultValue = "20") int size) {
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        Pageable pageable = PageRequest.of(page, safeSize, Sort.by("createdAt").descending());
        var paginatedResult = boardService.getMyTeamBoards(pageable);

        List<BoardModel> boardModels = paginatedResult.content().stream()
                .map(boardAssembler::toModel)
                .collect(Collectors.toList());

        PagedModel.PageMetadata metadata = new PagedModel.PageMetadata(
                paginatedResult.size(), paginatedResult.page(),
                paginatedResult.totalElements(), paginatedResult.totalPages());

        PagedModel<BoardModel> pagedModel = PagedModel.of(boardModels, metadata);
        pagedModel.add(linkTo(methodOn(BoardController.class).getMyTeamBoards(page, size)).withSelfRel());

        return ResponseEntity.ok(pagedModel);
    }

    @Operation(summary = "Pano detaylarını getir", description = "Slug ile belirtilen panonun tüm detaylarını (listeler, görevler, etiketler) getirir")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Pano detayları başarıyla getirildi",
                    content = @Content(schema = @Schema(implementation = BoardModel.class))),
            @ApiResponse(responseCode = "401", description = "Kimlik doğrulama gerekli"),
            @ApiResponse(responseCode = "403", description = "Bu panoya erişim yetkiniz yok"),
            @ApiResponse(responseCode = "404", description = "Pano bulunamadı")
    })
    @GetMapping("/{slug}/details")
    public ResponseEntity<BoardModel> getBoardDetails(
            @Parameter(description = "Pano slug'ı") @PathVariable String slug) {
        logger.debug("getBoardDetails called for slug: {}", slug);
        BoardResponse result = boardService.getBoardDetails(slug);
        BoardModel model = boardAssembler.toModel(result);
        return ResponseEntity.ok(model);
    }

    @Operation(summary = "Pano sil", description = "Belirtilen panoyu ve ilişkili tüm verileri siler")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Pano silindi"),
            @ApiResponse(responseCode = "401", description = "Kimlik doğrulama gerekli"),
            @ApiResponse(responseCode = "403", description = "Bu panoyu silme yetkiniz yok"),
            @ApiResponse(responseCode = "404", description = "Pano bulunamadı")
    })
    @DeleteMapping("/{identifier}")
    public ResponseEntity<Void> deleteBoard(
            @Parameter(description = "Pano ID veya slug") @PathVariable String identifier) {
        Board board = boardService.resolveBoard(identifier);
        boardService.deleteBoard(board.getId());
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Pano güncelle", description = "Belirtilen panonun bilgilerini günceller")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Pano güncellendi",
                    content = @Content(schema = @Schema(implementation = BoardModel.class))),
            @ApiResponse(responseCode = "400", description = "Geçersiz istek veya bu isimde pano zaten var"),
            @ApiResponse(responseCode = "401", description = "Kimlik doğrulama gerekli"),
            @ApiResponse(responseCode = "403", description = "Bu panoyu güncelleme yetkiniz yok"),
            @ApiResponse(responseCode = "404", description = "Pano bulunamadı")
    })
    @PutMapping("/{identifier}")
    public ResponseEntity<BoardModel> updateBoard(
            @Parameter(description = "Pano ID veya slug") @PathVariable String identifier,
            @Valid @RequestBody UpdateBoardRequest request) {
        Board board = boardService.resolveBoard(identifier);
        BoardResponse result = boardService.updateBoard(board.getId(), request);
        BoardModel model = boardAssembler.toModel(result);
        return ResponseEntity.ok(model);
    }

    @Operation(summary = "Pano durumunu güncelle", description = "Panonun durumunu (PLANLANDI, DEVAM EDIYOR, TAMAMLANDI) günceller")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Durum güncellendi",
                    content = @Content(schema = @Schema(implementation = BoardModel.class))),
            @ApiResponse(responseCode = "401", description = "Kimlik doğrulama gerekli"),
            @ApiResponse(responseCode = "403", description = "Bu panonun durumunu güncelleme yetkiniz yok"),
            @ApiResponse(responseCode = "404", description = "Pano bulunamadı")
    })
    @PutMapping("/{identifier}/status")
    public ResponseEntity<BoardModel> updateBoardStatus(
            @Parameter(description = "Pano ID veya slug") @PathVariable String identifier,
            @Valid @RequestBody UpdateBoardStatusRequest request) {
        Board board = boardService.resolveBoard(identifier);
        BoardResponse result = boardService.updateBoardStatus(board.getId(), request.getStatus());
        BoardModel model = boardAssembler.toModel(result);
        return ResponseEntity.ok(model);
    }

    // ==================== NESTED PATH İŞLEMLERİ ====================

    @Operation(summary = "Panoya ait etiketleri getir (nested path)",
               description = "Belirtilen panoya ait tüm etiketleri listeler. /labels/board/{boardId} ile aynı sonucu döner.")
    @GetMapping("/{boardId}/labels")
    public ResponseEntity<CollectionModel<LabelModel>> getBoardLabels(
            @Parameter(description = "Pano ID") @PathVariable Long boardId) {
        List<LabelDto> labels = labelService.getLabelsByBoardId(boardId);
        List<LabelModel> labelModels = labels.stream()
                .map(label -> labelAssembler.toModelWithBoardLink(label, boardId))
                .collect(Collectors.toList());

        CollectionModel<LabelModel> collectionModel = CollectionModel.of(labelModels);
        collectionModel.add(linkTo(methodOn(BoardController.class).getBoardLabels(boardId)).withSelfRel());

        return ResponseEntity.ok(collectionModel);
    }
}
