package com.workflow.backend.hateoas.model;

import lombok.Data;
import lombok.EqualsAndHashCode;
import org.springframework.hateoas.RepresentationModel;
import org.springframework.hateoas.server.core.Relation;

@Data
@EqualsAndHashCode(callSuper = true)
@Relation(collectionRelation = "profiles", itemRelation = "profile")
public class UserProfileModel extends RepresentationModel<UserProfileModel> {
    private Long id;
    private String username;
    private String profilePicture;
    private Boolean isProfilePublic;
    private Long connectionCount;
    private String connectionStatus;
}
