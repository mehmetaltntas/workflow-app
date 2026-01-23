package com.workflow.backend.controller;

import com.workflow.backend.dto.BoardResponse;
import com.workflow.backend.dto.CreateBoardRequest;
import com.workflow.backend.dto.PaginatedResponse;
import com.workflow.backend.service.BoardService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BoardControllerTest {

    @Mock
    private BoardService boardService;

    @InjectMocks
    private BoardController boardController;

    private CreateBoardRequest createBoardRequest;
    private BoardResponse boardResponse;

    @BeforeEach
    void setUp() {
        createBoardRequest = new CreateBoardRequest();
        createBoardRequest.setName("Test Board");
        createBoardRequest.setStatus("PLANLANDI");
        createBoardRequest.setDescription("Test description");

        boardResponse = new BoardResponse();
        boardResponse.setId(1L);
        boardResponse.setName("Test Board");
        boardResponse.setSlug("test-board");
        boardResponse.setStatus("PLANLANDI");
        boardResponse.setDescription("Test description");
        boardResponse.setOwnerName("testuser");
    }

    @Nested
    @DisplayName("Create Board Tests")
    class CreateBoardTests {

        @Test
        @DisplayName("Should create board and return 200")
        void createBoard_ValidRequest_Returns200() {
            // Arrange
            when(boardService.createBoard(any(CreateBoardRequest.class))).thenReturn(boardResponse);

            // Act
            ResponseEntity<BoardResponse> response = boardController.createBoard(createBoardRequest);

            // Assert
            assertThat(response.getStatusCode().value()).isEqualTo(200);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().getId()).isEqualTo(1L);
            assertThat(response.getBody().getName()).isEqualTo("Test Board");
            assertThat(response.getBody().getSlug()).isEqualTo("test-board");
        }

        @Test
        @DisplayName("Should throw exception for duplicate board name")
        void createBoard_DuplicateName_ThrowsException() {
            // Arrange
            when(boardService.createBoard(any(CreateBoardRequest.class)))
                    .thenThrow(new RuntimeException("Bu isimde bir pano zaten var!"));

            // Act & Assert
            assertThatThrownBy(() -> boardController.createBoard(createBoardRequest))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Bu isimde bir pano zaten var");
        }
    }

    @Nested
    @DisplayName("Get User Boards Tests")
    class GetUserBoardsTests {

        @Test
        @DisplayName("Should return paginated boards for user")
        void getUserBoards_ValidRequest_ReturnsPaginatedResponse() {
            // Arrange
            PaginatedResponse<BoardResponse> paginatedResponse = new PaginatedResponse<>(
                    List.of(boardResponse),
                    0,
                    10,
                    1L,
                    1,
                    true,
                    true
            );

            when(boardService.getAllBoards(eq(1L), any(Pageable.class))).thenReturn(paginatedResponse);

            // Act
            ResponseEntity<PaginatedResponse<BoardResponse>> response =
                    boardController.getUserBoards(1L, 0, 10, "id", "desc");

            // Assert
            assertThat(response.getStatusCode().value()).isEqualTo(200);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().content()).hasSize(1);
            assertThat(response.getBody().totalElements()).isEqualTo(1L);
        }
    }

    @Nested
    @DisplayName("Get Board Details Tests")
    class GetBoardDetailsTests {

        @Test
        @DisplayName("Should return board details by slug")
        void getBoardDetails_ValidSlug_ReturnsBoard() {
            // Arrange
            when(boardService.getBoardDetails("test-board")).thenReturn(boardResponse);

            // Act
            ResponseEntity<BoardResponse> response = boardController.getBoardDetails("test-board");

            // Assert
            assertThat(response.getStatusCode().value()).isEqualTo(200);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().getName()).isEqualTo("Test Board");
            assertThat(response.getBody().getSlug()).isEqualTo("test-board");
        }

        @Test
        @DisplayName("Should throw exception when board not found")
        void getBoardDetails_NotFound_ThrowsException() {
            // Arrange
            when(boardService.getBoardDetails("nonexistent"))
                    .thenThrow(new RuntimeException("Pano bulunamadı!"));

            // Act & Assert
            assertThatThrownBy(() -> boardController.getBoardDetails("nonexistent"))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Pano bulunamadı");
        }
    }

    @Nested
    @DisplayName("Update Board Tests")
    class UpdateBoardTests {

        @Test
        @DisplayName("Should update board and return 200")
        void updateBoard_ValidRequest_Returns200() {
            // Arrange
            CreateBoardRequest updateRequest = new CreateBoardRequest();
            updateRequest.setName("Updated Board");
            updateRequest.setStatus("DEVAM_EDIYOR");

            BoardResponse updatedResponse = new BoardResponse();
            updatedResponse.setId(1L);
            updatedResponse.setName("Updated Board");
            updatedResponse.setStatus("DEVAM_EDIYOR");

            when(boardService.updateBoard(eq(1L), any(CreateBoardRequest.class))).thenReturn(updatedResponse);

            // Act
            ResponseEntity<BoardResponse> response = boardController.updateBoard(1L, updateRequest);

            // Assert
            assertThat(response.getStatusCode().value()).isEqualTo(200);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().getName()).isEqualTo("Updated Board");
            assertThat(response.getBody().getStatus()).isEqualTo("DEVAM_EDIYOR");
        }
    }

    @Nested
    @DisplayName("Delete Board Tests")
    class DeleteBoardTests {

        @Test
        @DisplayName("Should delete board and return 204")
        void deleteBoard_ValidId_Returns204() {
            // Arrange
            doNothing().when(boardService).deleteBoard(1L);

            // Act
            ResponseEntity<Void> response = boardController.deleteBoard(1L);

            // Assert
            assertThat(response.getStatusCode().value()).isEqualTo(204);
            verify(boardService).deleteBoard(1L);
        }
    }

    @Nested
    @DisplayName("Update Board Status Tests")
    class UpdateBoardStatusTests {

        @Test
        @DisplayName("Should update board status and return 200")
        void updateBoardStatus_ValidRequest_Returns200() {
            // Arrange
            BoardResponse updatedResponse = new BoardResponse();
            updatedResponse.setId(1L);
            updatedResponse.setStatus("TAMAMLANDI");

            when(boardService.updateBoardStatus(eq(1L), any(String.class))).thenReturn(updatedResponse);

            // Act
            ResponseEntity<BoardResponse> response = boardController.updateBoardStatus(1L, "TAMAMLANDI");

            // Assert
            assertThat(response.getStatusCode().value()).isEqualTo(200);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().getStatus()).isEqualTo("TAMAMLANDI");
        }
    }
}
