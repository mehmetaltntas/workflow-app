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

    @Size(min = 1, max = 50, message = "İsim 1-50 karakter arasında olmalıdır")
    private String firstName;

    @Size(min = 1, max = 50, message = "Soyisim 1-50 karakter arasında olmalıdır")
    private String lastName;

    @Size(max = 2097152, message = "Profil resmi en fazla 2MB olabilir") // ~2MB base64
    private String profilePicture;
}
