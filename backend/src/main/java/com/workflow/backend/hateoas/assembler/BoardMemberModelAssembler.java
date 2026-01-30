package com.workflow.backend.hateoas.assembler;

import com.workflow.backend.controller.BoardMemberController;
import com.workflow.backend.dto.BoardMemberResponse;
import com.workflow.backend.hateoas.model.BoardMemberModel;
import org.springframework.hateoas.server.mvc.RepresentationModelAssemblerSupport;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.stream.Collectors;

@Component
public class BoardMemberModelAssembler extends RepresentationModelAssemblerSupport<BoardMemberResponse, BoardMemberModel> {

    public BoardMemberModelAssembler() {
        super(BoardMemberController.class, BoardMemberModel.class);
    }

    @Override
    public BoardMemberModel toModel(BoardMemberResponse dto) {
        BoardMemberModel model = new BoardMemberModel();
        model.setId(dto.getId());
        model.setUserId(dto.getUserId());
        model.setUsername(dto.getUsername());
        model.setProfilePicture(dto.getProfilePicture());
        model.setStatus(dto.getStatus());
        model.setRole(dto.getRole());
        model.setCreatedAt(dto.getCreatedAt());

        if (dto.getAssignments() != null) {
            model.setAssignments(dto.getAssignments().stream().map(a -> {
                BoardMemberModel.BoardMemberAssignmentModel am = new BoardMemberModel.BoardMemberAssignmentModel();
                am.setId(a.getId());
                am.setTargetType(a.getTargetType());
                am.setTargetId(a.getTargetId());
                am.setTargetName(a.getTargetName());
                am.setCreatedAt(a.getCreatedAt());
                return am;
            }).collect(Collectors.toList()));
        } else {
            model.setAssignments(Collections.emptyList());
        }

        return model;
    }
}
