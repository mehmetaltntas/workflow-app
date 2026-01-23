package com.workflow.backend.service;

import com.workflow.backend.dto.*;
import com.workflow.backend.entity.Board;
import com.workflow.backend.entity.Task;
import com.workflow.backend.entity.TaskList;
import com.workflow.backend.entity.User;
import com.workflow.backend.repository.BoardRepository;
import com.workflow.backend.repository.LabelRepository;
import com.workflow.backend.repository.TaskListRepository;
import com.workflow.backend.repository.TaskRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TaskServiceTest {

    @Mock
    private TaskListRepository taskListRepository;

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private BoardRepository boardRepository;

    @Mock
    private LabelRepository labelRepository;

    @Mock
    private AuthorizationService authorizationService;

    @InjectMocks
    private TaskService taskService;

    private User testUser;
    private Board testBoard;
    private TaskList testTaskList;
    private TaskList targetTaskList;
    private Task testTask;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("testuser");

        testBoard = new Board();
        testBoard.setId(1L);
        testBoard.setName("Test Board");
        testBoard.setUser(testUser);

        testTaskList = new TaskList();
        testTaskList.setId(1L);
        testTaskList.setName("To Do");
        testTaskList.setBoard(testBoard);
        testTaskList.setTasks(new ArrayList<>());

        targetTaskList = new TaskList();
        targetTaskList.setId(2L);
        targetTaskList.setName("Done");
        targetTaskList.setBoard(testBoard);
        targetTaskList.setTasks(new ArrayList<>());

        testTask = new Task();
        testTask.setId(1L);
        testTask.setTitle("Test Task");
        testTask.setDescription("Test description");
        testTask.setPosition(0);
        testTask.setTaskList(testTaskList);
        testTask.setIsCompleted(false);
    }

    @Nested
    @DisplayName("Create Task Tests")
    class CreateTaskTests {

        @Test
        @DisplayName("Should create task successfully")
        void createTask_Success() {
            // Arrange
            CreateTaskRequest request = new CreateTaskRequest();
            request.setTaskListId(1L);
            request.setTitle("New Task");
            request.setDescription("Description");

            doNothing().when(authorizationService).verifyTaskListOwnership(1L);
            when(taskListRepository.findById(1L)).thenReturn(Optional.of(testTaskList));
            when(taskRepository.existsByTitleAndTaskList("New Task", testTaskList)).thenReturn(false);
            when(taskRepository.findMaxPositionByListId(1L)).thenReturn(0);
            when(taskRepository.save(any(Task.class))).thenAnswer(invocation -> {
                Task task = invocation.getArgument(0);
                task.setId(1L);
                return task;
            });

            // Act
            TaskDto response = taskService.createTask(request);

            // Assert
            assertThat(response).isNotNull();
            assertThat(response.getTitle()).isEqualTo("New Task");
            verify(taskRepository).save(any(Task.class));
        }

        @Test
        @DisplayName("Should set correct position for new task")
        void createTask_SetsCorrectPosition() {
            // Arrange
            CreateTaskRequest request = new CreateTaskRequest();
            request.setTaskListId(1L);
            request.setTitle("New Task");

            doNothing().when(authorizationService).verifyTaskListOwnership(1L);
            when(taskListRepository.findById(1L)).thenReturn(Optional.of(testTaskList));
            when(taskRepository.existsByTitleAndTaskList("New Task", testTaskList)).thenReturn(false);
            when(taskRepository.findMaxPositionByListId(1L)).thenReturn(5);
            when(taskRepository.save(any(Task.class))).thenAnswer(invocation -> {
                Task task = invocation.getArgument(0);
                task.setId(1L);
                return task;
            });

            // Act
            TaskDto response = taskService.createTask(request);

            // Assert
            assertThat(response.getPosition()).isEqualTo(6);
        }

        @Test
        @DisplayName("Should throw exception when task title already exists in list")
        void createTask_DuplicateTitle_ThrowsException() {
            // Arrange
            CreateTaskRequest request = new CreateTaskRequest();
            request.setTaskListId(1L);
            request.setTitle("Existing Task");

            doNothing().when(authorizationService).verifyTaskListOwnership(1L);
            when(taskListRepository.findById(1L)).thenReturn(Optional.of(testTaskList));
            when(taskRepository.existsByTitleAndTaskList("Existing Task", testTaskList)).thenReturn(true);

            // Act & Assert
            assertThatThrownBy(() -> taskService.createTask(request))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Bu görev isminden bu listede zaten var");

            verify(taskRepository, never()).save(any(Task.class));
        }
    }

    @Nested
    @DisplayName("Reorder Task Tests")
    class ReorderTaskTests {

        @Test
        @DisplayName("Should reorder task within same list")
        void reorderTask_WithinSameList_Success() {
            // Arrange
            ReorderTaskRequest request = new ReorderTaskRequest();
            request.setTargetListId(1L);
            request.setNewPosition(2);

            doNothing().when(authorizationService).verifyTaskOwnership(1L);
            doNothing().when(authorizationService).verifyTaskListOwnership(1L);
            when(taskRepository.findById(1L)).thenReturn(Optional.of(testTask));
            when(taskListRepository.findById(1L)).thenReturn(Optional.of(testTaskList));
            when(taskRepository.findByTaskListIdOrderByPositionAsc(1L)).thenReturn(List.of(testTask));
            when(taskRepository.save(any(Task.class))).thenReturn(testTask);

            // Act
            TaskDto response = taskService.reorderTask(1L, request);

            // Assert
            assertThat(response).isNotNull();
            verify(taskRepository).save(any(Task.class));
        }

        @Test
        @DisplayName("Should move task to another list")
        void reorderTask_ToAnotherList_Success() {
            // Arrange
            ReorderTaskRequest request = new ReorderTaskRequest();
            request.setTargetListId(2L);
            request.setNewPosition(0);

            doNothing().when(authorizationService).verifyTaskOwnership(1L);
            doNothing().when(authorizationService).verifyTaskListOwnership(2L);
            when(taskRepository.findById(1L)).thenReturn(Optional.of(testTask));
            when(taskListRepository.findById(2L)).thenReturn(Optional.of(targetTaskList));
            when(taskRepository.save(any(Task.class))).thenReturn(testTask);

            // Act
            TaskDto response = taskService.reorderTask(1L, request);

            // Assert
            assertThat(response).isNotNull();
            verify(taskRepository).decrementPositionsFrom(1L, 0);
            verify(taskRepository).incrementPositionsFrom(2L, 0);
        }
    }

    @Nested
    @DisplayName("Batch Reorder Tests")
    class BatchReorderTests {

        @Test
        @DisplayName("Should batch reorder tasks successfully")
        void batchReorder_Success() {
            // Arrange
            BatchReorderRequest request = new BatchReorderRequest();
            request.setListId(1L);

            BatchReorderRequest.TaskPosition tp1 = new BatchReorderRequest.TaskPosition();
            tp1.setTaskId(1L);
            tp1.setPosition(1);

            request.setTaskPositions(List.of(tp1));

            doNothing().when(authorizationService).verifyTaskListOwnership(1L);
            when(taskListRepository.findById(1L)).thenReturn(Optional.of(testTaskList));
            when(taskRepository.findById(1L)).thenReturn(Optional.of(testTask));
            when(taskRepository.save(any(Task.class))).thenReturn(testTask);
            when(taskRepository.findByTaskListIdOrderByPositionAsc(1L)).thenReturn(List.of(testTask));

            // Act
            List<TaskDto> response = taskService.batchReorder(request);

            // Assert
            assertThat(response).isNotEmpty();
        }
    }

    @Nested
    @DisplayName("Delete Task Tests")
    class DeleteTaskTests {

        @Test
        @DisplayName("Should delete task and reposition remaining tasks")
        void deleteTask_RepositionsRemainingTasks() {
            // Arrange
            doNothing().when(authorizationService).verifyTaskOwnership(1L);
            when(taskRepository.findById(1L)).thenReturn(Optional.of(testTask));
            doNothing().when(taskRepository).deleteById(1L);

            // Act
            taskService.deleteTask(1L);

            // Assert
            verify(taskRepository).deleteById(1L);
            verify(taskRepository).decrementPositionsFrom(1L, 0);
        }
    }

    @Nested
    @DisplayName("Update Task Tests")
    class UpdateTaskTests {

        @Test
        @DisplayName("Should update task successfully")
        void updateTask_Success() {
            // Arrange
            TaskDto updateRequest = new TaskDto();
            updateRequest.setTitle("Updated Title");
            updateRequest.setDescription("Updated description");
            updateRequest.setIsCompleted(true);

            doNothing().when(authorizationService).verifyTaskOwnership(1L);
            when(taskRepository.findById(1L)).thenReturn(Optional.of(testTask));
            when(taskRepository.save(any(Task.class))).thenReturn(testTask);

            // Act
            TaskDto response = taskService.updateTask(1L, updateRequest);

            // Assert
            assertThat(response).isNotNull();
            verify(taskRepository).save(any(Task.class));
        }
    }
}
