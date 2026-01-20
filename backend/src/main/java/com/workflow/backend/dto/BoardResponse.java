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
    private java.time.LocalDateTime deadline;
    private List<TaskListDto> taskLists; // YENİ EKLENDİ: Panodaki listeler
}