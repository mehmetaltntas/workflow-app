package com.workflow.backend.hateoas.model;

import com.workflow.backend.entity.Priority;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.springframework.hateoas.RepresentationModel;
import org.springframework.hateoas.server.core.Relation;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@EqualsAndHashCode(callSuper = true)
@Relation(collectionRelation = "tasks", itemRelation = "task")
public class TaskModel extends RepresentationModel<TaskModel> {
    private Long id;
    private String title;
    private String description;
    private String link;
    private Boolean isCompleted;
    private LocalDateTime createdAt;
    private Integer position;
    private LocalDate dueDate;
    private Priority priority;
    private List<LabelModel> labels;
    private List<SubtaskModel> subtasks;
}
