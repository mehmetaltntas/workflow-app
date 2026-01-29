package com.workflow.backend.hateoas.model;

import lombok.Data;
import lombok.EqualsAndHashCode;
import org.springframework.hateoas.RepresentationModel;
import org.springframework.hateoas.server.core.Relation;

import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@Relation(collectionRelation = "connections", itemRelation = "connection")
public class ConnectionModel extends RepresentationModel<ConnectionModel> {
    private Long id;
    private Long senderId;
    private String senderUsername;
    private String senderFirstName;
    private String senderLastName;
    private String senderProfilePicture;
    private Long receiverId;
    private String receiverUsername;
    private String receiverFirstName;
    private String receiverLastName;
    private String receiverProfilePicture;
    private String status;
    private LocalDateTime createdAt;
}
