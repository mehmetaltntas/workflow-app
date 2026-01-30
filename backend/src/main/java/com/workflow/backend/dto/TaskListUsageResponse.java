package com.workflow.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class TaskListUsageResponse {
    private Long id;
    private String name;
}
