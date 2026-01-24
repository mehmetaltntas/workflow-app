package com.workflow.backend.controller;

import com.workflow.backend.dto.CreateLabelRequest;
import com.workflow.backend.dto.LabelDto;
import com.workflow.backend.dto.TaskListUsageDto;
import com.workflow.backend.hateoas.assembler.LabelModelAssembler;
import com.workflow.backend.hateoas.model.LabelModel;
import com.workflow.backend.service.LabelService;
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
@RequestMapping("/labels")
@RequiredArgsConstructor
@Tag(name = "Labels", description = "Etiket işlemleri")
@SecurityRequirement(name = "bearerAuth")
public class LabelController {

    private final LabelService labelService;
    private final LabelModelAssembler labelAssembler;

    @Operation(summary = "Panoya ait etiketleri getir", description = "Belirtilen panoya ait tüm etiketleri listeler")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Etiketler başarıyla getirildi"),
            @ApiResponse(responseCode = "401", description = "Kimlik doğrulama gerekli"),
            @ApiResponse(responseCode = "403", description = "Bu panonun etiketlerine erişim yetkiniz yok")
    })
    @GetMapping("/board/{boardId}")
    public ResponseEntity<CollectionModel<LabelModel>> getLabelsByBoard(
            @Parameter(description = "Pano ID") @PathVariable Long boardId) {
        List<LabelDto> labels = labelService.getLabelsByBoardId(boardId);
        List<LabelModel> labelModels = labels.stream()
                .map(label -> labelAssembler.toModelWithBoardLink(label, boardId))
                .collect(Collectors.toList());

        CollectionModel<LabelModel> collectionModel = CollectionModel.of(labelModels);

        collectionModel.add(linkTo(methodOn(LabelController.class).getLabelsByBoard(boardId))
                .withSelfRel());

        collectionModel.add(linkTo(methodOn(LabelController.class).createLabel(null))
                .withRel("create-label"));

        return ResponseEntity.ok(collectionModel);
    }

    @Operation(summary = "Yeni etiket oluştur", description = "Panoya yeni bir etiket ekler (maksimum 10 etiket)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Etiket oluşturuldu",
                    content = @Content(schema = @Schema(implementation = LabelModel.class))),
            @ApiResponse(responseCode = "400", description = "Geçersiz istek, bu isimde etiket zaten var veya maksimum limite ulaşıldı"),
            @ApiResponse(responseCode = "401", description = "Kimlik doğrulama gerekli"),
            @ApiResponse(responseCode = "403", description = "Bu panoya etiket ekleme yetkiniz yok"),
            @ApiResponse(responseCode = "404", description = "Pano bulunamadı")
    })
    @PostMapping
    public ResponseEntity<LabelModel> createLabel(@Valid @RequestBody CreateLabelRequest request) {
        LabelDto result = labelService.createLabel(request);
        LabelModel model = labelAssembler.toModel(result);

        model.add(linkTo(methodOn(LabelController.class).getLabelsByBoard(request.getBoardId()))
                .withRel("board-labels"));

        return ResponseEntity.ok(model);
    }

    @Operation(summary = "Etiket güncelle", description = "Mevcut bir etiketin adını veya rengini günceller")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Etiket güncellendi",
                    content = @Content(schema = @Schema(implementation = LabelModel.class))),
            @ApiResponse(responseCode = "400", description = "Geçersiz istek veya bu isimde etiket zaten var"),
            @ApiResponse(responseCode = "401", description = "Kimlik doğrulama gerekli"),
            @ApiResponse(responseCode = "403", description = "Bu etiketi güncelleme yetkiniz yok"),
            @ApiResponse(responseCode = "404", description = "Etiket bulunamadı")
    })
    @PutMapping("/{id}")
    public ResponseEntity<LabelModel> updateLabel(
            @Parameter(description = "Etiket ID") @PathVariable Long id,
            @Valid @RequestBody LabelDto request) {
        LabelDto result = labelService.updateLabel(id, request);
        LabelModel model = labelAssembler.toModel(result);
        return ResponseEntity.ok(model);
    }

    @Operation(summary = "Etiket sil", description = "Etiketi siler ve tüm görevlerden kaldırır")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Etiket silindi"),
            @ApiResponse(responseCode = "401", description = "Kimlik doğrulama gerekli"),
            @ApiResponse(responseCode = "403", description = "Bu etiketi silme yetkiniz yok"),
            @ApiResponse(responseCode = "404", description = "Etiket bulunamadı")
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLabel(
            @Parameter(description = "Etiket ID") @PathVariable Long id) {
        labelService.deleteLabel(id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Etiket kullanımını getir", description = "Etiketin hangi listelerde kullanıldığını gösterir")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Kullanım bilgisi başarıyla getirildi"),
            @ApiResponse(responseCode = "401", description = "Kimlik doğrulama gerekli"),
            @ApiResponse(responseCode = "403", description = "Bu etiketin kullanımını görüntüleme yetkiniz yok"),
            @ApiResponse(responseCode = "404", description = "Etiket bulunamadı")
    })
    @GetMapping("/{id}/usage")
    public ResponseEntity<List<TaskListUsageDto>> getLabelUsage(
            @Parameter(description = "Etiket ID") @PathVariable Long id) {
        List<TaskListUsageDto> usage = labelService.getLabelUsage(id);
        return ResponseEntity.ok(usage);
    }
}
