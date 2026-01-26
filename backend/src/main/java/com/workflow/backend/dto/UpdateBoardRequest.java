package com.workflow.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.hibernate.validator.constraints.URL;

@Data
@Schema(description = "Pano güncelleme isteği")
public class UpdateBoardRequest {

    @Size(min = 1, max = 25, message = "Pano adı 1-25 karakter arasında olmalıdır")
    @Schema(description = "Pano adı", example = "Proje Yönetimi")
    private String name;

    @Schema(description = "Pano durumu", example = "PLANLANDI", allowableValues = {"PLANLANDI", "DEVAM EDIYOR", "TAMAMLANDI", "DURDURULDU", "BIRAKILDI"})
    private String status;

    @URL(message = "Geçerli bir URL giriniz")
    @Schema(description = "İlgili link", example = "https://github.com/project")
    private String link;

    @Size(max = 200, message = "Açıklama en fazla 200 karakter olabilir")
    @Schema(description = "Pano açıklaması", example = "Bu pano proje yönetimi için kullanılacak")
    private String description;

    @Schema(description = "Son tarih", example = "2024-12-31T23:59:59")
    private java.time.LocalDateTime deadline;

    @Schema(description = "Pano kategorisi", example = "YAZILIM_GELISTIRME")
    private String category;
}
