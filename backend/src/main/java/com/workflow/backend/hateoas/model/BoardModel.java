package com.workflow.backend.hateoas.model;

import lombok.Data;
import lombok.EqualsAndHashCode;
import org.springframework.hateoas.RepresentationModel;
import org.springframework.hateoas.server.core.Relation;

import java.time.LocalDateTime;
import java.util.List;

@Data
@EqualsAndHashCode(callSuper = true)
@Relation(collectionRelation = "boards", itemRelation = "board")
public class BoardModel extends RepresentationModel<BoardModel> {
    private Long id;
    private Long version;
    private String name;
    private String ownerName;
    private String status;
    private String slug;
    private String link;
    private String description;
    private String category;
    private LocalDateTime deadline;
    private LocalDateTime createdAt;
    private List<TaskListModel> taskLists;
    private List<LabelModel> labels;
    private List<BoardMemberModel> members;
    private String ownerFirstName;
    private String ownerLastName;
    private String boardType;
    private Boolean isOwner;
    private Boolean isModerator;
    private Long currentUserId;
}
