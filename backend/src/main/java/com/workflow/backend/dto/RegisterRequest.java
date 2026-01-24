package com.workflow.backend.dto;

import com.workflow.backend.validation.ValidPassword;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
@Schema(description = "Kullanıcı kayıt isteği")
public class RegisterRequest {

    @NotBlank(message = "Kullanıcı adı boş olamaz")
    @Size(min = 3, max = 50, message = "Kullanıcı adı 3-50 karakter arasında olmalıdır")
    @Schema(description = "Kullanıcı adı", example = "johndoe", requiredMode = Schema.RequiredMode.REQUIRED)
    private String username;

    @NotBlank(message = "Email adresi boş olamaz")
    @Email(message = "Geçerli bir email adresi giriniz")
    @Schema(description = "Email adresi", example = "john@example.com", requiredMode = Schema.RequiredMode.REQUIRED)
    private String email;

    @NotBlank(message = "Şifre boş olamaz")
    @ValidPassword
    @Schema(description = "Şifre (en az 8 karakter, büyük/küçük harf, rakam ve özel karakter)", example = "Password123!", requiredMode = Schema.RequiredMode.REQUIRED)
    private String password;
}
