package com.workflow.backend.hateoas.model;

import lombok.Data;
import lombok.EqualsAndHashCode;
import org.springframework.hateoas.RepresentationModel;
import org.springframework.hateoas.server.core.Relation;

@Data
@EqualsAndHashCode(callSuper = true)
@Relation(collectionRelation = "subtasks", itemRelation = "subtask")
public class SubtaskModel extends RepresentationModel<SubtaskModel> {
    private Long id;
    private Long version;
    private String title;
    private Boolean isCompleted;
    private Integer position;
    private String description;
    private String link;
}
