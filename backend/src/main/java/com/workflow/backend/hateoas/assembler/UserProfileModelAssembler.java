package com.workflow.backend.hateoas.assembler;

import com.workflow.backend.controller.UserController;
import com.workflow.backend.dto.UserProfileResponse;
import com.workflow.backend.hateoas.model.UserProfileModel;
import org.springframework.hateoas.server.mvc.RepresentationModelAssemblerSupport;
import org.springframework.stereotype.Component;

import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.*;

@Component
public class UserProfileModelAssembler extends RepresentationModelAssemblerSupport<UserProfileResponse, UserProfileModel> {

    public UserProfileModelAssembler() {
        super(UserController.class, UserProfileModel.class);
    }

    @Override
    public UserProfileModel toModel(UserProfileResponse dto) {
        UserProfileModel model = new UserProfileModel();
        model.setId(dto.getId());
        model.setUsername(dto.getUsername());
        model.setFirstName(dto.getFirstName());
        model.setLastName(dto.getLastName());
        model.setProfilePicture(dto.getProfilePicture());
        model.setPrivacyMode(dto.getPrivacyMode());
        model.setPrivacySettings(dto.getPrivacySettings());
        model.setConnectionCount(dto.getConnectionCount());
        model.setConnectionStatus(dto.getConnectionStatus());
        model.setConnectionId(dto.getConnectionId());

        model.add(linkTo(methodOn(UserController.class).getUserProfile(dto.getUsername()))
                .withSelfRel());

        return model;
    }
}
