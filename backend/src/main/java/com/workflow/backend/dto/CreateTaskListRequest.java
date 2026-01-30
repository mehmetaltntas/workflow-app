package com.workflow.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.hibernate.validator.constraints.URL;

import java.time.LocalDate;
import java.util.List;

@Data
public class CreateTaskListRequest {

    @NotBlank(message = "Liste adı boş olamaz")
    @Size(min = 1, max = 25, message = "Liste adı 1-25 karakter arasında olmalıdır")
    private String name;

    @Size(max = 100, message = "Açıklama en fazla 100 karakter olabilir")
    private String description;

    @URL(message = "Geçerli bir URL giriniz")
    private String link;

    @NotNull(message = "Pano ID boş olamaz")
    private Long boardId;

    private LocalDate dueDate;

    @Pattern(regexp = "HIGH|MEDIUM|LOW|NONE", message = "Öncelik HIGH, MEDIUM, LOW veya NONE olmalı")
    private String priority; // HIGH, MEDIUM, LOW, NONE

    private List<Long> labelIds;
}
