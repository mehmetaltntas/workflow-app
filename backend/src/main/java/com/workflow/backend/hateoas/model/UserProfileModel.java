package com.workflow.backend.hateoas.model;

import com.workflow.backend.dto.PrivacySettingsResponse;
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
    private String firstName;
    private String lastName;
    private String profilePicture;
    private String privacyMode;
    private PrivacySettingsResponse privacySettings;
    private Long connectionCount;
    private String connectionStatus;
    private Long connectionId;
}
