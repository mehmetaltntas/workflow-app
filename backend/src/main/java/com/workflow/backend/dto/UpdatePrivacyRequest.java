package com.workflow.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
@Schema(description = "Gizlilik ayari guncelleme")
public class UpdatePrivacyRequest {

    @NotNull(message = "isProfilePublic alani bos olamaz")
    @Schema(description = "Profil herkese acik mi", example = "true", requiredMode = Schema.RequiredMode.REQUIRED)
    private Boolean isProfilePublic;
}
