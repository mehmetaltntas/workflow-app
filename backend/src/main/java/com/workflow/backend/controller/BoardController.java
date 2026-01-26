package com.workflow.backend.controller;

import com.workflow.backend.dto.BoardResponse;
import com.workflow.backend.dto.CreateBoardRequest;
import com.workflow.backend.dto.UpdateBoardRequest;
import com.workflow.backend.hateoas.assembler.BoardModelAssembler;
import com.workflow.backend.hateoas.model.BoardModel;
import com.workflow.backend.service.BoardService;
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
import org.springframework.hateoas.PagedModel;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.*;

@RestController
@RequestMapping("/boards")
@RequiredArgsConstructor
@Tag(name = "Boards", description = "Pano (board) işlemleri")
@SecurityRequirement(name = "bearerAuth")
public class BoardController {

    private static final Logger logger = LoggerFactory.getLogger(BoardController.class);
    private final BoardService boardService;
    private final BoardModelAssembler boardAssembler;

    @Operation(summary = "Yeni pano oluştur", description = "Giriş yapmış kullanıcı için yeni bir pano oluşturur")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Pano oluşturuldu",
                    content = @Content(schema = @Schema(implementation = BoardModel.class))),
            @ApiResponse(responseCode = "400", description = "Geçersiz istek veya bu isimde pano zaten var"),
            @ApiResponse(responseCode = "401", description = "Kimlik doğrulama gerekli")
    })
    @PostMapping
    public ResponseEntity<BoardModel> createBoard(@Valid @RequestBody CreateBoardRequest request) {
        BoardResponse result = boardService.createBoard(request);
        BoardModel model = boardAssembler.toModel(result);
        return ResponseEntity.ok(model);
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
            @Parameter(description = "Sıralama yönü (asc/desc)") @RequestParam(defaultValue = "desc") String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        var paginatedResult = boardService.getAllBoards(userId, pageable);

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
                .getUserBoards(userId, page, size, sortBy, sortDir))
                .withSelfRel());

        if (!paginatedResult.first()) {
            pagedModel.add(linkTo(methodOn(BoardController.class)
                    .getUserBoards(userId, page - 1, size, sortBy, sortDir))
                    .withRel("prev"));
            pagedModel.add(linkTo(methodOn(BoardController.class)
                    .getUserBoards(userId, 0, size, sortBy, sortDir))
                    .withRel("first"));
        }

        if (!paginatedResult.last()) {
            pagedModel.add(linkTo(methodOn(BoardController.class)
                    .getUserBoards(userId, page + 1, size, sortBy, sortDir))
                    .withRel("next"));
            pagedModel.add(linkTo(methodOn(BoardController.class)
                    .getUserBoards(userId, paginatedResult.totalPages() - 1, size, sortBy, sortDir))
                    .withRel("last"));
        }

        pagedModel.add(linkTo(methodOn(BoardController.class).createBoard(null))
                .withRel("create-board"));

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
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBoard(
            @Parameter(description = "Pano ID") @PathVariable Long id) {
        boardService.deleteBoard(id);
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
    @PutMapping("/{id}")
    public ResponseEntity<BoardModel> updateBoard(
            @Parameter(description = "Pano ID") @PathVariable Long id,
            @Valid @RequestBody UpdateBoardRequest request) {
        BoardResponse result = boardService.updateBoard(id, request);
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
    @PutMapping("/{id}/status")
    public ResponseEntity<BoardModel> updateBoardStatus(
            @Parameter(description = "Pano ID") @PathVariable Long id,
            @Parameter(description = "Yeni durum") @RequestBody String newStatus) {
        BoardResponse result = boardService.updateBoardStatus(id, newStatus);
        BoardModel model = boardAssembler.toModel(result);
        return ResponseEntity.ok(model);
    }
}
