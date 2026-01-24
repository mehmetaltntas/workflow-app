package com.workflow.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateSubtaskRequest {

    @NotBlank(message = "Alt görev başlığı boş olamaz")
    @Size(min = 1, max = 200, message = "Alt görev başlığı 1-200 karakter arasında olmalıdır")
    private String title;

    @NotNull(message = "Görev ID boş olamaz")
    private Long taskId;

    @Size(max = 1000, message = "Açıklama en fazla 1000 karakter olabilir")
    private String description;

    @Size(max = 500, message = "Link en fazla 500 karakter olabilir")
    private String link;
}
