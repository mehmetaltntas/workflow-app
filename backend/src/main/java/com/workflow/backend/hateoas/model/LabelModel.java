package com.workflow.backend.hateoas.model;

import lombok.Data;
import lombok.EqualsAndHashCode;
import org.springframework.hateoas.RepresentationModel;
import org.springframework.hateoas.server.core.Relation;

@Data
@EqualsAndHashCode(callSuper = true)
@Relation(collectionRelation = "labels", itemRelation = "label")
public class LabelModel extends RepresentationModel<LabelModel> {
    private Long id;
    private String name;
    private String color;
}
