package com.workflow.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
@Schema(description = "Etiket bilgileri")
public class LabelDto {

    @Schema(description = "Etiket ID", example = "1")
    private Long id;

    @NotBlank(message = "Etiket adı boş olamaz")
    @Size(min = 1, max = 30, message = "Etiket adı 1-30 karakter arasında olmalıdır")
    @Schema(description = "Etiket adı", example = "Acil")
    private String name;

    @NotBlank(message = "Renk boş olamaz")
    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Geçerli bir hex renk kodu giriniz (örn: #ff5733)")
    @Schema(description = "Hex renk kodu", example = "#ff5733")
    private String color;

    @Schema(description = "Varsayılan etiket mi (varsayılanlar silinemez)", example = "false")
    private Boolean isDefault = false;
}
