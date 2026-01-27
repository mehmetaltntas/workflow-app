package com.workflow.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.hibernate.validator.constraints.URL;

import com.workflow.backend.entity.Priority;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Schema(description = "Görev bilgileri")
public class TaskDto {

    @Schema(description = "Görev ID", example = "1")
    private Long id;

    @Schema(description = "Optimistic locking için versiyon numarası", example = "0")
    private Long version;

    @Size(min = 1, max = 200, message = "Görev başlığı 1-200 karakter arasında olmalıdır")
    @Schema(description = "Görev başlığı", example = "API entegrasyonu yap")
    private String title;

    @Size(max = 500, message = "Açıklama en fazla 500 karakter olabilir")
    @Schema(description = "Görev açıklaması", example = "REST API ile veri çekme işlemi")
    private String description;

    @URL(message = "Geçerli bir URL giriniz")
    @Schema(description = "İlgili link", example = "https://docs.api.com")
    private String link;

    @Schema(description = "Tamamlanma durumu", example = "false")
    private Boolean isCompleted;

    @Schema(description = "Oluşturulma tarihi")
    private LocalDateTime createdAt;

    @Schema(description = "Liste içindeki sıra", example = "0")
    private Integer position;

    @Schema(description = "Son tarih", example = "2024-12-31")
    private LocalDate dueDate;

    @Schema(description = "Öncelik seviyesi", example = "HIGH")
    private Priority priority;

    @Schema(description = "Görevin etiketleri")
    private List<LabelDto> labels;

    @Schema(description = "Güncelleme için etiket ID listesi", example = "[1, 2, 3]")
    private List<Long> labelIds;

    @Schema(description = "Alt görevler")
    private List<SubtaskDto> subtasks;
}
