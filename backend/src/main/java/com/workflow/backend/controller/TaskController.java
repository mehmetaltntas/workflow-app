package com.workflow.backend.controller;

import com.workflow.backend.dto.*;
import com.workflow.backend.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    // ==================== LİSTE (SÜTUN) İŞLEMLERİ ====================

    // LİSTE EKLE: POST /lists
    @PostMapping("/lists")
    public ResponseEntity<TaskListDto> createTaskList(@Valid @RequestBody CreateTaskListRequest request) {
        return ResponseEntity.ok(taskService.createTaskList(request));
    }

    // LİSTE GÜNCELLE: PUT /lists/{id}
    @PutMapping("/lists/{id}")
    public ResponseEntity<TaskListDto> updateTaskList(@PathVariable Long id, @Valid @RequestBody TaskListDto request) {
        return ResponseEntity.ok(taskService.updateTaskList(id, request));
    }

    // LİSTE SİL: DELETE /lists/{id}
    @DeleteMapping("/lists/{id}")
    public ResponseEntity<Void> deleteTaskList(@PathVariable Long id) {
        taskService.deleteTaskList(id);
        return ResponseEntity.noContent().build();
    }

    // ==================== GÖREV (KART) İŞLEMLERİ ====================

    // GÖREV EKLE: POST /tasks
    @PostMapping("/tasks")
    public ResponseEntity<TaskDto> createTask(@Valid @RequestBody CreateTaskRequest request) {
        return ResponseEntity.ok(taskService.createTask(request));
    }

    // GÖREV GÜNCELLE: PUT /tasks/{id}
    @PutMapping("/tasks/{id}")
    public ResponseEntity<TaskDto> updateTask(@PathVariable Long id, @Valid @RequestBody TaskDto request) {
        return ResponseEntity.ok(taskService.updateTask(id, request));
    }

    // GÖREV SİL: DELETE /tasks/{id}
    @DeleteMapping("/tasks/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable Long id) {
        taskService.deleteTask(id);
        return ResponseEntity.noContent().build();
    }

    // ==================== DRAG & DROP İŞLEMLERİ ====================

    /**
     * Tek bir görevi taşı veya sırala.
     * Aynı liste içinde sıralama veya farklı listeye taşıma yapılabilir.
     *
     * PUT /tasks/{id}/reorder
     * Body: { targetListId: 5, newPosition: 2 }
     */
    @PutMapping("/tasks/{id}/reorder")
    public ResponseEntity<TaskDto> reorderTask(
            @PathVariable Long id,
            @Valid @RequestBody ReorderTaskRequest request) {
        return ResponseEntity.ok(taskService.reorderTask(id, request));
    }

    /**
     * Bir liste içindeki tüm görevlerin sırasını toplu güncelle.
     * Drag & Drop sonrası tüm pozisyonları tek seferde günceller.
     *
     * PUT /tasks/batch-reorder
     * Body: { listId: 1, taskPositions: [{ taskId: 5, position: 0 }, { taskId: 3, position: 1 }] }
     */
    @PutMapping("/tasks/batch-reorder")
    public ResponseEntity<List<TaskDto>> batchReorder(@Valid @RequestBody BatchReorderRequest request) {
        return ResponseEntity.ok(taskService.batchReorder(request));
    }
}
