package com.workflow.backend.dto;

import lombok.Data;

@Data
public class UpdatePasswordRequest {
    private String currentPassword;
    private String newPassword;
}
