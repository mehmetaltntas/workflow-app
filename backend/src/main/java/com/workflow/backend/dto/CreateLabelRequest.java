package com.workflow.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
@Schema(description = "Etiket oluşturma isteği")
public class CreateLabelRequest {

    @NotBlank(message = "Etiket adı boş olamaz")
    @Size(min = 1, max = 30, message = "Etiket adı 1-30 karakter arasında olmalıdır")
    @Schema(description = "Etiket adı", example = "Acil", requiredMode = Schema.RequiredMode.REQUIRED)
    private String name;

    @NotBlank(message = "Renk boş olamaz")
    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Geçerli bir hex renk kodu giriniz (örn: #ff5733)")
    @Schema(description = "Hex renk kodu", example = "#ff5733", requiredMode = Schema.RequiredMode.REQUIRED)
    private String color;

    @NotNull(message = "Board ID boş olamaz")
    @Schema(description = "Etiketin ekleneceği pano ID", example = "1", requiredMode = Schema.RequiredMode.REQUIRED)
    private Long boardId;
}
