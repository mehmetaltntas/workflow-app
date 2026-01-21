package com.workflow.backend.dto;

import lombok.Data;

@Data
public class UpdateProfileRequest {
    private String username;
    private String profilePicture; // Base64 encoded image
}
