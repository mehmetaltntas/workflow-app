package com.workflow.backend.controller;

import com.workflow.backend.dto.CreateTaskListRequest;
import com.workflow.backend.dto.CreateTaskRequest;
import com.workflow.backend.dto.TaskListDto;
import com.workflow.backend.dto.TaskDto;
import com.workflow.backend.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    // LİSTE EKLE: POST /lists
    @PostMapping("/lists")
    public ResponseEntity<TaskListDto> createTaskList(@Valid @RequestBody CreateTaskListRequest request) {
        return ResponseEntity.ok(taskService.createTaskList(request));
    }

    // GÖREV EKLE: POST /tasks
    @PostMapping("/tasks")
    public ResponseEntity<TaskDto> createTask(@Valid @RequestBody CreateTaskRequest request) {
        return ResponseEntity.ok(taskService.createTask(request));
    }

    // DELETE /lists/{id}
    @DeleteMapping("/lists/{id}")
    public ResponseEntity<Void> deleteTaskList(@PathVariable Long id) {
        taskService.deleteTaskList(id);
        return ResponseEntity.noContent().build();
    }

    // PUT /lists/{id}
    @PutMapping("/lists/{id}")
    public ResponseEntity<TaskListDto> updateTaskList(@PathVariable Long id, @Valid @RequestBody TaskListDto request) {
        return ResponseEntity.ok(taskService.updateTaskList(id, request));
    }

    // DELETE /tasks/{id}
    @DeleteMapping("/tasks/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable Long id) {
        taskService.deleteTask(id);
        return ResponseEntity.noContent().build();
    }

    // PUT /tasks/{id}
    @PutMapping("/tasks/{id}")
    public ResponseEntity<TaskDto> updateTask(@PathVariable Long id, @Valid @RequestBody TaskDto request) {
        return ResponseEntity.ok(taskService.updateTask(id, request));
    }
}
