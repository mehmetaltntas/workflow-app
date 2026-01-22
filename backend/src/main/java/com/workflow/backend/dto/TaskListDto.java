package com.workflow.backend.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;
import org.hibernate.validator.constraints.URL;

import java.util.List;

@Data
public class TaskListDto {
    private Long id;

    @Size(min = 1, max = 100, message = "Liste adı 1-100 karakter arasında olmalıdır")
    private String name;

    @URL(message = "Geçerli bir URL giriniz")
    private String link;

    private Boolean isCompleted;

    private List<TaskDto> tasks;
}
