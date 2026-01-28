package com.workflow.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Schema(description = "Kullanıcı bilgileri yanıtı")
public class UserResponse {

    @Schema(description = "Kullanıcı ID", example = "1")
    private Long id;

    @Schema(description = "Kullanıcı adı", example = "johndoe")
    private String username;

    @Schema(description = "Email adresi", example = "john@example.com")
    private String email;

    @Schema(description = "Kullanıcının adı", example = "Mehmet")
    private String firstName;

    @Schema(description = "Kullanıcının soyadı", example = "Altıntaş")
    private String lastName;

    @Schema(description = "Profil resmi (Base64 encoded)")
    private String profilePicture;

    @Schema(description = "Access Token (15 dakika geçerli)")
    private String token;

    @Schema(description = "Refresh Token (7 gün geçerli)")
    private String refreshToken;

    @Schema(description = "Hesap silme zamanlama tarihi")
    private LocalDateTime deletionScheduledAt;
}
