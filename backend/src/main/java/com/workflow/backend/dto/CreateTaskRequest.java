package com.workflow.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.hibernate.validator.constraints.URL;

@Data
public class CreateTaskRequest {

    @NotBlank(message = "Görev başlığı boş olamaz")
    @Size(min = 1, max = 200, message = "Görev başlığı 1-200 karakter arasında olmalıdır")
    private String title;

    @Size(max = 500, message = "Açıklama en fazla 500 karakter olabilir")
    private String description;

    @URL(message = "Geçerli bir URL giriniz")
    private String link;

    @NotNull(message = "Liste ID boş olamaz")
    private Long taskListId;
}
