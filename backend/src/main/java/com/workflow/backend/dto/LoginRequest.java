package com.workflow.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
@Schema(description = "Kullanıcı giriş isteği")
public class LoginRequest {

    @NotBlank(message = "Kullanıcı adı boş olamaz")
    @Schema(description = "Kullanıcı adı", example = "johndoe", requiredMode = Schema.RequiredMode.REQUIRED)
    private String username;

    @NotBlank(message = "Şifre boş olamaz")
    @Schema(description = "Şifre", example = "Password123!", requiredMode = Schema.RequiredMode.REQUIRED)
    private String password;
}
