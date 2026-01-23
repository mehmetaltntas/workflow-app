package com.workflow.backend.controller;

import com.workflow.backend.dto.*;
import com.workflow.backend.hateoas.assembler.TaskListModelAssembler;
import com.workflow.backend.hateoas.assembler.TaskModelAssembler;
import com.workflow.backend.hateoas.model.TaskListModel;
import com.workflow.backend.hateoas.model.TaskModel;
import com.workflow.backend.service.TaskService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.hateoas.CollectionModel;
import org.springframework.http.ResponseEntity;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TaskControllerTest {

    @Mock
    private TaskService taskService;

    @Mock
    private TaskListModelAssembler taskListAssembler;

    @Mock
    private TaskModelAssembler taskAssembler;

    @InjectMocks
    private TaskController taskController;

    private TaskListDto taskListResponse;
    private TaskDto taskResponse;
    private TaskListModel taskListModel;
    private TaskModel taskModel;

    @BeforeEach
    void setUp() {
        taskListResponse = new TaskListDto();
        taskListResponse.setId(1L);
        taskListResponse.setName("To Do");
        taskListResponse.setTasks(List.of());

        taskResponse = new TaskDto();
        taskResponse.setId(1L);
        taskResponse.setTitle("Test Task");
        taskResponse.setDescription("Test description");
        taskResponse.setPosition(0);
        taskResponse.setIsCompleted(false);

        taskListModel = new TaskListModel();
        taskListModel.setId(1L);
        taskListModel.setName("To Do");
        taskListModel.setTasks(List.of());

        taskModel = new TaskModel();
        taskModel.setId(1L);
        taskModel.setTitle("Test Task");
        taskModel.setDescription("Test description");
        taskModel.setPosition(0);
        taskModel.setIsCompleted(false);
    }

    @Nested
    @DisplayName("TaskList Endpoint Tests")
    class TaskListTests {

        @Test
        @DisplayName("Should create task list and return 200")
        void createTaskList_ValidRequest_Returns200() {
            // Arrange
            CreateTaskListRequest request = new CreateTaskListRequest();
            request.setBoardId(1L);
            request.setName("To Do");

            when(taskService.createTaskList(any(CreateTaskListRequest.class))).thenReturn(taskListResponse);
            when(taskListAssembler.toModel(any(TaskListDto.class))).thenReturn(taskListModel);

            // Act
            ResponseEntity<TaskListModel> response = taskController.createTaskList(request);

            // Assert
            assertThat(response.getStatusCode().value()).isEqualTo(200);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().getId()).isEqualTo(1L);
            assertThat(response.getBody().getName()).isEqualTo("To Do");
        }

        @Test
        @DisplayName("Should update task list and return 200")
        void updateTaskList_ValidRequest_Returns200() {
            // Arrange
            TaskListDto updateRequest = new TaskListDto();
            updateRequest.setName("Done");

            TaskListDto updatedResponse = new TaskListDto();
            updatedResponse.setId(1L);
            updatedResponse.setName("Done");

            TaskListModel updatedModel = new TaskListModel();
            updatedModel.setId(1L);
            updatedModel.setName("Done");

            when(taskService.updateTaskList(eq(1L), any(TaskListDto.class))).thenReturn(updatedResponse);
            when(taskListAssembler.toModel(any(TaskListDto.class))).thenReturn(updatedModel);

            // Act
            ResponseEntity<TaskListModel> response = taskController.updateTaskList(1L, updateRequest);

            // Assert
            assertThat(response.getStatusCode().value()).isEqualTo(200);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().getName()).isEqualTo("Done");
        }

        @Test
        @DisplayName("Should delete task list and return 204")
        void deleteTaskList_ValidId_Returns204() {
            // Arrange
            doNothing().when(taskService).deleteTaskList(1L);

            // Act
            ResponseEntity<Void> response = taskController.deleteTaskList(1L);

            // Assert
            assertThat(response.getStatusCode().value()).isEqualTo(204);
            verify(taskService).deleteTaskList(1L);
        }

        @Test
        @DisplayName("Should throw exception when task list not found")
        void deleteTaskList_NotFound_ThrowsException() {
            // Arrange
            doThrow(new RuntimeException("Liste bulunamadı!")).when(taskService).deleteTaskList(999L);

            // Act & Assert
            assertThatThrownBy(() -> taskController.deleteTaskList(999L))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Liste bulunamadı");
        }
    }

    @Nested
    @DisplayName("Task Endpoint Tests")
    class TaskTests {

        @Test
        @DisplayName("Should create task and return 200")
        void createTask_ValidRequest_Returns200() {
            // Arrange
            CreateTaskRequest request = new CreateTaskRequest();
            request.setTaskListId(1L);
            request.setTitle("New Task");
            request.setDescription("Task description");

            when(taskService.createTask(any(CreateTaskRequest.class))).thenReturn(taskResponse);
            when(taskAssembler.toModel(any(TaskDto.class))).thenReturn(taskModel);

            // Act
            ResponseEntity<TaskModel> response = taskController.createTask(request);

            // Assert
            assertThat(response.getStatusCode().value()).isEqualTo(200);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().getId()).isEqualTo(1L);
            assertThat(response.getBody().getTitle()).isEqualTo("Test Task");
            assertThat(response.getBody().getPosition()).isEqualTo(0);
        }

        @Test
        @DisplayName("Should update task and return 200")
        void updateTask_ValidRequest_Returns200() {
            // Arrange
            TaskDto updateRequest = new TaskDto();
            updateRequest.setTitle("Updated Task");
            updateRequest.setIsCompleted(true);

            TaskDto updatedResponse = new TaskDto();
            updatedResponse.setId(1L);
            updatedResponse.setTitle("Updated Task");
            updatedResponse.setIsCompleted(true);

            TaskModel updatedModel = new TaskModel();
            updatedModel.setId(1L);
            updatedModel.setTitle("Updated Task");
            updatedModel.setIsCompleted(true);

            when(taskService.updateTask(eq(1L), any(TaskDto.class))).thenReturn(updatedResponse);
            when(taskAssembler.toModel(any(TaskDto.class))).thenReturn(updatedModel);

            // Act
            ResponseEntity<TaskModel> response = taskController.updateTask(1L, updateRequest);

            // Assert
            assertThat(response.getStatusCode().value()).isEqualTo(200);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().getTitle()).isEqualTo("Updated Task");
            assertThat(response.getBody().getIsCompleted()).isTrue();
        }

        @Test
        @DisplayName("Should delete task and return 204")
        void deleteTask_ValidId_Returns204() {
            // Arrange
            doNothing().when(taskService).deleteTask(1L);

            // Act
            ResponseEntity<Void> response = taskController.deleteTask(1L);

            // Assert
            assertThat(response.getStatusCode().value()).isEqualTo(204);
            verify(taskService).deleteTask(1L);
        }
    }

    @Nested
    @DisplayName("Reorder Task Tests")
    class ReorderTaskTests {

        @Test
        @DisplayName("Should reorder task and return 200")
        void reorderTask_ValidRequest_Returns200() {
            // Arrange
            ReorderTaskRequest request = new ReorderTaskRequest();
            request.setTargetListId(2L);
            request.setNewPosition(1);

            TaskDto reorderedResponse = new TaskDto();
            reorderedResponse.setId(1L);
            reorderedResponse.setTitle("Test Task");
            reorderedResponse.setPosition(1);

            TaskModel reorderedModel = new TaskModel();
            reorderedModel.setId(1L);
            reorderedModel.setTitle("Test Task");
            reorderedModel.setPosition(1);

            when(taskService.reorderTask(eq(1L), any(ReorderTaskRequest.class))).thenReturn(reorderedResponse);
            when(taskAssembler.toModel(any(TaskDto.class))).thenReturn(reorderedModel);

            // Act
            ResponseEntity<TaskModel> response = taskController.reorderTask(1L, request);

            // Assert
            assertThat(response.getStatusCode().value()).isEqualTo(200);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().getPosition()).isEqualTo(1);
        }

        @Test
        @DisplayName("Should batch reorder tasks and return 200")
        void batchReorder_ValidRequest_Returns200() {
            // Arrange
            BatchReorderRequest request = new BatchReorderRequest();
            request.setListId(1L);

            BatchReorderRequest.TaskPosition tp1 = new BatchReorderRequest.TaskPosition();
            tp1.setTaskId(1L);
            tp1.setPosition(0);

            BatchReorderRequest.TaskPosition tp2 = new BatchReorderRequest.TaskPosition();
            tp2.setTaskId(2L);
            tp2.setPosition(1);

            request.setTaskPositions(List.of(tp1, tp2));

            List<TaskDto> reorderedTasks = List.of(
                    createTaskDto(1L, "Task 1", 0),
                    createTaskDto(2L, "Task 2", 1)
            );

            TaskModel model1 = createTaskModel(1L, "Task 1", 0);
            TaskModel model2 = createTaskModel(2L, "Task 2", 1);

            when(taskService.batchReorder(any(BatchReorderRequest.class))).thenReturn(reorderedTasks);
            when(taskAssembler.toModel(any(TaskDto.class))).thenReturn(model1, model2);

            // Act
            ResponseEntity<CollectionModel<TaskModel>> response = taskController.batchReorder(request);

            // Assert
            assertThat(response.getStatusCode().value()).isEqualTo(200);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().getContent()).hasSize(2);
        }
    }

    private TaskDto createTaskDto(Long id, String title, int position) {
        TaskDto dto = new TaskDto();
        dto.setId(id);
        dto.setTitle(title);
        dto.setPosition(position);
        dto.setIsCompleted(false);
        return dto;
    }

    private TaskModel createTaskModel(Long id, String title, int position) {
        TaskModel model = new TaskModel();
        model.setId(id);
        model.setTitle(title);
        model.setPosition(position);
        model.setIsCompleted(false);
        return model;
    }
}
