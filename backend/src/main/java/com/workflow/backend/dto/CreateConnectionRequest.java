package com.workflow.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
@Schema(description = "Baglanti istegi gonderme")
public class CreateConnectionRequest {

    @NotNull(message = "Hedef kullanici ID bos olamaz")
    @Schema(description = "Baglanti istegi gonderilecek kullanici ID", example = "2", requiredMode = Schema.RequiredMode.REQUIRED)
    private Long targetUserId;
}
