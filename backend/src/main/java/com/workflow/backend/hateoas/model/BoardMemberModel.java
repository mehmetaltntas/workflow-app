package com.workflow.backend.hateoas.model;

import lombok.Data;
import lombok.EqualsAndHashCode;
import org.springframework.hateoas.RepresentationModel;
import org.springframework.hateoas.server.core.Relation;

import java.time.LocalDateTime;
import java.util.List;

@Data
@EqualsAndHashCode(callSuper = true)
@Relation(collectionRelation = "boardMembers", itemRelation = "boardMember")
public class BoardMemberModel extends RepresentationModel<BoardMemberModel> {
    private Long id;
    private Long userId;
    private String username;
    private String profilePicture;
    private String status;
    private String role;
    private LocalDateTime createdAt;
    private List<BoardMemberAssignmentModel> assignments;

    @Data
    public static class BoardMemberAssignmentModel {
        private Long id;
        private String targetType;
        private Long targetId;
        private String targetName;
        private LocalDateTime createdAt;
    }
}
