package com.workflow.backend.dto;

import lombok.Data;

@Data
public class CreateTaskRequest {
    private String title;
    private String description;
    private String link;
    private Long taskListId; // Hangi sütuna eklenecek?
}