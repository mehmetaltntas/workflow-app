package com.workflow.backend.dto;

import lombok.Data;

@Data
public class CreateBoardRequest {
    private String name;
    private String status; // Opsiyonel: Başlangıç statüsü
    private String link;
    private String description; // Opsiyonel açıklama (max 50 karakter)
    private java.time.LocalDateTime deadline;
    private Long userId; // Panoyu kim oluşturuyor?
}