package com.workflow.backend.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;
import org.hibernate.validator.constraints.URL;

import com.workflow.backend.entity.Priority;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class TaskDto {
    private Long id;

    @Size(min = 1, max = 200, message = "Görev başlığı 1-200 karakter arasında olmalıdır")
    private String title;

    @Size(max = 500, message = "Açıklama en fazla 500 karakter olabilir")
    private String description;

    @URL(message = "Geçerli bir URL giriniz")
    private String link;

    private Boolean isCompleted;
    private LocalDateTime createdAt;
    private Integer position;
    private LocalDate dueDate; // Son tarih (deadline)
    private Priority priority; // Öncelik seviyesi
    private List<LabelDto> labels; // Görevin etiketleri
    private List<Long> labelIds; // Güncelleme için etiket ID'leri
    private List<SubtaskDto> subtasks; // Alt görevler
}
