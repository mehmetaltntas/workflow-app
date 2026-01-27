package com.workflow.backend.hateoas.model;

import lombok.Data;
import lombok.EqualsAndHashCode;
import org.springframework.hateoas.RepresentationModel;
import org.springframework.hateoas.server.core.Relation;

@Data
@EqualsAndHashCode(callSuper = true)
@Relation(collectionRelation = "users", itemRelation = "user")
public class UserSearchModel extends RepresentationModel<UserSearchModel> {
    private Long id;
    private String username;
    private String profilePicture;
}
