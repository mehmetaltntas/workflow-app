package com.workflow.backend.hateoas.assembler;

import com.workflow.backend.controller.TaskController;
import com.workflow.backend.dto.TaskDto;
import com.workflow.backend.hateoas.model.LabelModel;
import com.workflow.backend.hateoas.model.SubtaskModel;
import com.workflow.backend.hateoas.model.TaskModel;
import org.springframework.hateoas.server.mvc.RepresentationModelAssemblerSupport;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.*;

@Component
public class TaskModelAssembler extends RepresentationModelAssemblerSupport<TaskDto, TaskModel> {

    private final LabelModelAssembler labelAssembler;
    private final SubtaskModelAssembler subtaskAssembler;

    public TaskModelAssembler(LabelModelAssembler labelAssembler, SubtaskModelAssembler subtaskAssembler) {
        super(TaskController.class, TaskModel.class);
        this.labelAssembler = labelAssembler;
        this.subtaskAssembler = subtaskAssembler;
    }

    @Override
    public TaskModel toModel(TaskDto dto) {
        TaskModel model = new TaskModel();
        model.setId(dto.getId());
        model.setVersion(dto.getVersion());
        model.setTitle(dto.getTitle());
        model.setDescription(dto.getDescription());
        model.setLink(dto.getLink());
        model.setIsCompleted(dto.getIsCompleted());
        model.setCreatedAt(dto.getCreatedAt());
        model.setPosition(dto.getPosition());
        model.setDueDate(dto.getDueDate());
        model.setPriority(dto.getPriority());

        // Convert nested labels
        if (dto.getLabels() != null) {
            List<LabelModel> labelModels = dto.getLabels().stream()
                    .map(labelAssembler::toModel)
                    .collect(Collectors.toList());
            model.setLabels(labelModels);
        } else {
            model.setLabels(Collections.emptyList());
        }

        // Convert nested subtasks
        if (dto.getSubtasks() != null) {
            List<SubtaskModel> subtaskModels = dto.getSubtasks().stream()
                    .map(subtaskAssembler::toModel)
                    .collect(Collectors.toList());
            model.setSubtasks(subtaskModels);
        } else {
            model.setSubtasks(Collections.emptyList());
        }

        // Self link
        model.add(linkTo(methodOn(TaskController.class).updateTask(dto.getId(), null))
                .withSelfRel());

        // Delete link
        model.add(linkTo(methodOn(TaskController.class).deleteTask(dto.getId()))
                .withRel("delete"));

        // Reorder link
        model.add(linkTo(methodOn(TaskController.class).reorderTask(dto.getId(), null))
                .withRel("reorder"));

        return model;
    }
}
