package com.workflow.backend.controller;

import com.workflow.backend.dto.CreateBoardMemberRequest;
import com.workflow.backend.dto.BoardMemberResponse;
import com.workflow.backend.dto.BulkCreateAssignmentRequest;
import com.workflow.backend.dto.CreateAssignmentRequest;
import com.workflow.backend.dto.UpdateBoardMemberRoleRequest;
import com.workflow.backend.hateoas.assembler.BoardMemberModelAssembler;
import com.workflow.backend.hateoas.model.BoardMemberModel;
import com.workflow.backend.service.BoardMemberService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.hateoas.CollectionModel;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.*;

@RestController
@RequestMapping("/boards/{boardId}/members")
@RequiredArgsConstructor
@Tag(name = "Board Members", description = "Pano üye (sorumlu kişi) işlemleri")
@SecurityRequirement(name = "bearerAuth")
public class BoardMemberController {

    private final BoardMemberService boardMemberService;
    private final BoardMemberModelAssembler boardMemberAssembler;

    @Operation(summary = "Pano üyelerini getir", description = "Panoya eklenen tüm sorumlu kişileri listeler")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Üyeler getirildi"),
            @ApiResponse(responseCode = "401", description = "Kimlik doğrulama gerekli"),
            @ApiResponse(responseCode = "403", description = "Bu panoya erişim yetkiniz yok")
    })
    @GetMapping
    public ResponseEntity<CollectionModel<BoardMemberModel>> getMembers(
            @Parameter(description = "Pano ID") @PathVariable Long boardId,
            @Parameter(description = "Sayfa numarası") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Sayfa boyutu") @RequestParam(defaultValue = "50") int size) {
        List<BoardMemberResponse> members = boardMemberService.getMembers(boardId);

        // Simple pagination via subList
        int start = Math.min(page * size, members.size());
        int end = Math.min(start + size, members.size());
        List<BoardMemberResponse> pagedMembers = members.subList(start, end);

        List<BoardMemberModel> memberModels = pagedMembers.stream()
                .map(boardMemberAssembler::toModel)
                .collect(Collectors.toList());

        CollectionModel<BoardMemberModel> collectionModel = CollectionModel.of(memberModels);
        collectionModel.add(linkTo(methodOn(BoardMemberController.class).getMembers(boardId, page, size)).withSelfRel());

        return ResponseEntity.ok(collectionModel);
    }

    @Operation(summary = "Pano üyesi ekle", description = "Kabul edilmiş bağlantılardan panoya sorumlu kişi ekler")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Üye eklendi"),
            @ApiResponse(responseCode = "400", description = "Geçersiz istek"),
            @ApiResponse(responseCode = "401", description = "Kimlik doğrulama gerekli"),
            @ApiResponse(responseCode = "403", description = "Bu panoya üye ekleme yetkiniz yok"),
            @ApiResponse(responseCode = "409", description = "Bu kullanıcı zaten üye")
    })
    @PostMapping
    public ResponseEntity<BoardMemberModel> addMember(
            @Parameter(description = "Pano ID") @PathVariable Long boardId,
            @Valid @RequestBody CreateBoardMemberRequest request) {
        BoardMemberResponse result = boardMemberService.addMember(boardId, request.getUserId());
        BoardMemberModel model = boardMemberAssembler.toModel(result);
        return ResponseEntity.status(HttpStatus.CREATED).body(model);
    }

    @Operation(summary = "Pano üyesini kaldır", description = "Panodan bir sorumlu kişiyi çıkarır")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Üye kaldırıldı"),
            @ApiResponse(responseCode = "401", description = "Kimlik doğrulama gerekli"),
            @ApiResponse(responseCode = "403", description = "Bu panodan üye kaldırma yetkiniz yok"),
            @ApiResponse(responseCode = "404", description = "Üye bulunamadı")
    })
    @DeleteMapping("/{memberId}")
    public ResponseEntity<Void> removeMember(
            @Parameter(description = "Pano ID") @PathVariable Long boardId,
            @Parameter(description = "Üye ID") @PathVariable Long memberId) {
        boardMemberService.removeMember(boardId, memberId);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Üye rolünü güncelle", description = "Pano üyesinin rolünü günceller (MEMBER/MODERATOR)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Rol güncellendi"),
            @ApiResponse(responseCode = "400", description = "Geçersiz rol veya maksimum moderatör sayısına ulaşıldı"),
            @ApiResponse(responseCode = "401", description = "Kimlik doğrulama gerekli"),
            @ApiResponse(responseCode = "403", description = "Bu panoda rol güncelleme yetkiniz yok"),
            @ApiResponse(responseCode = "404", description = "Üye bulunamadı")
    })
    @PutMapping("/{memberId}/role")
    public ResponseEntity<BoardMemberModel> updateMemberRole(
            @Parameter(description = "Pano ID") @PathVariable Long boardId,
            @Parameter(description = "Üye ID") @PathVariable Long memberId,
            @Valid @RequestBody UpdateBoardMemberRoleRequest request) {
        BoardMemberResponse result = boardMemberService.updateMemberRole(boardId, memberId, request.getRole());
        BoardMemberModel model = boardMemberAssembler.toModel(result);
        return ResponseEntity.ok(model);
    }

    @Operation(summary = "Üyeye atama yap", description = "Üyeye liste/görev/alt görev atama yapar")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Atama yapıldı"),
            @ApiResponse(responseCode = "400", description = "Geçersiz istek"),
            @ApiResponse(responseCode = "401", description = "Kimlik doğrulama gerekli"),
            @ApiResponse(responseCode = "403", description = "Bu panoda atama yapma yetkiniz yok"),
            @ApiResponse(responseCode = "409", description = "Bu atama zaten mevcut")
    })
    @PostMapping("/{memberId}/assignments")
    public ResponseEntity<BoardMemberModel> createAssignment(
            @Parameter(description = "Pano ID") @PathVariable Long boardId,
            @Parameter(description = "Üye ID") @PathVariable Long memberId,
            @Valid @RequestBody CreateAssignmentRequest request) {
        boardMemberService.createAssignment(boardId, memberId, request);
        // Güncel üye bilgilerini döndür
        BoardMemberResponse updatedMember = boardMemberService.getMembers(boardId).stream()
                .filter(m -> m.getId().equals(memberId))
                .findFirst()
                .orElseThrow();
        BoardMemberModel model = boardMemberAssembler.toModel(updatedMember);
        return ResponseEntity.status(HttpStatus.CREATED).body(model);
    }

    @Operation(summary = "Toplu atama yap", description = "Üyeye birden fazla liste/görev/alt görev atama yapar")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Atamalar yapıldı"),
            @ApiResponse(responseCode = "400", description = "Geçersiz istek"),
            @ApiResponse(responseCode = "401", description = "Kimlik doğrulama gerekli"),
            @ApiResponse(responseCode = "403", description = "Bu panoda atama yapma yetkiniz yok")
    })
    @PostMapping("/{memberId}/assignments/bulk")
    public ResponseEntity<BoardMemberModel> createBulkAssignment(
            @Parameter(description = "Pano ID") @PathVariable Long boardId,
            @Parameter(description = "Üye ID") @PathVariable Long memberId,
            @Valid @RequestBody BulkCreateAssignmentRequest request) {
        boardMemberService.createBulkAssignment(boardId, memberId, request);
        BoardMemberResponse updatedMember = boardMemberService.getMembers(boardId).stream()
                .filter(m -> m.getId().equals(memberId))
                .findFirst()
                .orElseThrow();
        BoardMemberModel model = boardMemberAssembler.toModel(updatedMember);
        return ResponseEntity.status(HttpStatus.CREATED).body(model);
    }

    @Operation(summary = "Atama kaldır", description = "Üyeden bir atamayı kaldırır")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Atama kaldırıldı"),
            @ApiResponse(responseCode = "401", description = "Kimlik doğrulama gerekli"),
            @ApiResponse(responseCode = "403", description = "Bu panoda atama kaldırma yetkiniz yok"),
            @ApiResponse(responseCode = "404", description = "Atama bulunamadı")
    })
    @DeleteMapping("/{memberId}/assignments/{assignmentId}")
    public ResponseEntity<Void> removeAssignment(
            @Parameter(description = "Pano ID") @PathVariable Long boardId,
            @Parameter(description = "Üye ID") @PathVariable Long memberId,
            @Parameter(description = "Atama ID") @PathVariable Long assignmentId) {
        boardMemberService.removeAssignment(boardId, memberId, assignmentId);
        return ResponseEntity.noContent().build();
    }
}
