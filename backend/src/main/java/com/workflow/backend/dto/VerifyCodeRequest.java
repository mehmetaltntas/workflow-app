package com.workflow.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class VerifyCodeRequest {

    @NotBlank(message = "Email adresi bos olamaz")
    @Email(message = "Gecerli bir email adresi giriniz")
    private String email;

    @NotBlank(message = "Dogrulama kodu bos olamaz")
    @Size(min = 6, max = 6, message = "Dogrulama kodu 6 haneli olmalidir")
    private String code;
}
