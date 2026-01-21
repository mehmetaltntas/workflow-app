package com.workflow.backend.dto;

import lombok.Data;
import java.util.List;

@Data
public class TaskListDto {
    private Long id;
    private String name;
    private String link;
    private Boolean isCompleted;
    private List<TaskDto> tasks; // Listenin içindeki görevler
}