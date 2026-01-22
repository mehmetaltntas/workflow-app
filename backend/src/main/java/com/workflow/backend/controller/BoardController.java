package com.workflow.backend.controller;

import com.workflow.backend.dto.BoardResponse;
import com.workflow.backend.dto.CreateBoardRequest;
import com.workflow.backend.dto.PaginatedResponse;
import com.workflow.backend.service.BoardService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/boards")
@RequiredArgsConstructor
public class BoardController {

    private static final Logger logger = LoggerFactory.getLogger(BoardController.class);
    private final BoardService boardService;

    // Pano Oluştur: POST /boards
    @PostMapping
    public ResponseEntity<BoardResponse> createBoard(@Valid @RequestBody CreateBoardRequest request) {
        BoardResponse result = boardService.createBoard(request);
        return ResponseEntity.ok(result);
    }

    // Kullanıcının Panolarını Getir: GET /boards/user/1
    @GetMapping("/user/{userId}")
    public ResponseEntity<PaginatedResponse<BoardResponse>> getUserBoards(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        PaginatedResponse<BoardResponse> result = boardService.getAllBoards(userId, pageable);
        return ResponseEntity.ok(result);
    }

    // GET /boards/{slug}/details
    @GetMapping("/{slug}/details")
    public ResponseEntity<BoardResponse> getBoardDetails(@PathVariable String slug) {
        logger.debug("getBoardDetails called for slug: {}", slug);
        return ResponseEntity.ok(boardService.getBoardDetails(slug));
    }

    // DELETE /boards/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBoard(@PathVariable Long id) {
        boardService.deleteBoard(id);
        return ResponseEntity.noContent().build();
    }

    // PUT /boards/{id}
    @PutMapping("/{id}")
    public ResponseEntity<BoardResponse> updateBoard(@PathVariable Long id, @Valid @RequestBody CreateBoardRequest request) {
        BoardResponse result = boardService.updateBoard(id, request);
        return ResponseEntity.ok(result);
    }

    // PUT /boards/{id}/status
    @PutMapping("/{id}/status")
    public ResponseEntity<BoardResponse> updateBoardStatus(@PathVariable Long id, @RequestBody String newStatus) {
        BoardResponse result = boardService.updateBoardStatus(id, newStatus);
        return ResponseEntity.ok(result);
    }
}