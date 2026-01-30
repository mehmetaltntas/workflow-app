package com.workflow.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
@Schema(description = "Etiket güncelleme isteği")
public class UpdateLabelRequest {

    @Size(min = 1, max = 30, message = "Etiket adı 1-30 karakter arasında olmalıdır")
    @Schema(description = "Etiket adı")
    private String name;

    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Geçerli bir hex renk kodu giriniz (örn: #ff5733)")
    @Schema(description = "Hex renk kodu")
    private String color;
}
