package com.workflow.backend.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateAssignmentRequest {
    @NotNull
    private String targetType;

    @NotNull
    private Long targetId;
}
