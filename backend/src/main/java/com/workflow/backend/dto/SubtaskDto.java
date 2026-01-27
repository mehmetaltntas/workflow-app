package com.workflow.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SubtaskDto {
    private Long id;

    private Long version;

    @NotBlank(message = "Alt görev başlığı boş olamaz")
    @Size(min = 1, max = 200, message = "Alt görev başlığı 1-200 karakter arasında olmalıdır")
    private String title;

    private Boolean isCompleted;
    private Integer position;

    @Size(max = 1000, message = "Açıklama en fazla 1000 karakter olabilir")
    private String description;

    @Size(max = 500, message = "Link en fazla 500 karakter olabilir")
    private String link;
}
