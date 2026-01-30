package com.workflow.backend.hateoas.assembler;

import com.workflow.backend.controller.BoardController;
import com.workflow.backend.controller.UserController;
import com.workflow.backend.dto.UserResponse;
import com.workflow.backend.hateoas.model.UserModel;
import org.springframework.hateoas.server.mvc.RepresentationModelAssemblerSupport;
import org.springframework.stereotype.Component;

import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.*;

@Component
public class UserModelAssembler extends RepresentationModelAssemblerSupport<UserResponse, UserModel> {

    public UserModelAssembler() {
        super(UserController.class, UserModel.class);
    }

    @Override
    public UserModel toModel(UserResponse dto) {
        UserModel model = new UserModel();
        model.setId(dto.getId());
        model.setUsername(dto.getUsername());
        model.setEmail(dto.getEmail());
        model.setProfilePicture(dto.getProfilePicture());
        model.setDeletionScheduledAt(dto.getDeletionScheduledAt());

        // Self link
        model.add(linkTo(methodOn(UserController.class).getUser(dto.getId()))
                .withSelfRel());

        // Update profile link
        model.add(linkTo(methodOn(UserController.class).updateProfile(dto.getId(), null, null))
                .withRel("update-profile"));

        // Update password link
        model.add(linkTo(methodOn(UserController.class).updatePassword(dto.getId(), null))
                .withRel("update-password"));

        // User's boards link
        model.add(linkTo(methodOn(BoardController.class).getUserBoards(dto.getId(), 0, 10, "id", "desc", null, null, null))
                .withRel("boards"));

        // Create board link
        model.add(linkTo(methodOn(BoardController.class).createBoard(null))
                .withRel("create-board"));

        return model;
    }
}
