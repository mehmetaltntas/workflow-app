package com.workflow.backend.controller;

import com.workflow.backend.dto.CreateSubtaskRequest;
import com.workflow.backend.dto.SubtaskDto;
import com.workflow.backend.service.SubtaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/subtasks")
@RequiredArgsConstructor
public class SubtaskController {

    private final SubtaskService subtaskService;

    // Alt görev oluştur
    @PostMapping
    public ResponseEntity<SubtaskDto> createSubtask(@Valid @RequestBody CreateSubtaskRequest request) {
        return ResponseEntity.ok(subtaskService.createSubtask(request));
    }

    // Alt görevi güncelle
    @PutMapping("/{id}")
    public ResponseEntity<SubtaskDto> updateSubtask(
            @PathVariable Long id,
            @Valid @RequestBody SubtaskDto request) {
        return ResponseEntity.ok(subtaskService.updateSubtask(id, request));
    }

    // Alt görevi sil
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSubtask(@PathVariable Long id) {
        subtaskService.deleteSubtask(id);
        return ResponseEntity.noContent().build();
    }

    // Görevin alt görevlerini getir
    @GetMapping("/task/{taskId}")
    public ResponseEntity<List<SubtaskDto>> getSubtasksByTask(@PathVariable Long taskId) {
        return ResponseEntity.ok(subtaskService.getSubtasksByTaskId(taskId));
    }

    // Tamamlanma durumunu değiştir
    @PatchMapping("/{id}/toggle")
    public ResponseEntity<SubtaskDto> toggleComplete(@PathVariable Long id) {
        return ResponseEntity.ok(subtaskService.toggleComplete(id));
    }
}
