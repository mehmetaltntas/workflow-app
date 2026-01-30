package com.workflow.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.hibernate.validator.constraints.URL;

import com.workflow.backend.entity.Priority;

import java.time.LocalDate;
import java.util.List;

@Data
@Schema(description = "Görev güncelleme isteği")
public class UpdateTaskRequest {

    @Size(min = 1, max = 200, message = "Görev başlığı 1-200 karakter arasında olmalıdır")
    @Schema(description = "Görev başlığı", example = "API entegrasyonu yap")
    private String title;

    @Size(max = 500, message = "Açıklama en fazla 500 karakter olabilir")
    @Schema(description = "Görev açıklaması")
    private String description;

    @URL(message = "Geçerli bir URL giriniz")
    @Schema(description = "İlgili link")
    private String link;

    @Schema(description = "Tamamlanma durumu")
    private Boolean isCompleted;

    @Schema(description = "Son tarih")
    private LocalDate dueDate;

    @Schema(description = "Öncelik seviyesi")
    private Priority priority;

    @Schema(description = "Güncelleme için etiket ID listesi")
    private List<Long> labelIds;
}
