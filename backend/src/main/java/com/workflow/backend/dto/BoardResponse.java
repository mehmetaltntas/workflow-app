package com.workflow.backend.dto;

import lombok.Data;
import java.util.List;

@Data
public class BoardResponse {
    private Long id;
    private String name;
    private String ownerName;
    private String status;
    private String slug; // YENİ EKLENDİ
    private String link;
    private String description; // Opsiyonel açıklama
    private String category; // Pano kategorisi
    private java.time.LocalDateTime deadline;
    private java.time.LocalDateTime createdAt; // Oluşturulma tarihi
    private List<TaskListDto> taskLists; // YENİ EKLENDİ: Panodaki listeler
    private List<LabelDto> labels; // Panoya ait etiketler
}