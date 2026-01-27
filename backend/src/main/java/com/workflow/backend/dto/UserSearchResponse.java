package com.workflow.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "Kullanici arama sonucu")
public class UserSearchResponse {

    @Schema(description = "Kullanici ID", example = "1")
    private Long id;

    @Schema(description = "Kullanici adi", example = "johndoe")
    private String username;

    @Schema(description = "Profil resmi (Base64 encoded)")
    private String profilePicture;
}
