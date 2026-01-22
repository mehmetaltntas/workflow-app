package com.workflow.backend.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateProfileRequest {

    @Size(min = 3, max = 50, message = "Kullanıcı adı 3-50 karakter arasında olmalıdır")
    private String username;

    @Size(max = 2097152, message = "Profil resmi en fazla 2MB olabilir") // ~2MB base64
    private String profilePicture;
}
