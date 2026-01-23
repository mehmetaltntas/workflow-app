package com.workflow.backend.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;
import org.hibernate.validator.constraints.URL;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class TaskListDto {
    private Long id;

    @Size(min = 1, max = 100, message = "Liste adı 1-100 karakter arasında olmalıdır")
    private String name;

    @Size(max = 500, message = "Açıklama en fazla 500 karakter olabilir")
    private String description;

    @URL(message = "Geçerli bir URL giriniz")
    private String link;

    private Boolean isCompleted;

    private LocalDate dueDate;

    private String priority; // HIGH, MEDIUM, LOW, NONE

    private LocalDateTime createdAt;

    private List<Long> labelIds; // Etiket ID'leri (create/update için)

    private List<LabelDto> labels; // Etiketler (response için)

    private List<TaskDto> tasks;
}
