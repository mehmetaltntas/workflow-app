package com.workflow.backend.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class BoardMemberDto {
    private Long id;
    private Long userId;
    private String username;
    private String profilePicture;
    private LocalDateTime createdAt;
    private List<BoardMemberAssignmentDto> assignments;
}
