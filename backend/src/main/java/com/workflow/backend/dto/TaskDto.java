package com.workflow.backend.dto;

import lombok.Data;

@Data
public class TaskDto {
    private Long id;
    private String title;
    private String description;
    private String link;
    private Boolean isCompleted;
    private java.time.LocalDateTime createdAt;
    private Integer position;
}