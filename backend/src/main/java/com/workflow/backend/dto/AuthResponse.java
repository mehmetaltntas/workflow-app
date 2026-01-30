package com.workflow.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "Kimlik doğrulama yanıtı")
public class AuthResponse {

    @Schema(description = "Kullanıcı bilgileri")
    private UserResponse user;

    @Schema(description = "Access Token (15 dakika geçerli)")
    private String token;

    @Schema(description = "Refresh Token (7 gün geçerli)")
    private String refreshToken;
}
