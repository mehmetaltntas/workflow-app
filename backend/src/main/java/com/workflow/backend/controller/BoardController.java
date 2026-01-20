package com.workflow.backend.controller;

import com.workflow.backend.dto.BoardResponse;
import com.workflow.backend.dto.CreateBoardRequest;
import com.workflow.backend.service.BoardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/boards")
@RequiredArgsConstructor
public class BoardController {

    private final BoardService boardService;

    // Pano Oluştur: POST /boards
    @PostMapping
    public ResponseEntity<BoardResponse> createBoard(@RequestBody CreateBoardRequest request) {
        BoardResponse result = boardService.createBoard(request);
        return ResponseEntity.ok(result);
    }

    // Kullanıcının Panolarını Getir: GET /boards/user/1
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<BoardResponse>> getUserBoards(@PathVariable Long userId) {
        List<BoardResponse> result = boardService.getAllBoards(userId);
        return ResponseEntity.ok(result);
    }

    // GET /boards/{slug}/details
    @GetMapping("/{slug}/details")
    public ResponseEntity<BoardResponse> getBoardDetails(@PathVariable String slug) {
        System.out.println("BoardController: getBoardDetails called for slug: " + slug);
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
    public ResponseEntity<BoardResponse> updateBoard(@PathVariable Long id, @RequestBody CreateBoardRequest request) {
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