package com.workflow.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SendVerificationCodeRequest {

    @NotBlank(message = "Kullanici adi bos olamaz")
    @Size(min = 3, max = 30, message = "Kullanici adi 3-30 karakter arasinda olmalidir")
    @Pattern(regexp = "^(?!\\.)(?!.*\\.$)(?!.*\\.\\.)[a-zA-Z0-9._]+$",
            message = "Kullanici adi sadece harf, rakam, nokta ve alt tire icerebilir")
    private String username;

    @NotBlank(message = "Email adresi bos olamaz")
    @Email(message = "Gecerli bir email adresi giriniz")
    private String email;
}
