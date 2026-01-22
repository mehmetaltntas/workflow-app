package com.workflow.backend.controller;

import com.workflow.backend.dto.CreateLabelRequest;
import com.workflow.backend.dto.LabelDto;
import com.workflow.backend.service.LabelService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/labels")
@RequiredArgsConstructor
public class LabelController {

    private final LabelService labelService;

    // GET /labels/board/{boardId} - Panoya ait tüm etiketleri getir
    @GetMapping("/board/{boardId}")
    public ResponseEntity<List<LabelDto>> getLabelsByBoard(@PathVariable Long boardId) {
        return ResponseEntity.ok(labelService.getLabelsByBoardId(boardId));
    }

    // POST /labels - Yeni etiket oluştur
    @PostMapping
    public ResponseEntity<LabelDto> createLabel(@Valid @RequestBody CreateLabelRequest request) {
        return ResponseEntity.ok(labelService.createLabel(request));
    }

    // PUT /labels/{id} - Etiket güncelle
    @PutMapping("/{id}")
    public ResponseEntity<LabelDto> updateLabel(@PathVariable Long id, @Valid @RequestBody LabelDto request) {
        return ResponseEntity.ok(labelService.updateLabel(id, request));
    }

    // DELETE /labels/{id} - Etiket sil
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLabel(@PathVariable Long id) {
        labelService.deleteLabel(id);
        return ResponseEntity.noContent().build();
    }
}
