package com.workflow.backend.controller;

import com.workflow.backend.dto.CreateTaskListRequest;
import com.workflow.backend.dto.CreateTaskRequest;
import com.workflow.backend.dto.TaskListDto;
import com.workflow.backend.dto.TaskDto;
import com.workflow.backend.service.TaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping // Prefix kaldırıldı
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    // LİSTE EKLE: POST /lists
    @PostMapping("/lists")
    public ResponseEntity<TaskListDto> createTaskList(@RequestBody CreateTaskListRequest request) {
        return ResponseEntity.ok(taskService.createTaskList(request));
    }

    // GÖREV EKLE: POST /tasks
    @PostMapping("/tasks")
    public ResponseEntity<TaskDto> createTask(@RequestBody CreateTaskRequest request) {
        return ResponseEntity.ok(taskService.createTask(request));
    }

    // ... TaskController içinde ...

    // DELETE /lists/{id}
    @DeleteMapping("/lists/{id}")
    public ResponseEntity<Void> deleteTaskList(@PathVariable Long id) {
        taskService.deleteTaskList(id);
        return ResponseEntity.noContent().build();
    }

    // PUT /lists/{id}
    @PutMapping("/lists/{id}")
    public ResponseEntity<TaskListDto> updateTaskList(@PathVariable Long id, @RequestBody TaskListDto request) {
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
    public ResponseEntity<TaskDto> updateTask(@PathVariable Long id, @RequestBody TaskDto request) {
        return ResponseEntity.ok(taskService.updateTask(id, request));
    }
}