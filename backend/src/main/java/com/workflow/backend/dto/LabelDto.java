package com.workflow.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class LabelDto {
    private Long id;

    @NotBlank(message = "Etiket adı boş olamaz")
    @Size(min = 1, max = 30, message = "Etiket adı 1-30 karakter arasında olmalıdır")
    private String name;

    @NotBlank(message = "Renk boş olamaz")
    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Geçerli bir hex renk kodu giriniz (örn: #ff5733)")
    private String color;
}
