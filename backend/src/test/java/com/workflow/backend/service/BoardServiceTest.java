package com.workflow.backend.service;

import com.workflow.backend.dto.BoardResponse;
import com.workflow.backend.dto.CreateBoardRequest;
import com.workflow.backend.dto.PaginatedResponse;
import com.workflow.backend.dto.UpdateBoardRequest;
import com.workflow.backend.entity.Board;
import com.workflow.backend.entity.User;
import com.workflow.backend.repository.BoardMemberRepository;
import com.workflow.backend.repository.BoardRepository;
import com.workflow.backend.repository.UserProfilePictureRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BoardServiceTest {

    @Mock
    private BoardRepository boardRepository;

    @Mock
    private BoardMemberRepository boardMemberRepository;

    @Mock
    private UserProfilePictureRepository profilePictureRepository;

    @Mock
    private CurrentUserService currentUserService;

    @Mock
    private AuthorizationService authorizationService;

    @Mock
    private LabelService labelService;

    @Mock
    private ConnectionService connectionService;

    @Mock
    private CacheManager cacheManager;

    @Mock
    private Cache mockCache;

    @InjectMocks
    private BoardService boardService;

    private User testUser;
    private Board testBoard;
    private CreateBoardRequest createBoardRequest;

    @BeforeEach
    void setUp() {
        lenient().when(cacheManager.getCache(anyString())).thenReturn(mockCache);

        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("testuser");
        testUser.setEmail("test@example.com");

        testBoard = new Board();
        testBoard.setId(1L);
        testBoard.setName("Test Board");
        testBoard.setSlug("test-board");
        testBoard.setStatus("PLANLANDI");
        testBoard.setUser(testUser);

        createBoardRequest = new CreateBoardRequest();
        createBoardRequest.setName("New Board");
        createBoardRequest.setStatus("PLANLANDI");
        createBoardRequest.setDescription("Test description");
    }

    @Nested
    @DisplayName("Create Board Tests")
    class CreateBoardTests {

        @Test
        @DisplayName("Should create board successfully")
        void createBoard_Success() {
            // Arrange
            when(currentUserService.getCurrentUser()).thenReturn(testUser);
            when(boardRepository.existsByNameAndUser("New Board", testUser)).thenReturn(false);
            when(boardRepository.existsBySlug(anyString())).thenReturn(false);
            when(boardRepository.save(any(Board.class))).thenAnswer(invocation -> {
                Board board = invocation.getArgument(0);
                board.setId(1L);
                return board;
            });

            // Act
            BoardResponse response = boardService.createBoard(createBoardRequest);

            // Assert
            assertThat(response).isNotNull();
            assertThat(response.getName()).isEqualTo("New Board");
            assertThat(response.getSlug()).isEqualTo("new-board");
            verify(boardRepository).save(any(Board.class));
        }

        @Test
        @DisplayName("Should generate unique slug when collision occurs")
        void createBoard_GeneratesUniqueSlug() {
            // Arrange
            when(currentUserService.getCurrentUser()).thenReturn(testUser);
            when(boardRepository.existsByNameAndUser("New Board", testUser)).thenReturn(false);
            when(boardRepository.existsBySlug("new-board")).thenReturn(true);
            when(boardRepository.existsBySlug("new-board-1")).thenReturn(false);
            when(boardRepository.save(any(Board.class))).thenAnswer(invocation -> {
                Board board = invocation.getArgument(0);
                board.setId(1L);
                return board;
            });

            // Act
            BoardResponse response = boardService.createBoard(createBoardRequest);

            // Assert
            assertThat(response).isNotNull();
            assertThat(response.getSlug()).isEqualTo("new-board-1");
        }

        @Test
        @DisplayName("Should throw exception when board name already exists")
        void createBoard_DuplicateName_ThrowsException() {
            // Arrange
            when(currentUserService.getCurrentUser()).thenReturn(testUser);
            when(boardRepository.existsByNameAndUser("New Board", testUser)).thenReturn(true);

            // Act & Assert
            assertThatThrownBy(() -> boardService.createBoard(createBoardRequest))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("zaten mevcut");

            verify(boardRepository, never()).save(any(Board.class));
        }
    }

    @Nested
    @DisplayName("Get Boards Tests")
    class GetBoardsTests {

        @Test
        @DisplayName("Should return paginated boards")
        void getAllBoards_ReturnsPaginatedResult() {
            // Arrange
            Pageable pageable = PageRequest.of(0, 10);
            Page<Board> boardPage = new PageImpl<>(List.of(testBoard), pageable, 1);

            doNothing().when(authorizationService).verifyUserOwnership(1L);
            when(boardRepository.findByUserId(1L, pageable)).thenReturn(boardPage);

            // Act
            PaginatedResponse<BoardResponse> response = boardService.getAllBoards(1L, pageable);

            // Assert
            assertThat(response).isNotNull();
            assertThat(response.content()).hasSize(1);
            assertThat(response.totalElements()).isEqualTo(1);
            assertThat(response.first()).isTrue();
            assertThat(response.last()).isTrue();
        }
    }

    @Nested
    @DisplayName("Get Board Details Tests")
    class GetBoardDetailsTests {

        @Test
        @DisplayName("Should return board details by slug")
        void getBoardDetails_Success() {
            // Arrange
            when(boardRepository.findBySlugWithUser("test-board")).thenReturn(Optional.of(testBoard));
            when(currentUserService.getCurrentUserId()).thenReturn(1L); // Same as board owner

            // Act
            BoardResponse response = boardService.getBoardDetails("test-board");

            // Assert
            assertThat(response).isNotNull();
            assertThat(response.getName()).isEqualTo("Test Board");
            assertThat(response.getSlug()).isEqualTo("test-board");
        }

        @Test
        @DisplayName("Should throw exception when board not found")
        void getBoardDetails_NotFound_ThrowsException() {
            // Arrange
            when(boardRepository.findBySlugWithUser("nonexistent")).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> boardService.getBoardDetails("nonexistent"))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Pano bulunamadı");
        }
    }

    @Nested
    @DisplayName("Update Board Tests")
    class UpdateBoardTests {

        @Test
        @DisplayName("Should update board successfully")
        void updateBoard_Success() {
            // Arrange
            UpdateBoardRequest updateRequest = new UpdateBoardRequest();
            updateRequest.setName("Updated Board");
            updateRequest.setStatus("DEVAM_EDIYOR");

            doNothing().when(authorizationService).verifyBoardOwnership(1L);
            when(boardRepository.findById(1L)).thenReturn(Optional.of(testBoard));
            when(boardRepository.existsByNameAndUser("Updated Board", testUser)).thenReturn(false);
            when(boardRepository.save(any(Board.class))).thenReturn(testBoard);

            // Act
            BoardResponse response = boardService.updateBoard(1L, updateRequest);

            // Assert
            assertThat(response).isNotNull();
            verify(boardRepository).save(any(Board.class));
        }
    }

    @Nested
    @DisplayName("Delete Board Tests")
    class DeleteBoardTests {

        @Test
        @DisplayName("Should delete board successfully")
        void deleteBoard_Success() {
            // Arrange
            doNothing().when(authorizationService).verifyBoardOwnership(1L);
            when(boardRepository.findById(1L)).thenReturn(Optional.of(testBoard));
            doNothing().when(boardRepository).deleteById(1L);

            // Act
            boardService.deleteBoard(1L);

            // Assert
            verify(boardRepository).deleteById(1L);
        }
    }
}
