package com.workflow.backend.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class BulkCreateAssignmentRequest {
    @NotEmpty(message = "En az bir atama gereklidir")
    @Valid
    private List<CreateAssignmentRequest> assignments;
}
