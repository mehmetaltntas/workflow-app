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
@Relation(collectionRelation = "taskLists", itemRelation = "taskList")
public class TaskListModel extends RepresentationModel<TaskListModel> {
    private Long id;
    private Long version;
    private String name;
    private String description;
    private String link;
    private Boolean isCompleted;
    private LocalDate dueDate;
    private Priority priority;
    private LocalDateTime createdAt;
    private List<LabelModel> labels;
    private List<TaskModel> tasks;
}
