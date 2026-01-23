package com.workflow.backend.controller;

import com.workflow.backend.dto.CreateLabelRequest;
import com.workflow.backend.dto.LabelDto;
import com.workflow.backend.hateoas.assembler.LabelModelAssembler;
import com.workflow.backend.hateoas.model.LabelModel;
import com.workflow.backend.service.LabelService;
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
public class LabelController {

    private final LabelService labelService;
    private final LabelModelAssembler labelAssembler;

    // GET /labels/board/{boardId} - Panoya ait tüm etiketleri getir
    @GetMapping("/board/{boardId}")
    public ResponseEntity<CollectionModel<LabelModel>> getLabelsByBoard(@PathVariable Long boardId) {
        List<LabelDto> labels = labelService.getLabelsByBoardId(boardId);
        List<LabelModel> labelModels = labels.stream()
                .map(label -> labelAssembler.toModelWithBoardLink(label, boardId))
                .collect(Collectors.toList());

        CollectionModel<LabelModel> collectionModel = CollectionModel.of(labelModels);

        // Self link
        collectionModel.add(linkTo(methodOn(LabelController.class).getLabelsByBoard(boardId))
                .withSelfRel());

        // Create label link
        collectionModel.add(linkTo(methodOn(LabelController.class).createLabel(null))
                .withRel("create-label"));

        return ResponseEntity.ok(collectionModel);
    }

    // POST /labels - Yeni etiket oluştur
    @PostMapping
    public ResponseEntity<LabelModel> createLabel(@Valid @RequestBody CreateLabelRequest request) {
        LabelDto result = labelService.createLabel(request);
        LabelModel model = labelAssembler.toModel(result);

        // Add link to board's labels
        model.add(linkTo(methodOn(LabelController.class).getLabelsByBoard(request.getBoardId()))
                .withRel("board-labels"));

        return ResponseEntity.ok(model);
    }

    // PUT /labels/{id} - Etiket güncelle
    @PutMapping("/{id}")
    public ResponseEntity<LabelModel> updateLabel(@PathVariable Long id, @Valid @RequestBody LabelDto request) {
        LabelDto result = labelService.updateLabel(id, request);
        LabelModel model = labelAssembler.toModel(result);
        return ResponseEntity.ok(model);
    }

    // DELETE /labels/{id} - Etiket sil
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLabel(@PathVariable Long id) {
        labelService.deleteLabel(id);
        return ResponseEntity.noContent().build();
    }
}
