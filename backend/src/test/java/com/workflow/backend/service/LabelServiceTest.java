package com.workflow.backend.service;

import com.workflow.backend.dto.CreateLabelRequest;
import com.workflow.backend.dto.LabelDto;
import com.workflow.backend.dto.TaskListUsageDto;
import com.workflow.backend.entity.Board;
import com.workflow.backend.entity.Label;
import com.workflow.backend.entity.TaskList;
import com.workflow.backend.entity.User;
import com.workflow.backend.repository.BoardRepository;
import com.workflow.backend.repository.LabelRepository;
import com.workflow.backend.repository.TaskListRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LabelServiceTest {

    @Mock
    private LabelRepository labelRepository;

    @Mock
    private BoardRepository boardRepository;

    @Mock
    private TaskListRepository taskListRepository;

    @Mock
    private AuthorizationService authorizationService;

    @InjectMocks
    private LabelService labelService;

    private User testUser;
    private Board testBoard;
    private Label testLabel;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("testuser");

        testBoard = new Board();
        testBoard.setId(1L);
        testBoard.setName("Test Board");
        testBoard.setUser(testUser);

        testLabel = new Label();
        testLabel.setId(1L);
        testLabel.setName("Bug");
        testLabel.setColor("#ff0000");
        testLabel.setBoard(testBoard);
        testLabel.setTasks(new HashSet<>());
    }

    @Nested
    @DisplayName("Get Labels Tests")
    class GetLabelsTests {

        @Test
        @DisplayName("Should return labels for board")
        void getLabelsByBoardId_Success() {
            // Arrange
            doNothing().when(authorizationService).verifyBoardOwnership(1L);
            when(labelRepository.findByBoardId(1L)).thenReturn(List.of(testLabel));

            // Act
            List<LabelDto> response = labelService.getLabelsByBoardId(1L);

            // Assert
            assertThat(response).hasSize(1);
            assertThat(response.get(0).getName()).isEqualTo("Bug");
            assertThat(response.get(0).getColor()).isEqualTo("#ff0000");
        }

        @Test
        @DisplayName("Should return empty list when no labels")
        void getLabelsByBoardId_EmptyList() {
            // Arrange
            doNothing().when(authorizationService).verifyBoardOwnership(1L);
            when(labelRepository.findByBoardId(1L)).thenReturn(List.of());

            // Act
            List<LabelDto> response = labelService.getLabelsByBoardId(1L);

            // Assert
            assertThat(response).isEmpty();
        }
    }

    @Nested
    @DisplayName("Create Label Tests")
    class CreateLabelTests {

        @Test
        @DisplayName("Should create label successfully")
        void createLabel_Success() {
            // Arrange
            CreateLabelRequest request = new CreateLabelRequest();
            request.setBoardId(1L);
            request.setName("Feature");
            request.setColor("#00ff00");

            doNothing().when(authorizationService).verifyBoardOwnership(1L);
            when(boardRepository.findById(1L)).thenReturn(Optional.of(testBoard));
            when(labelRepository.existsByNameAndBoard("Feature", testBoard)).thenReturn(false);
            when(labelRepository.save(any(Label.class))).thenAnswer(invocation -> {
                Label label = invocation.getArgument(0);
                label.setId(2L);
                return label;
            });

            // Act
            LabelDto response = labelService.createLabel(request);

            // Assert
            assertThat(response).isNotNull();
            assertThat(response.getName()).isEqualTo("Feature");
            assertThat(response.getColor()).isEqualTo("#00ff00");
            verify(labelRepository).save(any(Label.class));
        }

        @Test
        @DisplayName("Should throw exception when label name already exists")
        void createLabel_DuplicateName_ThrowsException() {
            // Arrange
            CreateLabelRequest request = new CreateLabelRequest();
            request.setBoardId(1L);
            request.setName("Bug");
            request.setColor("#ff0000");

            doNothing().when(authorizationService).verifyBoardOwnership(1L);
            when(boardRepository.findById(1L)).thenReturn(Optional.of(testBoard));
            when(labelRepository.existsByNameAndBoard("Bug", testBoard)).thenReturn(true);

            // Act & Assert
            assertThatThrownBy(() -> labelService.createLabel(request))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Bu isimde bir etiket zaten var");

            verify(labelRepository, never()).save(any(Label.class));
        }

        @Test
        @DisplayName("Should throw exception when board not found")
        void createLabel_BoardNotFound_ThrowsException() {
            // Arrange
            CreateLabelRequest request = new CreateLabelRequest();
            request.setBoardId(999L);
            request.setName("Feature");
            request.setColor("#00ff00");

            doNothing().when(authorizationService).verifyBoardOwnership(999L);
            when(boardRepository.findById(999L)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> labelService.createLabel(request))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Pano bulunamadı");
        }
    }

    @Nested
    @DisplayName("Update Label Tests")
    class UpdateLabelTests {

        @Test
        @DisplayName("Should update label successfully")
        void updateLabel_Success() {
            // Arrange
            LabelDto updateRequest = new LabelDto();
            updateRequest.setName("Updated Bug");
            updateRequest.setColor("#ff00ff");

            doNothing().when(authorizationService).verifyLabelOwnership(1L);
            when(labelRepository.findById(1L)).thenReturn(Optional.of(testLabel));
            when(labelRepository.existsByNameAndBoard("Updated Bug", testBoard)).thenReturn(false);
            when(labelRepository.save(any(Label.class))).thenReturn(testLabel);

            // Act
            LabelDto response = labelService.updateLabel(1L, updateRequest);

            // Assert
            assertThat(response).isNotNull();
            verify(labelRepository).save(any(Label.class));
        }

        @Test
        @DisplayName("Should throw exception when new name already exists")
        void updateLabel_DuplicateName_ThrowsException() {
            // Arrange
            LabelDto updateRequest = new LabelDto();
            updateRequest.setName("Feature");
            updateRequest.setColor("#00ff00");

            doNothing().when(authorizationService).verifyLabelOwnership(1L);
            when(labelRepository.findById(1L)).thenReturn(Optional.of(testLabel));
            when(labelRepository.existsByNameAndBoard("Feature", testBoard)).thenReturn(true);

            // Act & Assert
            assertThatThrownBy(() -> labelService.updateLabel(1L, updateRequest))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Bu isimde bir etiket zaten var");
        }
    }

    @Nested
    @DisplayName("Delete Label Tests")
    class DeleteLabelTests {

        @Test
        @DisplayName("Should delete label successfully")
        void deleteLabel_Success() {
            // Arrange
            doNothing().when(authorizationService).verifyLabelOwnership(1L);
            when(labelRepository.findById(1L)).thenReturn(Optional.of(testLabel));
            when(taskListRepository.findByLabelsContaining(testLabel)).thenReturn(List.of());
            doNothing().when(labelRepository).delete(testLabel);

            // Act
            labelService.deleteLabel(1L);

            // Assert
            verify(labelRepository).delete(testLabel);
        }

        @Test
        @DisplayName("Should throw exception when label not found")
        void deleteLabel_NotFound_ThrowsException() {
            // Arrange
            doNothing().when(authorizationService).verifyLabelOwnership(999L);
            when(labelRepository.findById(999L)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> labelService.deleteLabel(999L))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Etiket bulunamadı");
        }
    }

    @Nested
    @DisplayName("Get Label Usage Tests")
    class GetLabelUsageTests {

        @Test
        @DisplayName("Should return affected task lists")
        void getLabelUsage_Success() {
            // Arrange
            TaskList taskList1 = new TaskList();
            taskList1.setId(1L);
            taskList1.setName("Todo");

            TaskList taskList2 = new TaskList();
            taskList2.setId(2L);
            taskList2.setName("In Progress");

            doNothing().when(authorizationService).verifyLabelOwnership(1L);
            when(labelRepository.findById(1L)).thenReturn(Optional.of(testLabel));
            when(taskListRepository.findByLabelsContaining(testLabel)).thenReturn(List.of(taskList1, taskList2));

            // Act
            List<TaskListUsageDto> result = labelService.getLabelUsage(1L);

            // Assert
            assertThat(result).hasSize(2);
            assertThat(result.get(0).getName()).isEqualTo("Todo");
            assertThat(result.get(1).getName()).isEqualTo("In Progress");
        }

        @Test
        @DisplayName("Should return empty list when label not used")
        void getLabelUsage_NoUsage() {
            // Arrange
            doNothing().when(authorizationService).verifyLabelOwnership(1L);
            when(labelRepository.findById(1L)).thenReturn(Optional.of(testLabel));
            when(taskListRepository.findByLabelsContaining(testLabel)).thenReturn(List.of());

            // Act
            List<TaskListUsageDto> result = labelService.getLabelUsage(1L);

            // Assert
            assertThat(result).isEmpty();
        }
    }
}
