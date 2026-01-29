package com.workflow.backend.hateoas.assembler;

import com.workflow.backend.controller.ConnectionController;
import com.workflow.backend.dto.ConnectionResponse;
import com.workflow.backend.hateoas.model.ConnectionModel;
import org.springframework.hateoas.server.mvc.RepresentationModelAssemblerSupport;
import org.springframework.stereotype.Component;

import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.*;

@Component
public class ConnectionModelAssembler extends RepresentationModelAssemblerSupport<ConnectionResponse, ConnectionModel> {

    public ConnectionModelAssembler() {
        super(ConnectionController.class, ConnectionModel.class);
    }

    @Override
    public ConnectionModel toModel(ConnectionResponse dto) {
        ConnectionModel model = new ConnectionModel();
        model.setId(dto.getId());
        model.setSenderId(dto.getSenderId());
        model.setSenderUsername(dto.getSenderUsername());
        model.setSenderFirstName(dto.getSenderFirstName());
        model.setSenderLastName(dto.getSenderLastName());
        model.setSenderProfilePicture(dto.getSenderProfilePicture());
        model.setReceiverId(dto.getReceiverId());
        model.setReceiverUsername(dto.getReceiverUsername());
        model.setReceiverFirstName(dto.getReceiverFirstName());
        model.setReceiverLastName(dto.getReceiverLastName());
        model.setReceiverProfilePicture(dto.getReceiverProfilePicture());
        model.setStatus(dto.getStatus());
        model.setCreatedAt(dto.getCreatedAt());

        model.add(linkTo(methodOn(ConnectionController.class).acceptConnection(dto.getId()))
                .withRel("accept"));

        model.add(linkTo(methodOn(ConnectionController.class).rejectConnection(dto.getId()))
                .withRel("reject"));

        return model;
    }
}
