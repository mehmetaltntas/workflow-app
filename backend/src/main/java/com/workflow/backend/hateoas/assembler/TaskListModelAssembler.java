package com.workflow.backend.hateoas.assembler;

import com.workflow.backend.controller.TaskController;
import com.workflow.backend.dto.TaskListDto;
import com.workflow.backend.entity.Priority;
import com.workflow.backend.hateoas.model.LabelModel;
import com.workflow.backend.hateoas.model.TaskListModel;
import com.workflow.backend.hateoas.model.TaskModel;
import org.springframework.hateoas.server.mvc.RepresentationModelAssemblerSupport;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.*;

@Component
public class TaskListModelAssembler extends RepresentationModelAssemblerSupport<TaskListDto, TaskListModel> {

    private final TaskModelAssembler taskAssembler;
    private final LabelModelAssembler labelAssembler;

    public TaskListModelAssembler(TaskModelAssembler taskAssembler, LabelModelAssembler labelAssembler) {
        super(TaskController.class, TaskListModel.class);
        this.taskAssembler = taskAssembler;
        this.labelAssembler = labelAssembler;
    }

    @Override
    public TaskListModel toModel(TaskListDto dto) {
        TaskListModel model = new TaskListModel();
        model.setId(dto.getId());
        model.setName(dto.getName());
        model.setLink(dto.getLink());
        model.setIsCompleted(dto.getIsCompleted());

        // Extended fields
        model.setDescription(dto.getDescription());
        model.setDueDate(dto.getDueDate());
        model.setCreatedAt(dto.getCreatedAt());

        // Priority conversion (String -> enum)
        if (dto.getPriority() != null && !dto.getPriority().isEmpty()) {
            try {
                model.setPriority(Priority.valueOf(dto.getPriority()));
            } catch (IllegalArgumentException e) {
                // Invalid priority value, leave as null
            }
        }

        // Labels conversion
        if (dto.getLabels() != null && !dto.getLabels().isEmpty()) {
            List<LabelModel> labelModels = dto.getLabels().stream()
                    .map(labelAssembler::toModel)
                    .collect(Collectors.toList());
            model.setLabels(labelModels);
        } else {
            model.setLabels(Collections.emptyList());
        }

        // Convert nested tasks
        if (dto.getTasks() != null) {
            List<TaskModel> taskModels = dto.getTasks().stream()
                    .map(taskAssembler::toModel)
                    .collect(Collectors.toList());
            model.setTasks(taskModels);
        } else {
            model.setTasks(Collections.emptyList());
        }

        // Self link
        model.add(linkTo(methodOn(TaskController.class).updateTaskList(dto.getId(), null))
                .withSelfRel());

        // Delete link
        model.add(linkTo(methodOn(TaskController.class).deleteTaskList(dto.getId()))
                .withRel("delete"));

        // Create task link
        model.add(linkTo(methodOn(TaskController.class).createTask(null))
                .withRel("create-task"));

        return model;
    }
}
