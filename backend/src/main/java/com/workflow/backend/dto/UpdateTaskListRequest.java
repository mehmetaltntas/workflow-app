package com.workflow.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.hibernate.validator.constraints.URL;

import java.time.LocalDate;
import java.util.List;

@Data
@Schema(description = "Liste güncelleme isteği")
public class UpdateTaskListRequest {

    @Size(min = 1, max = 100, message = "Liste adı 1-100 karakter arasında olmalıdır")
    @Schema(description = "Liste adı")
    private String name;

    @Size(max = 100, message = "Açıklama en fazla 100 karakter olabilir")
    @Schema(description = "Açıklama")
    private String description;

    @URL(message = "Geçerli bir URL giriniz")
    @Schema(description = "İlgili link")
    private String link;

    @Schema(description = "Tamamlanma durumu")
    private Boolean isCompleted;

    @Schema(description = "Son tarih")
    private LocalDate dueDate;

    @Pattern(regexp = "HIGH|MEDIUM|LOW|NONE", message = "Öncelik HIGH, MEDIUM, LOW veya NONE olmalı")
    @Schema(description = "Öncelik seviyesi")
    private String priority;

    @Schema(description = "Güncelleme için etiket ID listesi")
    private List<Long> labelIds;
}
