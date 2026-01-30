package com.workflow.backend.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class CreateAssignmentRequest {
    @NotNull(message = "Hedef tipi zorunludur")
    @Pattern(regexp = "LIST|TASK|SUBTASK", message = "Hedef tipi LIST, TASK veya SUBTASK olmalı")
    private String targetType;

    @NotNull(message = "Hedef ID zorunludur")
    private Long targetId;
}
