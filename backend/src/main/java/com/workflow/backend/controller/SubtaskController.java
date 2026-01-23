package com.workflow.backend.controller;

import com.workflow.backend.dto.CreateSubtaskRequest;
import com.workflow.backend.dto.SubtaskDto;
import com.workflow.backend.hateoas.assembler.SubtaskModelAssembler;
import com.workflow.backend.hateoas.model.SubtaskModel;
import com.workflow.backend.service.SubtaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.hateoas.CollectionModel;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.*;

@RestController
@RequestMapping("/subtasks")
@RequiredArgsConstructor
public class SubtaskController {

    private final SubtaskService subtaskService;
    private final SubtaskModelAssembler subtaskAssembler;

    // Alt görev oluştur
    @PostMapping
    public ResponseEntity<SubtaskModel> createSubtask(@Valid @RequestBody CreateSubtaskRequest request) {
        SubtaskDto result = subtaskService.createSubtask(request);
        SubtaskModel model = subtaskAssembler.toModel(result);

        // Add link to parent task's subtasks
        model.add(linkTo(methodOn(SubtaskController.class).getSubtasksByTask(request.getTaskId()))
                .withRel("task-subtasks"));

        return ResponseEntity.ok(model);
    }

    // Alt görevi güncelle
    @PutMapping("/{id}")
    public ResponseEntity<SubtaskModel> updateSubtask(
            @PathVariable Long id,
            @Valid @RequestBody SubtaskDto request) {
        SubtaskDto result = subtaskService.updateSubtask(id, request);
        SubtaskModel model = subtaskAssembler.toModel(result);
        return ResponseEntity.ok(model);
    }

    // Alt görevi sil
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSubtask(@PathVariable Long id) {
        subtaskService.deleteSubtask(id);
        return ResponseEntity.noContent().build();
    }

    // Görevin alt görevlerini getir
    @GetMapping("/task/{taskId}")
    public ResponseEntity<CollectionModel<SubtaskModel>> getSubtasksByTask(@PathVariable Long taskId) {
        List<SubtaskDto> subtasks = subtaskService.getSubtasksByTaskId(taskId);
        List<SubtaskModel> subtaskModels = subtasks.stream()
                .map(subtaskAssembler::toModel)
                .collect(Collectors.toList());

        CollectionModel<SubtaskModel> collectionModel = CollectionModel.of(subtaskModels);

        // Self link
        collectionModel.add(linkTo(methodOn(SubtaskController.class).getSubtasksByTask(taskId))
                .withSelfRel());

        // Create subtask link
        collectionModel.add(linkTo(methodOn(SubtaskController.class).createSubtask(null))
                .withRel("create-subtask"));

        // Parent task link
        collectionModel.add(linkTo(methodOn(TaskController.class).updateTask(taskId, null))
                .withRel("task"));

        return ResponseEntity.ok(collectionModel);
    }

    // Tamamlanma durumunu değiştir
    @PatchMapping("/{id}/toggle")
    public ResponseEntity<SubtaskModel> toggleComplete(@PathVariable Long id) {
        SubtaskDto result = subtaskService.toggleComplete(id);
        SubtaskModel model = subtaskAssembler.toModel(result);
        return ResponseEntity.ok(model);
    }
}
