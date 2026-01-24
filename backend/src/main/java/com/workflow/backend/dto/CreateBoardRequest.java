package com.workflow.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.hibernate.validator.constraints.URL;

@Data
@Schema(description = "Pano oluşturma/güncelleme isteği")
public class CreateBoardRequest {

    @NotBlank(message = "Pano adı boş olamaz")
    @Size(min = 1, max = 100, message = "Pano adı 1-100 karakter arasında olmalıdır")
    @Schema(description = "Pano adı", example = "Proje Yönetimi", requiredMode = Schema.RequiredMode.REQUIRED)
    private String name;

    @Schema(description = "Pano durumu", example = "PLANLANDI", allowableValues = {"PLANLANDI", "DEVAM EDIYOR", "TAMAMLANDI"})
    private String status;

    @URL(message = "Geçerli bir URL giriniz")
    @Schema(description = "İlgili link", example = "https://github.com/project")
    private String link;

    @Size(max = 105, message = "Açıklama en fazla 105 karakter olabilir")
    @Schema(description = "Pano açıklaması", example = "Bu pano proje yönetimi için kullanılacak")
    private String description;

    @Schema(description = "Son tarih", example = "2024-12-31T23:59:59")
    private java.time.LocalDateTime deadline;

    @NotNull(message = "Kullanıcı ID boş olamaz")
    @Schema(description = "Kullanıcı ID", example = "1", requiredMode = Schema.RequiredMode.REQUIRED)
    private Long userId;
}
