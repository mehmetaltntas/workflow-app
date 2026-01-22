package com.workflow.backend.dto;

import lombok.Data;

@Data
public class UserResponse {
    private Long id;
    private String username;
    private String email;
    private String profilePicture; // Base64 encoded image
    private String token; // Access Token (kısa süreli - 15 dk)
    private String refreshToken; // Refresh Token (uzun süreli - 7 gün)
}