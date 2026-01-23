package com.workflow.backend.dto;

import com.workflow.backend.validation.ValidPassword;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ResetPasswordRequest {

    @NotBlank(message = "Email adresi bos olamaz")
    @Email(message = "Gecerli bir email adresi giriniz")
    private String email;

    @NotBlank(message = "Dogrulama kodu bos olamaz")
    @Size(min = 6, max = 6, message = "Dogrulama kodu 6 haneli olmalidir")
    private String code;

    @NotBlank(message = "Yeni sifre bos olamaz")
    @ValidPassword
    private String newPassword;
}
