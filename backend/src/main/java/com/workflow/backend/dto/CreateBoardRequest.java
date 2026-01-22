package com.workflow.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.hibernate.validator.constraints.URL;

@Data
public class CreateBoardRequest {

    @NotBlank(message = "Pano adı boş olamaz")
    @Size(min = 1, max = 100, message = "Pano adı 1-100 karakter arasında olmalıdır")
    private String name;

    private String status; // Opsiyonel: Başlangıç statüsü

    @URL(message = "Geçerli bir URL giriniz")
    private String link;

    @Size(max = 105, message = "Açıklama en fazla 105 karakter olabilir")
    private String description;

    private java.time.LocalDateTime deadline;

    @NotNull(message = "Kullanıcı ID boş olamaz")
    private Long userId;
}
