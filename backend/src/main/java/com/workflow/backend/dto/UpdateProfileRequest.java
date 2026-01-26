package com.workflow.backend.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateProfileRequest {

    @Size(min = 3, max = 30, message = "Kullanıcı adı 3-30 karakter arasında olmalıdır")
    @Pattern(regexp = "^(?!\\.)(?!.*\\.$)(?!.*\\.\\.)[a-zA-Z0-9._]+$",
            message = "Kullanıcı adı sadece harf, rakam, nokta ve alt tire içerebilir. Nokta ile başlayamaz/bitemez ve ardışık nokta kullanılamaz")
    private String username;

    @Size(max = 2097152, message = "Profil resmi en fazla 2MB olabilir") // ~2MB base64
    private String profilePicture;
}
