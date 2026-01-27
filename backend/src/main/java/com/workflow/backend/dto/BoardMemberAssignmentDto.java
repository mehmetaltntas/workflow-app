package com.workflow.backend.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class BoardMemberAssignmentDto {
    private Long id;
    private String targetType;
    private Long targetId;
    private String targetName;
    private LocalDateTime createdAt;
}
