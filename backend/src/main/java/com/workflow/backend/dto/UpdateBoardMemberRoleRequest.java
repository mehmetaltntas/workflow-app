package com.workflow.backend.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateBoardMemberRoleRequest {
    @NotNull
    private String role;
}
