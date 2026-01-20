package com.workflow.backend.dto;

import lombok.Data;

@Data
public class CreateTaskListRequest {
    private String name; // Örn: "Yapılacaklar"
    private String link;
    private Long boardId; // Hangi panoya eklenecek?
}