package com.workflow.backend.controller;

import com.workflow.backend.dto.CreateSubtaskRequest;
import com.workflow.backend.dto.SubtaskDto;
import com.workflow.backend.hateoas.assembler.SubtaskModelAssembler;
import com.workflow.backend.hateoas.model.SubtaskModel;
import com.workflow.backend.service.SubtaskService;
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
@RequestMapping("/subtasks")
@RequiredArgsConstructor
@Tag(name = "Subtasks", description = "Alt görev işlemleri")
@SecurityRequirement(name = "bearerAuth")
public class SubtaskController {

    private final SubtaskService subtaskService;
    private final SubtaskModelAssembler subtaskAssembler;

    @Operation(summary = "Alt görev oluştur", description = "Göreve yeni bir alt görev ekler")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Alt görev oluşturuldu",
                    content = @Content(schema = @Schema(implementation = SubtaskModel.class))),
            @ApiResponse(responseCode = "400", description = "Geçersiz istek"),
            @ApiResponse(responseCode = "401", description = "Kimlik doğrulama gerekli"),
            @ApiResponse(responseCode = "403", description = "Bu göreve alt görev ekleme yetkiniz yok"),
            @ApiResponse(responseCode = "404", description = "Görev bulunamadı")
    })
    @PostMapping
    public ResponseEntity<SubtaskModel> createSubtask(@Valid @RequestBody CreateSubtaskRequest request) {
        SubtaskDto result = subtaskService.createSubtask(request);
        SubtaskModel model = subtaskAssembler.toModel(result);

        model.add(linkTo(methodOn(SubtaskController.class).getSubtasksByTask(request.getTaskId()))
                .withRel("task-subtasks"));

        return ResponseEntity.ok(model);
    }

    @Operation(summary = "Alt görev güncelle", description = "Mevcut bir alt görevi günceller")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Alt görev güncellendi",
                    content = @Content(schema = @Schema(implementation = SubtaskModel.class))),
            @ApiResponse(responseCode = "400", description = "Geçersiz istek"),
            @ApiResponse(responseCode = "401", description = "Kimlik doğrulama gerekli"),
            @ApiResponse(responseCode = "403", description = "Bu alt görevi güncelleme yetkiniz yok"),
            @ApiResponse(responseCode = "404", description = "Alt görev bulunamadı")
    })
    @PutMapping("/{id}")
    public ResponseEntity<SubtaskModel> updateSubtask(
            @Parameter(description = "Alt görev ID") @PathVariable Long id,
            @Valid @RequestBody SubtaskDto request) {
        SubtaskDto result = subtaskService.updateSubtask(id, request);
        SubtaskModel model = subtaskAssembler.toModel(result);
        return ResponseEntity.ok(model);
    }

    @Operation(summary = "Alt görev sil", description = "Alt görevi siler")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Alt görev silindi"),
            @ApiResponse(responseCode = "401", description = "Kimlik doğrulama gerekli"),
            @ApiResponse(responseCode = "403", description = "Bu alt görevi silme yetkiniz yok"),
            @ApiResponse(responseCode = "404", description = "Alt görev bulunamadı")
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSubtask(
            @Parameter(description = "Alt görev ID") @PathVariable Long id) {
        subtaskService.deleteSubtask(id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Görevin alt görevlerini getir", description = "Belirtilen göreve ait tüm alt görevleri listeler")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Alt görevler başarıyla getirildi"),
            @ApiResponse(responseCode = "401", description = "Kimlik doğrulama gerekli"),
            @ApiResponse(responseCode = "403", description = "Bu görevin alt görevlerine erişim yetkiniz yok")
    })
    @GetMapping("/task/{taskId}")
    public ResponseEntity<CollectionModel<SubtaskModel>> getSubtasksByTask(
            @Parameter(description = "Görev ID") @PathVariable Long taskId) {
        List<SubtaskDto> subtasks = subtaskService.getSubtasksByTaskId(taskId);
        List<SubtaskModel> subtaskModels = subtasks.stream()
                .map(subtaskAssembler::toModel)
                .collect(Collectors.toList());

        CollectionModel<SubtaskModel> collectionModel = CollectionModel.of(subtaskModels);

        collectionModel.add(linkTo(methodOn(SubtaskController.class).getSubtasksByTask(taskId))
                .withSelfRel());

        collectionModel.add(linkTo(methodOn(SubtaskController.class).createSubtask(null))
                .withRel("create-subtask"));

        collectionModel.add(linkTo(methodOn(TaskController.class).updateTask(taskId, null))
                .withRel("task"));

        return ResponseEntity.ok(collectionModel);
    }

    @Operation(summary = "Tamamlanma durumunu değiştir", description = "Alt görevin tamamlanma durumunu tersine çevirir")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Durum değiştirildi",
                    content = @Content(schema = @Schema(implementation = SubtaskModel.class))),
            @ApiResponse(responseCode = "401", description = "Kimlik doğrulama gerekli"),
            @ApiResponse(responseCode = "403", description = "Bu alt görevin durumunu değiştirme yetkiniz yok"),
            @ApiResponse(responseCode = "404", description = "Alt görev bulunamadı")
    })
    @PatchMapping("/{id}/toggle")
    public ResponseEntity<SubtaskModel> toggleComplete(
            @Parameter(description = "Alt görev ID") @PathVariable Long id) {
        SubtaskDto result = subtaskService.toggleComplete(id);
        SubtaskModel model = subtaskAssembler.toModel(result);
        return ResponseEntity.ok(model);
    }
}
