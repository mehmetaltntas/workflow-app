package com.workflow.backend.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AddBoardMemberRequest {
    @NotNull
    private Long userId;
}
