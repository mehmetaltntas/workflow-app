package com.workflow.backend.controller;

import com.workflow.backend.dto.BoardResponse;
import com.workflow.backend.dto.CreateBoardRequest;
import com.workflow.backend.hateoas.assembler.BoardModelAssembler;
import com.workflow.backend.hateoas.model.BoardModel;
import com.workflow.backend.service.BoardService;
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
public class BoardController {

    private static final Logger logger = LoggerFactory.getLogger(BoardController.class);
    private final BoardService boardService;
    private final BoardModelAssembler boardAssembler;

    // Pano Oluştur: POST /boards
    @PostMapping
    public ResponseEntity<BoardModel> createBoard(@Valid @RequestBody CreateBoardRequest request) {
        BoardResponse result = boardService.createBoard(request);
        BoardModel model = boardAssembler.toModel(result);
        return ResponseEntity.ok(model);
    }

    // Kullanıcının Panolarını Getir: GET /boards/user/1
    @GetMapping("/user/{userId}")
    public ResponseEntity<PagedModel<BoardModel>> getUserBoards(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
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

        // Self link
        pagedModel.add(linkTo(methodOn(BoardController.class)
                .getUserBoards(userId, page, size, sortBy, sortDir))
                .withSelfRel());

        // Navigation links
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

        // Create board link
        pagedModel.add(linkTo(methodOn(BoardController.class).createBoard(null))
                .withRel("create-board"));

        return ResponseEntity.ok(pagedModel);
    }

    // GET /boards/{slug}/details
    @GetMapping("/{slug}/details")
    public ResponseEntity<BoardModel> getBoardDetails(@PathVariable String slug) {
        logger.debug("getBoardDetails called for slug: {}", slug);
        BoardResponse result = boardService.getBoardDetails(slug);
        BoardModel model = boardAssembler.toModel(result);
        return ResponseEntity.ok(model);
    }

    // DELETE /boards/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBoard(@PathVariable Long id) {
        boardService.deleteBoard(id);
        return ResponseEntity.noContent().build();
    }

    // PUT /boards/{id}
    @PutMapping("/{id}")
    public ResponseEntity<BoardModel> updateBoard(@PathVariable Long id, @Valid @RequestBody CreateBoardRequest request) {
        BoardResponse result = boardService.updateBoard(id, request);
        BoardModel model = boardAssembler.toModel(result);
        return ResponseEntity.ok(model);
    }

    // PUT /boards/{id}/status
    @PutMapping("/{id}/status")
    public ResponseEntity<BoardModel> updateBoardStatus(@PathVariable Long id, @RequestBody String newStatus) {
        BoardResponse result = boardService.updateBoardStatus(id, newStatus);
        BoardModel model = boardAssembler.toModel(result);
        return ResponseEntity.ok(model);
    }
}
