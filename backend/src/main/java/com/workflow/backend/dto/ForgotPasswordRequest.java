package com.workflow.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ForgotPasswordRequest {

    @NotBlank(message = "Kullanici adi veya email adresi bos olamaz")
    private String usernameOrEmail;
}
