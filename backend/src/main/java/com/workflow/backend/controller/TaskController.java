package com.workflow.backend.controller;

import com.workflow.backend.dto.*;
import com.workflow.backend.hateoas.assembler.TaskListModelAssembler;
import com.workflow.backend.hateoas.assembler.TaskModelAssembler;
import com.workflow.backend.hateoas.model.TaskListModel;
import com.workflow.backend.hateoas.model.TaskModel;
import com.workflow.backend.service.TaskService;
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
import org.springframework.hateoas.CollectionModel;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.*;

@RestController
@RequestMapping
@RequiredArgsConstructor
@Tag(name = "Tasks", description = "Görev (task) ve liste (task list) işlemleri")
@SecurityRequirement(name = "bearerAuth")
public class TaskController {

    private final TaskService taskService;
    private final TaskListModelAssembler taskListAssembler;
    private final TaskModelAssembler taskAssembler;

    // ==================== LİSTE (SÜTUN) İŞLEMLERİ ====================

    @Operation(summary = "Yeni liste oluştur", description = "Panoya yeni bir görev listesi (sütun) ekler")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Liste oluşturuldu",
                    content = @Content(schema = @Schema(implementation = TaskListModel.class))),
            @ApiResponse(responseCode = "400", description = "Geçersiz istek veya bu isimde liste zaten var"),
            @ApiResponse(responseCode = "401", description = "Kimlik doğrulama gerekli"),
            @ApiResponse(responseCode = "403", description = "Bu panoya liste ekleme yetkiniz yok"),
            @ApiResponse(responseCode = "404", description = "Pano bulunamadı")
    })
    @PostMapping("/lists")
    public ResponseEntity<TaskListModel> createTaskList(@Valid @RequestBody CreateTaskListRequest request) {
        TaskListDto result = taskService.createTaskList(request);
        TaskListModel model = taskListAssembler.toModel(result);
        return ResponseEntity.ok(model);
    }

    @Operation(summary = "Liste güncelle", description = "Mevcut bir listeyi günceller")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Liste güncellendi",
                    content = @Content(schema = @Schema(implementation = TaskListModel.class))),
            @ApiResponse(responseCode = "400", description = "Geçersiz istek veya bu isimde liste zaten var"),
            @ApiResponse(responseCode = "401", description = "Kimlik doğrulama gerekli"),
            @ApiResponse(responseCode = "403", description = "Bu listeyi güncelleme yetkiniz yok"),
            @ApiResponse(responseCode = "404", description = "Liste bulunamadı")
    })
    @PutMapping("/lists/{id}")
    public ResponseEntity<TaskListModel> updateTaskList(
            @Parameter(description = "Liste ID") @PathVariable Long id,
            @Valid @RequestBody TaskListDto request) {
        TaskListDto result = taskService.updateTaskList(id, request);
        TaskListModel model = taskListAssembler.toModel(result);
        return ResponseEntity.ok(model);
    }

    @Operation(summary = "Liste sil", description = "Listeyi ve içindeki tüm görevleri siler")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Liste silindi"),
            @ApiResponse(responseCode = "401", description = "Kimlik doğrulama gerekli"),
            @ApiResponse(responseCode = "403", description = "Bu listeyi silme yetkiniz yok"),
            @ApiResponse(responseCode = "404", description = "Liste bulunamadı")
    })
    @DeleteMapping("/lists/{id}")
    public ResponseEntity<Void> deleteTaskList(
            @Parameter(description = "Liste ID") @PathVariable Long id) {
        taskService.deleteTaskList(id);
        return ResponseEntity.noContent().build();
    }

    // ==================== GÖREV (KART) İŞLEMLERİ ====================

    @Operation(summary = "Yeni görev oluştur", description = "Listeye yeni bir görev (kart) ekler")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Görev oluşturuldu",
                    content = @Content(schema = @Schema(implementation = TaskModel.class))),
            @ApiResponse(responseCode = "400", description = "Geçersiz istek veya bu isimde görev zaten var"),
            @ApiResponse(responseCode = "401", description = "Kimlik doğrulama gerekli"),
            @ApiResponse(responseCode = "403", description = "Bu listeye görev ekleme yetkiniz yok"),
            @ApiResponse(responseCode = "404", description = "Liste bulunamadı")
    })
    @PostMapping("/tasks")
    public ResponseEntity<TaskModel> createTask(@Valid @RequestBody CreateTaskRequest request) {
        TaskDto result = taskService.createTask(request);
        TaskModel model = taskAssembler.toModel(result);
        return ResponseEntity.ok(model);
    }

    @Operation(summary = "Görev güncelle", description = "Mevcut bir görevi günceller")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Görev güncellendi",
                    content = @Content(schema = @Schema(implementation = TaskModel.class))),
            @ApiResponse(responseCode = "400", description = "Geçersiz istek"),
            @ApiResponse(responseCode = "401", description = "Kimlik doğrulama gerekli"),
            @ApiResponse(responseCode = "403", description = "Bu görevi güncelleme yetkiniz yok"),
            @ApiResponse(responseCode = "404", description = "Görev bulunamadı")
    })
    @PutMapping("/tasks/{id}")
    public ResponseEntity<TaskModel> updateTask(
            @Parameter(description = "Görev ID") @PathVariable Long id,
            @Valid @RequestBody TaskDto request) {
        TaskDto result = taskService.updateTask(id, request);
        TaskModel model = taskAssembler.toModel(result);
        return ResponseEntity.ok(model);
    }

    @Operation(summary = "Görev sil", description = "Görevi ve alt görevlerini siler")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Görev silindi"),
            @ApiResponse(responseCode = "401", description = "Kimlik doğrulama gerekli"),
            @ApiResponse(responseCode = "403", description = "Bu görevi silme yetkiniz yok"),
            @ApiResponse(responseCode = "404", description = "Görev bulunamadı")
    })
    @DeleteMapping("/tasks/{id}")
    public ResponseEntity<Void> deleteTask(
            @Parameter(description = "Görev ID") @PathVariable Long id) {
        taskService.deleteTask(id);
        return ResponseEntity.noContent().build();
    }

    // ==================== DRAG & DROP İŞLEMLERİ ====================

    @Operation(summary = "Görev taşı/sırala", description = "Görevi aynı liste içinde sıralar veya farklı listeye taşır (Drag & Drop)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Görev taşındı",
                    content = @Content(schema = @Schema(implementation = TaskModel.class))),
            @ApiResponse(responseCode = "400", description = "Geçersiz istek"),
            @ApiResponse(responseCode = "401", description = "Kimlik doğrulama gerekli"),
            @ApiResponse(responseCode = "403", description = "Bu görevi taşıma yetkiniz yok"),
            @ApiResponse(responseCode = "404", description = "Görev veya hedef liste bulunamadı")
    })
    @PutMapping("/tasks/{id}/reorder")
    public ResponseEntity<TaskModel> reorderTask(
            @Parameter(description = "Görev ID") @PathVariable Long id,
            @Valid @RequestBody ReorderTaskRequest request) {
        TaskDto result = taskService.reorderTask(id, request);
        TaskModel model = taskAssembler.toModel(result);
        return ResponseEntity.ok(model);
    }

    @Operation(summary = "Toplu sıralama", description = "Bir liste içindeki tüm görevlerin sırasını tek seferde günceller")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Görevler sıralandı"),
            @ApiResponse(responseCode = "400", description = "Geçersiz istek"),
            @ApiResponse(responseCode = "401", description = "Kimlik doğrulama gerekli"),
            @ApiResponse(responseCode = "403", description = "Bu listedeki görevleri sıralama yetkiniz yok"),
            @ApiResponse(responseCode = "404", description = "Liste veya görev bulunamadı")
    })
    @PutMapping("/tasks/batch-reorder")
    public ResponseEntity<CollectionModel<TaskModel>> batchReorder(@Valid @RequestBody BatchReorderRequest request) {
        List<TaskDto> results = taskService.batchReorder(request);
        List<TaskModel> taskModels = results.stream()
                .map(taskAssembler::toModel)
                .collect(Collectors.toList());

        CollectionModel<TaskModel> collectionModel = CollectionModel.of(taskModels);

        collectionModel.add(linkTo(methodOn(TaskController.class).batchReorder(null))
                .withSelfRel());

        return ResponseEntity.ok(collectionModel);
    }
}
