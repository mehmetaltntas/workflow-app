package com.workflow.backend.controller;

import com.workflow.backend.dto.*;
import com.workflow.backend.hateoas.assembler.UserModelAssembler;
import com.workflow.backend.hateoas.assembler.UserProfileModelAssembler;
import com.workflow.backend.hateoas.assembler.UserSearchModelAssembler;
import com.workflow.backend.hateoas.model.UserModel;
import com.workflow.backend.hateoas.model.UserProfileModel;
import com.workflow.backend.hateoas.model.UserSearchModel;
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
import org.springframework.hateoas.CollectionModel;
import org.springframework.hateoas.RepresentationModel;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.*;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "Kullanıcı profil işlemleri")
@SecurityRequirement(name = "bearerAuth")
public class UserController {

    private final UserService userService;
    private final UserModelAssembler userAssembler;
    private final UserSearchModelAssembler userSearchAssembler;
    private final UserProfileModelAssembler userProfileAssembler;

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

    @Operation(summary = "Kullanici ara", description = "Username ile kullanici arar (min 2 karakter)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Arama sonuclari"),
            @ApiResponse(responseCode = "401", description = "Kimlik dogrulama gerekli")
    })
    @GetMapping("/search")
    public ResponseEntity<CollectionModel<UserSearchModel>> searchUsers(
            @Parameter(description = "Arama sorgusu") @RequestParam("q") String query) {
        if (query == null || query.trim().length() < 2) {
            return ResponseEntity.ok(CollectionModel.empty());
        }
        List<UserSearchResponse> results = userService.searchUsers(query.trim());
        List<UserSearchModel> models = results.stream()
                .map(userSearchAssembler::toModel)
                .collect(Collectors.toList());
        return ResponseEntity.ok(CollectionModel.of(models));
    }

    @Operation(summary = "Kullanici profilini goruntule", description = "Username ile baska bir kullanicinin profilini getirir")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Profil bilgileri"),
            @ApiResponse(responseCode = "401", description = "Kimlik dogrulama gerekli"),
            @ApiResponse(responseCode = "404", description = "Kullanici bulunamadi")
    })
    @GetMapping("/profile/{username}")
    public ResponseEntity<UserProfileModel> getUserProfile(
            @Parameter(description = "Kullanici adi") @PathVariable String username) {
        UserProfileResponse result = userService.getUserProfile(username);
        UserProfileModel model = userProfileAssembler.toModel(result);
        return ResponseEntity.ok(model);
    }

    @Operation(summary = "Kullanici profil istatistiklerini getir", description = "Bagli veya herkese acik profildeki kullanicinin istatistiklerini getirir")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Istatistikler basariyla getirildi",
                    content = @Content(schema = @Schema(implementation = UserProfileStatsResponse.class))),
            @ApiResponse(responseCode = "401", description = "Kimlik dogrulama gerekli"),
            @ApiResponse(responseCode = "403", description = "Bu kullanicinin istatistiklerine erisim yetkiniz yok"),
            @ApiResponse(responseCode = "404", description = "Kullanici bulunamadi")
    })
    @GetMapping("/profile/{username}/stats")
    public ResponseEntity<UserProfileStatsResponse> getUserProfileStats(
            @Parameter(description = "Kullanici adi") @PathVariable String username) {
        UserProfileStatsResponse stats = userService.getUserProfileStats(username);
        return ResponseEntity.ok(stats);
    }

    @Operation(summary = "Gizlilik ayarini guncelle", description = "Kullanicinin profil gizlilik ayarini gunceller")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Gizlilik ayari guncellendi"),
            @ApiResponse(responseCode = "401", description = "Kimlik dogrulama gerekli"),
            @ApiResponse(responseCode = "403", description = "Yetki yok")
    })
    @PutMapping("/{id}/privacy")
    public ResponseEntity<Void> updatePrivacy(
            @Parameter(description = "Kullanici ID") @PathVariable Long id,
            @Valid @RequestBody UpdatePrivacyRequest request) {
        userService.updatePrivacy(id, request);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "Hesap silme zamanlama", description = "Kullanicinin hesabini 30 gun sonra silinmek uzere zamanlar")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Silme zamanlamasi yapildi",
                    content = @Content(schema = @Schema(implementation = UserModel.class))),
            @ApiResponse(responseCode = "401", description = "Kimlik dogrulama gerekli"),
            @ApiResponse(responseCode = "403", description = "Yetki yok"),
            @ApiResponse(responseCode = "404", description = "Kullanici bulunamadi")
    })
    @PostMapping("/{id}/schedule-deletion")
    public ResponseEntity<UserModel> scheduleDeletion(
            @Parameter(description = "Kullanici ID") @PathVariable Long id) {
        UserResponse result = userService.scheduleDeletion(id);
        UserModel model = userAssembler.toModel(result);
        return ResponseEntity.ok(model);
    }

    @Operation(summary = "Hesap silme iptal", description = "Zamanlanmis hesap silme islemini iptal eder")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Silme iptali basarili",
                    content = @Content(schema = @Schema(implementation = UserModel.class))),
            @ApiResponse(responseCode = "401", description = "Kimlik dogrulama gerekli"),
            @ApiResponse(responseCode = "403", description = "Yetki yok"),
            @ApiResponse(responseCode = "404", description = "Kullanici bulunamadi")
    })
    @PostMapping("/{id}/cancel-deletion")
    public ResponseEntity<UserModel> cancelDeletion(
            @Parameter(description = "Kullanici ID") @PathVariable Long id) {
        UserResponse result = userService.cancelDeletion(id);
        UserModel model = userAssembler.toModel(result);
        return ResponseEntity.ok(model);
    }
}
