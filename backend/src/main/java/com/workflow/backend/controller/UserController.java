package com.workflow.backend.controller;

import com.workflow.backend.dto.UpdatePasswordRequest;
import com.workflow.backend.dto.UpdateProfileRequest;
import com.workflow.backend.dto.UserResponse;
import com.workflow.backend.hateoas.assembler.UserModelAssembler;
import com.workflow.backend.hateoas.model.UserModel;
import com.workflow.backend.service.UserService;
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
import org.springframework.hateoas.RepresentationModel;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.*;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "Kullanıcı profil işlemleri")
@SecurityRequirement(name = "bearerAuth")
public class UserController {

    private final UserService userService;
    private final UserModelAssembler userAssembler;

    @Operation(summary = "Kullanıcı bilgilerini getir", description = "Belirtilen kullanıcının profil bilgilerini getirir")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Kullanıcı bilgileri başarıyla getirildi",
                    content = @Content(schema = @Schema(implementation = UserModel.class))),
            @ApiResponse(responseCode = "401", description = "Kimlik doğrulama gerekli"),
            @ApiResponse(responseCode = "403", description = "Bu kullanıcının bilgilerine erişim yetkiniz yok"),
            @ApiResponse(responseCode = "404", description = "Kullanıcı bulunamadı")
    })
    @GetMapping("/{id}")
    public ResponseEntity<UserModel> getUser(
            @Parameter(description = "Kullanıcı ID") @PathVariable Long id) {
        UserResponse user = userService.getUserById(id);
        UserModel model = userAssembler.toModel(user);
        return ResponseEntity.ok(model);
    }

    @Operation(summary = "Profil güncelle", description = "Kullanıcının profil bilgilerini (kullanıcı adı, profil resmi) günceller")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Profil güncellendi",
                    content = @Content(schema = @Schema(implementation = UserModel.class))),
            @ApiResponse(responseCode = "400", description = "Geçersiz istek veya kullanıcı adı zaten kullanılıyor"),
            @ApiResponse(responseCode = "401", description = "Kimlik doğrulama gerekli"),
            @ApiResponse(responseCode = "403", description = "Bu profili güncelleme yetkiniz yok"),
            @ApiResponse(responseCode = "404", description = "Kullanıcı bulunamadı")
    })
    @PutMapping("/{id}/profile")
    public ResponseEntity<UserModel> updateProfile(
            @Parameter(description = "Kullanıcı ID") @PathVariable Long id,
            @Valid @RequestBody UpdateProfileRequest request) {
        UserResponse updated = userService.updateProfile(id, request);
        UserModel model = userAssembler.toModel(updated);
        return ResponseEntity.ok(model);
    }

    @Operation(summary = "Şifre güncelle", description = "Kullanıcının şifresini günceller (mevcut şifre doğrulaması gerekir)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Şifre güncellendi"),
            @ApiResponse(responseCode = "400", description = "Geçersiz istek veya mevcut şifre hatalı"),
            @ApiResponse(responseCode = "401", description = "Kimlik doğrulama gerekli"),
            @ApiResponse(responseCode = "403", description = "Bu kullanıcının şifresini güncelleme yetkiniz yok"),
            @ApiResponse(responseCode = "404", description = "Kullanıcı bulunamadı")
    })
    @PutMapping("/{id}/password")
    public ResponseEntity<RepresentationModel<?>> updatePassword(
            @Parameter(description = "Kullanıcı ID") @PathVariable Long id,
            @Valid @RequestBody UpdatePasswordRequest request) {
        userService.updatePassword(id, request);

        RepresentationModel<?> response = new RepresentationModel<>();
        response.add(linkTo(methodOn(UserController.class).getUser(id)).withRel("user"));
        response.add(linkTo(methodOn(UserController.class).updateProfile(id, null)).withRel("update-profile"));

        return ResponseEntity.ok(response);
    }
}
