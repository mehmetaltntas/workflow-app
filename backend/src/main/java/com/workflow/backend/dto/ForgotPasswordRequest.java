package com.workflow.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ForgotPasswordRequest {

    @NotBlank(message = "Email adresi bos olamaz")
    @Email(message = "Gecerli bir email adresi giriniz")
    private String email;
}
