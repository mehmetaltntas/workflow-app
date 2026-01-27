package com.workflow.backend.controller;

import com.workflow.backend.dto.BoardMemberDto;
import com.workflow.backend.hateoas.assembler.BoardMemberModelAssembler;
import com.workflow.backend.hateoas.model.BoardMemberModel;
import com.workflow.backend.service.BoardMemberService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.hateoas.CollectionModel;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/board-members/invitations")
@RequiredArgsConstructor
@Tag(name = "Board Member Invitations", description = "Pano üye davet işlemleri")
@SecurityRequirement(name = "bearerAuth")
public class BoardMemberInvitationController {

    private final BoardMemberService boardMemberService;
    private final BoardMemberModelAssembler boardMemberAssembler;

    @Operation(summary = "Bekleyen davetleri getir", description = "Giriş yapan kullanıcının bekleyen pano üyelik davetlerini listeler")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Bekleyen davetler getirildi"),
            @ApiResponse(responseCode = "401", description = "Kimlik doğrulama gerekli")
    })
    @GetMapping
    public ResponseEntity<CollectionModel<BoardMemberModel>> getPendingInvitations() {
        List<BoardMemberDto> pendingInvitations = boardMemberService.getPendingInvitations();
        List<BoardMemberModel> models = pendingInvitations.stream()
                .map(boardMemberAssembler::toModel)
                .collect(Collectors.toList());
        return ResponseEntity.ok(CollectionModel.of(models));
    }

    @Operation(summary = "Daveti kabul et", description = "Pano üyelik davetini kabul eder")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Davet kabul edildi"),
            @ApiResponse(responseCode = "401", description = "Kimlik doğrulama gerekli"),
            @ApiResponse(responseCode = "403", description = "Bu daveti kabul etme yetkiniz yok"),
            @ApiResponse(responseCode = "404", description = "Davet bulunamadı")
    })
    @PutMapping("/{memberId}/accept")
    public ResponseEntity<BoardMemberModel> acceptInvitation(
            @Parameter(description = "Üye ID") @PathVariable Long memberId) {
        BoardMemberDto result = boardMemberService.acceptMemberInvitation(memberId);
        BoardMemberModel model = boardMemberAssembler.toModel(result);
        return ResponseEntity.ok(model);
    }

    @Operation(summary = "Daveti reddet", description = "Pano üyelik davetini reddeder")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Davet reddedildi"),
            @ApiResponse(responseCode = "401", description = "Kimlik doğrulama gerekli"),
            @ApiResponse(responseCode = "403", description = "Bu daveti reddetme yetkiniz yok"),
            @ApiResponse(responseCode = "404", description = "Davet bulunamadı")
    })
    @PutMapping("/{memberId}/reject")
    public ResponseEntity<Void> rejectInvitation(
            @Parameter(description = "Üye ID") @PathVariable Long memberId) {
        boardMemberService.rejectMemberInvitation(memberId);
        return ResponseEntity.noContent().build();
    }
}
