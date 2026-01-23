package com.workflow.backend.hateoas.model;

import lombok.Data;
import lombok.EqualsAndHashCode;
import org.springframework.hateoas.RepresentationModel;
import org.springframework.hateoas.server.core.Relation;

import java.util.List;

@Data
@EqualsAndHashCode(callSuper = true)
@Relation(collectionRelation = "taskLists", itemRelation = "taskList")
public class TaskListModel extends RepresentationModel<TaskListModel> {
    private Long id;
    private String name;
    private String link;
    private Boolean isCompleted;
    private List<TaskModel> tasks;
}
