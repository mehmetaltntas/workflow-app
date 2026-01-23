package com.workflow.backend.hateoas.assembler;

import com.workflow.backend.controller.LabelController;
import com.workflow.backend.dto.LabelDto;
import com.workflow.backend.hateoas.model.LabelModel;
import org.springframework.hateoas.server.mvc.RepresentationModelAssemblerSupport;
import org.springframework.stereotype.Component;

import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.*;

@Component
public class LabelModelAssembler extends RepresentationModelAssemblerSupport<LabelDto, LabelModel> {

    public LabelModelAssembler() {
        super(LabelController.class, LabelModel.class);
    }

    @Override
    public LabelModel toModel(LabelDto dto) {
        LabelModel model = new LabelModel();
        model.setId(dto.getId());
        model.setName(dto.getName());
        model.setColor(dto.getColor());

        // Self link
        model.add(linkTo(methodOn(LabelController.class).updateLabel(dto.getId(), null))
                .withSelfRel());

        // Delete link
        model.add(linkTo(methodOn(LabelController.class).deleteLabel(dto.getId()))
                .withRel("delete"));

        return model;
    }

    public LabelModel toModelWithBoardLink(LabelDto dto, Long boardId) {
        LabelModel model = toModel(dto);

        // Link to board's labels
        model.add(linkTo(methodOn(LabelController.class).getLabelsByBoard(boardId))
                .withRel("board-labels"));

        return model;
    }
}
