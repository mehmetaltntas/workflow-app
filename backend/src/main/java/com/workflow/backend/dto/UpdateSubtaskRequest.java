package com.workflow.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
@Schema(description = "Alt görev güncelleme isteği")
public class UpdateSubtaskRequest {

    @Size(min = 1, max = 200, message = "Alt görev başlığı 1-200 karakter arasında olmalıdır")
    @Schema(description = "Alt görev başlığı")
    private String title;

    @Schema(description = "Tamamlanma durumu")
    private Boolean isCompleted;

    @Size(max = 100, message = "Açıklama en fazla 100 karakter olabilir")
    @Schema(description = "Açıklama")
    private String description;

    @Size(max = 500, message = "Link en fazla 500 karakter olabilir")
    @Schema(description = "Link")
    private String link;
}
