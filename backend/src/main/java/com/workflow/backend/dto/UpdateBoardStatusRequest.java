package com.workflow.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
@Schema(description = "Pano durumu güncelleme isteği")
public class UpdateBoardStatusRequest {

    @NotBlank(message = "Durum boş olamaz")
    @Pattern(regexp = "PLANLANDI|DEVAM_EDIYOR|TAMAMLANDI|DURDURULDU|BIRAKILDI",
             message = "Geçersiz pano durumu")
    @Schema(description = "Yeni pano durumu", example = "DEVAM_EDIYOR",
            allowableValues = {"PLANLANDI", "DEVAM_EDIYOR", "TAMAMLANDI", "DURDURULDU", "BIRAKILDI"})
    private String status;
}
