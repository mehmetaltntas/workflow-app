package com.workflow.backend.controller;

import com.workflow.backend.dto.*;
import com.workflow.backend.hateoas.assembler.TaskListModelAssembler;
import com.workflow.backend.hateoas.assembler.TaskModelAssembler;
import com.workflow.backend.hateoas.model.TaskListModel;
import com.workflow.backend.hateoas.model.TaskModel;
import com.workflow.backend.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.hateoas.CollectionModel;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.*;

@RestController
@RequestMapping
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;
    private final TaskListModelAssembler taskListAssembler;
    private final TaskModelAssembler taskAssembler;

    // ==================== LİSTE (SÜTUN) İŞLEMLERİ ====================

    // LİSTE EKLE: POST /lists
    @PostMapping("/lists")
    public ResponseEntity<TaskListModel> createTaskList(@Valid @RequestBody CreateTaskListRequest request) {
        TaskListDto result = taskService.createTaskList(request);
        TaskListModel model = taskListAssembler.toModel(result);
        return ResponseEntity.ok(model);
    }

    // LİSTE GÜNCELLE: PUT /lists/{id}
    @PutMapping("/lists/{id}")
    public ResponseEntity<TaskListModel> updateTaskList(@PathVariable Long id, @Valid @RequestBody TaskListDto request) {
        TaskListDto result = taskService.updateTaskList(id, request);
        TaskListModel model = taskListAssembler.toModel(result);
        return ResponseEntity.ok(model);
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
    public ResponseEntity<TaskModel> createTask(@Valid @RequestBody CreateTaskRequest request) {
        TaskDto result = taskService.createTask(request);
        TaskModel model = taskAssembler.toModel(result);
        return ResponseEntity.ok(model);
    }

    // GÖREV GÜNCELLE: PUT /tasks/{id}
    @PutMapping("/tasks/{id}")
    public ResponseEntity<TaskModel> updateTask(@PathVariable Long id, @Valid @RequestBody TaskDto request) {
        TaskDto result = taskService.updateTask(id, request);
        TaskModel model = taskAssembler.toModel(result);
        return ResponseEntity.ok(model);
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
    public ResponseEntity<TaskModel> reorderTask(
            @PathVariable Long id,
            @Valid @RequestBody ReorderTaskRequest request) {
        TaskDto result = taskService.reorderTask(id, request);
        TaskModel model = taskAssembler.toModel(result);
        return ResponseEntity.ok(model);
    }

    /**
     * Bir liste içindeki tüm görevlerin sırasını toplu güncelle.
     * Drag & Drop sonrası tüm pozisyonları tek seferde günceller.
     *
     * PUT /tasks/batch-reorder
     * Body: { listId: 1, taskPositions: [{ taskId: 5, position: 0 }, { taskId: 3, position: 1 }] }
     */
    @PutMapping("/tasks/batch-reorder")
    public ResponseEntity<CollectionModel<TaskModel>> batchReorder(@Valid @RequestBody BatchReorderRequest request) {
        List<TaskDto> results = taskService.batchReorder(request);
        List<TaskModel> taskModels = results.stream()
                .map(taskAssembler::toModel)
                .collect(Collectors.toList());

        CollectionModel<TaskModel> collectionModel = CollectionModel.of(taskModels);

        // Self link
        collectionModel.add(linkTo(methodOn(TaskController.class).batchReorder(null))
                .withSelfRel());

        return ResponseEntity.ok(collectionModel);
    }
}
