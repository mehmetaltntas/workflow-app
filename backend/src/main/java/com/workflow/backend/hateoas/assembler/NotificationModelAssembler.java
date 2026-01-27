package com.workflow.backend.hateoas.assembler;

import com.workflow.backend.controller.NotificationController;
import com.workflow.backend.dto.NotificationResponse;
import com.workflow.backend.hateoas.model.NotificationModel;
import org.springframework.hateoas.server.mvc.RepresentationModelAssemblerSupport;
import org.springframework.stereotype.Component;

import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.*;

@Component
public class NotificationModelAssembler extends RepresentationModelAssemblerSupport<NotificationResponse, NotificationModel> {

    public NotificationModelAssembler() {
        super(NotificationController.class, NotificationModel.class);
    }

    @Override
    public NotificationModel toModel(NotificationResponse dto) {
        NotificationModel model = new NotificationModel();
        model.setId(dto.getId());
        model.setType(dto.getType());
        model.setMessage(dto.getMessage());
        model.setIsRead(dto.getIsRead());
        model.setActorId(dto.getActorId());
        model.setActorUsername(dto.getActorUsername());
        model.setActorProfilePicture(dto.getActorProfilePicture());
        model.setReferenceId(dto.getReferenceId());
        model.setCreatedAt(dto.getCreatedAt());

        model.add(linkTo(methodOn(NotificationController.class).markAsRead(dto.getId()))
                .withRel("mark-read"));

        return model;
    }
}
