package com.workflow.backend.dto;

import lombok.Data;

@Data
public class UserResponse {
    private Long id;
    private String username;
    private String email;
    private String token; // YENİ ALAN
}