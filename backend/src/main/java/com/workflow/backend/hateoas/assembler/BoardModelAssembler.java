package com.workflow.backend.hateoas.assembler;

import com.workflow.backend.controller.BoardController;
import com.workflow.backend.controller.LabelController;
import com.workflow.backend.controller.TaskController;
import com.workflow.backend.dto.BoardResponse;
import com.workflow.backend.hateoas.model.BoardMemberModel;
import com.workflow.backend.hateoas.model.BoardModel;
import com.workflow.backend.hateoas.model.LabelModel;
import com.workflow.backend.hateoas.model.TaskListModel;
import org.springframework.hateoas.server.mvc.RepresentationModelAssemblerSupport;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.*;

@Component
public class BoardModelAssembler extends RepresentationModelAssemblerSupport<BoardResponse, BoardModel> {

    private final TaskListModelAssembler taskListAssembler;
    private final LabelModelAssembler labelAssembler;
    private final BoardMemberModelAssembler boardMemberAssembler;

    public BoardModelAssembler(TaskListModelAssembler taskListAssembler, LabelModelAssembler labelAssembler, BoardMemberModelAssembler boardMemberAssembler) {
        super(BoardController.class, BoardModel.class);
        this.taskListAssembler = taskListAssembler;
        this.labelAssembler = labelAssembler;
        this.boardMemberAssembler = boardMemberAssembler;
    }

    @Override
    public BoardModel toModel(BoardResponse dto) {
        BoardModel model = new BoardModel();
        model.setId(dto.getId());
        model.setVersion(dto.getVersion());
        model.setName(dto.getName());
        model.setOwnerName(dto.getOwnerName());
        model.setStatus(dto.getStatus());
        model.setSlug(dto.getSlug());
        model.setLink(dto.getLink());
        model.setDescription(dto.getDescription());
        model.setCategory(dto.getCategory());
        model.setDeadline(dto.getDeadline());
        model.setCreatedAt(dto.getCreatedAt());

        // Convert nested task lists
        if (dto.getTaskLists() != null) {
            List<TaskListModel> taskListModels = dto.getTaskLists().stream()
                    .map(taskListAssembler::toModel)
                    .collect(Collectors.toList());
            model.setTaskLists(taskListModels);
        } else {
            model.setTaskLists(Collections.emptyList());
        }

        // Convert nested labels
        if (dto.getLabels() != null) {
            List<LabelModel> labelModels = dto.getLabels().stream()
                    .map(labelAssembler::toModel)
                    .collect(Collectors.toList());
            model.setLabels(labelModels);
        } else {
            model.setLabels(Collections.emptyList());
        }

        // Convert nested members
        if (dto.getMembers() != null) {
            List<BoardMemberModel> memberModels = dto.getMembers().stream()
                    .map(boardMemberAssembler::toModel)
                    .collect(Collectors.toList());
            model.setMembers(memberModels);
        } else {
            model.setMembers(Collections.emptyList());
        }

        // Self link (by slug)
        model.add(linkTo(methodOn(BoardController.class).getBoardDetails(dto.getSlug()))
                .withSelfRel());

        // Update link
        model.add(linkTo(methodOn(BoardController.class).updateBoard(dto.getId(), null))
                .withRel("update"));

        // Delete link
        model.add(linkTo(methodOn(BoardController.class).deleteBoard(dto.getId()))
                .withRel("delete"));

        // Update status link
        model.add(linkTo(methodOn(BoardController.class).updateBoardStatus(dto.getId(), null))
                .withRel("update-status"));

        // Create task list link
        model.add(linkTo(methodOn(TaskController.class).createTaskList(null))
                .withRel("create-list"));

        // Board labels link
        model.add(linkTo(methodOn(LabelController.class).getLabelsByBoard(dto.getId()))
                .withRel("labels"));

        // Create label link
        model.add(linkTo(methodOn(LabelController.class).createLabel(null))
                .withRel("create-label"));

        return model;
    }
}
