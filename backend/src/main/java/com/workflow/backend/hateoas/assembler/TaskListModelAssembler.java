package com.workflow.backend.hateoas.assembler;

import com.workflow.backend.controller.TaskController;
import com.workflow.backend.dto.TaskListDto;
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

    public TaskListModelAssembler(TaskModelAssembler taskAssembler) {
        super(TaskController.class, TaskListModel.class);
        this.taskAssembler = taskAssembler;
    }

    @Override
    public TaskListModel toModel(TaskListDto dto) {
        TaskListModel model = new TaskListModel();
        model.setId(dto.getId());
        model.setName(dto.getName());
        model.setLink(dto.getLink());
        model.setIsCompleted(dto.getIsCompleted());

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
