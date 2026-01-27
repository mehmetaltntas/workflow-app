package com.workflow.backend.hateoas.model;

import lombok.Data;
import lombok.EqualsAndHashCode;
import org.springframework.hateoas.RepresentationModel;
import org.springframework.hateoas.server.core.Relation;

import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@Relation(collectionRelation = "notifications", itemRelation = "notification")
public class NotificationModel extends RepresentationModel<NotificationModel> {
    private Long id;
    private String type;
    private String message;
    private Boolean isRead;
    private Long actorId;
    private String actorUsername;
    private String actorProfilePicture;
    private Long referenceId;
    private LocalDateTime createdAt;
}
