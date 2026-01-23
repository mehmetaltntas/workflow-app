package com.workflow.backend.service;

import com.workflow.backend.exception.UnauthorizedAccessException;
import com.workflow.backend.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthorizationServiceTest {

    @Mock
    private CurrentUserService currentUserService;

    @Mock
    private BoardRepository boardRepository;

    @Mock
    private TaskListRepository taskListRepository;

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private LabelRepository labelRepository;

    @Mock
    private SubtaskRepository subtaskRepository;

    @InjectMocks
    private AuthorizationService authorizationService;

    private static final Long CURRENT_USER_ID = 1L;
    private static final Long OTHER_USER_ID = 2L;

    @BeforeEach
    void setUp() {
        // Common setup if needed
    }

    @Nested
    @DisplayName("Board Ownership Tests")
    class BoardOwnershipTests {

        @Test
        @DisplayName("Should pass when user owns the board")
        void verifyBoardOwnership_Success() {
            // Arrange
            when(currentUserService.getCurrentUserId()).thenReturn(CURRENT_USER_ID);
            when(boardRepository.existsByIdAndUserId(1L, CURRENT_USER_ID)).thenReturn(true);

            // Act & Assert
            assertThatCode(() -> authorizationService.verifyBoardOwnership(1L))
                    .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("Should throw exception when user does not own the board")
        void verifyBoardOwnership_Unauthorized_ThrowsException() {
            // Arrange
            when(currentUserService.getCurrentUserId()).thenReturn(CURRENT_USER_ID);
            when(boardRepository.existsByIdAndUserId(1L, CURRENT_USER_ID)).thenReturn(false);

            // Act & Assert
            assertThatThrownBy(() -> authorizationService.verifyBoardOwnership(1L))
                    .isInstanceOf(UnauthorizedAccessException.class);
        }
    }

    @Nested
    @DisplayName("TaskList Ownership Tests")
    class TaskListOwnershipTests {

        @Test
        @DisplayName("Should pass when user owns the task list")
        void verifyTaskListOwnership_Success() {
            // Arrange
            when(currentUserService.getCurrentUserId()).thenReturn(CURRENT_USER_ID);
            when(taskListRepository.existsByIdAndBoardUserId(1L, CURRENT_USER_ID)).thenReturn(true);

            // Act & Assert
            assertThatCode(() -> authorizationService.verifyTaskListOwnership(1L))
                    .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("Should throw exception when user does not own the task list")
        void verifyTaskListOwnership_Unauthorized_ThrowsException() {
            // Arrange
            when(currentUserService.getCurrentUserId()).thenReturn(CURRENT_USER_ID);
            when(taskListRepository.existsByIdAndBoardUserId(1L, CURRENT_USER_ID)).thenReturn(false);

            // Act & Assert
            assertThatThrownBy(() -> authorizationService.verifyTaskListOwnership(1L))
                    .isInstanceOf(UnauthorizedAccessException.class);
        }
    }

    @Nested
    @DisplayName("Task Ownership Tests")
    class TaskOwnershipTests {

        @Test
        @DisplayName("Should pass when user owns the task")
        void verifyTaskOwnership_Success() {
            // Arrange
            when(currentUserService.getCurrentUserId()).thenReturn(CURRENT_USER_ID);
            when(taskRepository.existsByIdAndTaskListBoardUserId(1L, CURRENT_USER_ID)).thenReturn(true);

            // Act & Assert
            assertThatCode(() -> authorizationService.verifyTaskOwnership(1L))
                    .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("Should throw exception when user does not own the task")
        void verifyTaskOwnership_Unauthorized_ThrowsException() {
            // Arrange
            when(currentUserService.getCurrentUserId()).thenReturn(CURRENT_USER_ID);
            when(taskRepository.existsByIdAndTaskListBoardUserId(1L, CURRENT_USER_ID)).thenReturn(false);

            // Act & Assert
            assertThatThrownBy(() -> authorizationService.verifyTaskOwnership(1L))
                    .isInstanceOf(UnauthorizedAccessException.class);
        }
    }

    @Nested
    @DisplayName("Label Ownership Tests")
    class LabelOwnershipTests {

        @Test
        @DisplayName("Should pass when user owns the label")
        void verifyLabelOwnership_Success() {
            // Arrange
            when(currentUserService.getCurrentUserId()).thenReturn(CURRENT_USER_ID);
            when(labelRepository.existsByIdAndBoardUserId(1L, CURRENT_USER_ID)).thenReturn(true);

            // Act & Assert
            assertThatCode(() -> authorizationService.verifyLabelOwnership(1L))
                    .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("Should throw exception when user does not own the label")
        void verifyLabelOwnership_Unauthorized_ThrowsException() {
            // Arrange
            when(currentUserService.getCurrentUserId()).thenReturn(CURRENT_USER_ID);
            when(labelRepository.existsByIdAndBoardUserId(1L, CURRENT_USER_ID)).thenReturn(false);

            // Act & Assert
            assertThatThrownBy(() -> authorizationService.verifyLabelOwnership(1L))
                    .isInstanceOf(UnauthorizedAccessException.class);
        }
    }

    @Nested
    @DisplayName("Subtask Ownership Tests")
    class SubtaskOwnershipTests {

        @Test
        @DisplayName("Should pass when user owns the subtask")
        void verifySubtaskOwnership_Success() {
            // Arrange
            when(currentUserService.getCurrentUserId()).thenReturn(CURRENT_USER_ID);
            when(subtaskRepository.existsByIdAndTaskTaskListBoardUserId(1L, CURRENT_USER_ID)).thenReturn(true);

            // Act & Assert
            assertThatCode(() -> authorizationService.verifySubtaskOwnership(1L))
                    .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("Should throw exception when user does not own the subtask")
        void verifySubtaskOwnership_Unauthorized_ThrowsException() {
            // Arrange
            when(currentUserService.getCurrentUserId()).thenReturn(CURRENT_USER_ID);
            when(subtaskRepository.existsByIdAndTaskTaskListBoardUserId(1L, CURRENT_USER_ID)).thenReturn(false);

            // Act & Assert
            assertThatThrownBy(() -> authorizationService.verifySubtaskOwnership(1L))
                    .isInstanceOf(UnauthorizedAccessException.class);
        }
    }

    @Nested
    @DisplayName("User Ownership Tests")
    class UserOwnershipTests {

        @Test
        @DisplayName("Should pass when accessing own user record")
        void verifyUserOwnership_Success() {
            // Arrange
            when(currentUserService.getCurrentUserId()).thenReturn(CURRENT_USER_ID);

            // Act & Assert
            assertThatCode(() -> authorizationService.verifyUserOwnership(CURRENT_USER_ID))
                    .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("Should throw exception when accessing another user's record")
        void verifyUserOwnership_Unauthorized_ThrowsException() {
            // Arrange
            when(currentUserService.getCurrentUserId()).thenReturn(CURRENT_USER_ID);

            // Act & Assert
            assertThatThrownBy(() -> authorizationService.verifyUserOwnership(OTHER_USER_ID))
                    .isInstanceOf(UnauthorizedAccessException.class);
        }
    }
}
