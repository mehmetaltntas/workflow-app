package com.workflow.backend.hateoas.assembler;

import com.workflow.backend.controller.UserController;
import com.workflow.backend.dto.UserSearchResponse;
import com.workflow.backend.hateoas.model.UserSearchModel;
import org.springframework.hateoas.server.mvc.RepresentationModelAssemblerSupport;
import org.springframework.stereotype.Component;

import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.*;

@Component
public class UserSearchModelAssembler extends RepresentationModelAssemblerSupport<UserSearchResponse, UserSearchModel> {

    public UserSearchModelAssembler() {
        super(UserController.class, UserSearchModel.class);
    }

    @Override
    public UserSearchModel toModel(UserSearchResponse dto) {
        UserSearchModel model = new UserSearchModel();
        model.setId(dto.getId());
        model.setUsername(dto.getUsername());
        model.setProfilePicture(dto.getProfilePicture());

        model.add(linkTo(methodOn(UserController.class).getUserProfile(dto.getUsername()))
                .withRel("profile"));

        return model;
    }
}
