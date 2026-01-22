package com.workflow.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.hibernate.validator.constraints.URL;

@Data
public class CreateTaskListRequest {

    @NotBlank(message = "Liste adı boş olamaz")
    @Size(min = 1, max = 100, message = "Liste adı 1-100 karakter arasında olmalıdır")
    private String name;

    @URL(message = "Geçerli bir URL giriniz")
    private String link;

    @NotNull(message = "Pano ID boş olamaz")
    private Long boardId;
}
