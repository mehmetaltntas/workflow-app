package com.workflow.backend.hateoas.assembler;

import com.workflow.backend.controller.SubtaskController;
import com.workflow.backend.dto.SubtaskDto;
import com.workflow.backend.hateoas.model.SubtaskModel;
import org.springframework.hateoas.server.mvc.RepresentationModelAssemblerSupport;
import org.springframework.stereotype.Component;

import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.*;

@Component
public class SubtaskModelAssembler extends RepresentationModelAssemblerSupport<SubtaskDto, SubtaskModel> {

    public SubtaskModelAssembler() {
        super(SubtaskController.class, SubtaskModel.class);
    }

    @Override
    public SubtaskModel toModel(SubtaskDto dto) {
        SubtaskModel model = new SubtaskModel();
        model.setId(dto.getId());
        model.setVersion(dto.getVersion());
        model.setTitle(dto.getTitle());
        model.setIsCompleted(dto.getIsCompleted());
        model.setPosition(dto.getPosition());
        model.setDescription(dto.getDescription());
        model.setLink(dto.getLink());
        model.setCreatedAt(dto.getCreatedAt());

        // Self link
        model.add(linkTo(methodOn(SubtaskController.class).updateSubtask(dto.getId(), null))
                .withSelfRel());

        // Toggle completion link
        model.add(linkTo(methodOn(SubtaskController.class).toggleComplete(dto.getId()))
                .withRel("toggle"));

        // Delete link
        model.add(linkTo(methodOn(SubtaskController.class).deleteSubtask(dto.getId()))
                .withRel("delete"));

        return model;
    }
}
