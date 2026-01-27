package com.workflow.backend.service;

import com.workflow.backend.dto.BoardMemberAssignmentDto;
import com.workflow.backend.dto.BoardMemberDto;
import com.workflow.backend.dto.CreateAssignmentRequest;
import com.workflow.backend.entity.*;
import com.workflow.backend.exception.BadRequestException;
import com.workflow.backend.exception.DuplicateResourceException;
import com.workflow.backend.exception.ResourceNotFoundException;
import com.workflow.backend.exception.UnauthorizedAccessException;
import com.workflow.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BoardMemberService {

    private final BoardMemberRepository boardMemberRepository;
    private final BoardMemberAssignmentRepository assignmentRepository;
    private final BoardRepository boardRepository;
    private final ConnectionRepository connectionRepository;
    private final UserRepository userRepository;
    private final TaskListRepository taskListRepository;
    private final TaskRepository taskRepository;
    private final SubtaskRepository subtaskRepository;
    private final UserProfilePictureRepository profilePictureRepository;
    private final CurrentUserService currentUserService;
    private final AuthorizationService authorizationService;

    // Üye ekle
    @Transactional
    public BoardMemberDto addMember(Long boardId, Long userId) {
        // Sadece pano sahibi üye ekleyebilir
        authorizationService.verifyBoardOwnership(boardId);

        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new ResourceNotFoundException("Pano", "id", boardId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Kullanıcı", "id", userId));

        // Pano sahibi kendini üye olarak ekleyemez
        if (board.getUser().getId().equals(userId)) {
            throw new BadRequestException("Pano sahibi zaten tam yetkiye sahiptir.");
        }

        // Zaten üye mi?
        if (boardMemberRepository.existsByBoardIdAndUserId(boardId, userId)) {
            throw new DuplicateResourceException("Pano üyesi", "userId", userId);
        }

        // Kabul edilmiş bağlantı kontrolü
        Long currentUserId = currentUserService.getCurrentUserId();
        if (!connectionRepository.existsBetweenUsersWithStatus(currentUserId, userId, ConnectionStatus.ACCEPTED)) {
            throw new BadRequestException("Bu kullanıcıyla kabul edilmiş bir bağlantınız bulunmamaktadır.");
        }

        BoardMember member = new BoardMember();
        member.setBoard(board);
        member.setUser(user);

        BoardMember saved = boardMemberRepository.save(member);
        return mapToDto(saved);
    }

    // Üye kaldır
    @Transactional
    public void removeMember(Long boardId, Long memberId) {
        // Sadece pano sahibi üye kaldırabilir
        authorizationService.verifyBoardOwnership(boardId);

        BoardMember member = boardMemberRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Pano üyesi", "id", memberId));

        if (!member.getBoard().getId().equals(boardId)) {
            throw new BadRequestException("Bu üye belirtilen panoya ait değil.");
        }

        boardMemberRepository.delete(member);
    }

    // Pano üyelerini getir
    @Transactional(readOnly = true)
    public List<BoardMemberDto> getMembers(Long boardId) {
        // Pano sahibi veya üye görebilir
        verifyBoardOwnerOrMember(boardId);

        List<BoardMember> members = boardMemberRepository.findByBoardIdWithUser(boardId);
        return members.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    // Atama oluştur
    @Transactional
    public BoardMemberAssignmentDto createAssignment(Long boardId, Long memberId, CreateAssignmentRequest request) {
        // Sadece pano sahibi atama yapabilir
        authorizationService.verifyBoardOwnership(boardId);

        BoardMember member = boardMemberRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Pano üyesi", "id", memberId));

        if (!member.getBoard().getId().equals(boardId)) {
            throw new BadRequestException("Bu üye belirtilen panoya ait değil.");
        }

        AssignmentTargetType targetType;
        try {
            targetType = AssignmentTargetType.valueOf(request.getTargetType());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Geçersiz hedef tipi: " + request.getTargetType());
        }

        // Hedef doğrulama - hedefin bu panoya ait olduğunu kontrol et
        validateTargetBelongsToBoard(boardId, targetType, request.getTargetId());

        // Aynı atama zaten var mı?
        boolean exists = member.getAssignments().stream()
                .anyMatch(a -> a.getTargetType() == targetType && a.getTargetId().equals(request.getTargetId()));
        if (exists) {
            throw new DuplicateResourceException("Atama", "target", request.getTargetType() + ":" + request.getTargetId());
        }

        BoardMemberAssignment assignment = new BoardMemberAssignment();
        assignment.setBoardMember(member);
        assignment.setTargetType(targetType);
        assignment.setTargetId(request.getTargetId());

        BoardMemberAssignment saved = assignmentRepository.save(assignment);
        return mapAssignmentToDto(saved);
    }

    // Atama kaldır
    @Transactional
    public void removeAssignment(Long boardId, Long memberId, Long assignmentId) {
        // Sadece pano sahibi atama kaldırabilir
        authorizationService.verifyBoardOwnership(boardId);

        BoardMemberAssignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Atama", "id", assignmentId));

        if (!assignment.getBoardMember().getId().equals(memberId)) {
            throw new BadRequestException("Bu atama belirtilen üyeye ait değil.");
        }

        if (!assignment.getBoardMember().getBoard().getId().equals(boardId)) {
            throw new BadRequestException("Bu atama belirtilen panoya ait değil.");
        }

        assignmentRepository.delete(assignment);
    }

    // Kullanıcının belirli bir hedefe atanmış olup olmadığını kontrol et (kalıtım mantığı ile)
    public boolean isUserAssignedToTarget(Long userId, Long boardId, AssignmentTargetType targetType, Long targetId) {
        // Önce direkt atama kontrolü
        if (assignmentRepository.existsByUserAndTarget(userId, targetType, targetId)) {
            return true;
        }

        // Kalıtım mantığı
        switch (targetType) {
            case SUBTASK:
                // Subtask için: üst task'a atanmış mı?
                return subtaskRepository.findById(targetId)
                        .map(subtask -> {
                            Long taskId = subtask.getTask().getId();
                            if (assignmentRepository.existsByUserAndTarget(userId, AssignmentTargetType.TASK, taskId)) {
                                return true;
                            }
                            // Üst liste'ye atanmış mı?
                            Long listId = subtask.getTask().getTaskList().getId();
                            return assignmentRepository.existsByUserAndTarget(userId, AssignmentTargetType.LIST, listId);
                        })
                        .orElse(false);

            case TASK:
                // Task için: üst liste'ye atanmış mı?
                return taskRepository.findById(targetId)
                        .map(task -> {
                            Long listId = task.getTaskList().getId();
                            return assignmentRepository.existsByUserAndTarget(userId, AssignmentTargetType.LIST, listId);
                        })
                        .orElse(false);

            case LIST:
                // Liste için: sadece direkt atama (zaten yukarıda kontrol edildi)
                return false;

            default:
                return false;
        }
    }

    // Pano sahibi VEYA üye kontrolü (görüntüleme için)
    public void verifyBoardOwnerOrMember(Long boardId) {
        Long currentUserId = currentUserService.getCurrentUserId();
        if (boardRepository.existsByIdAndUserId(boardId, currentUserId)) {
            return; // Pano sahibi
        }
        if (boardMemberRepository.existsByBoardIdAndUserId(boardId, currentUserId)) {
            return; // Pano üyesi
        }
        throw new UnauthorizedAccessException("pano", boardId);
    }

    // Pano sahibi VEYA atanmış üye kontrolü (toggle için)
    public void verifyBoardOwnerOrAssignedMember(Long boardId, AssignmentTargetType targetType, Long targetId) {
        Long currentUserId = currentUserService.getCurrentUserId();
        if (boardRepository.existsByIdAndUserId(boardId, currentUserId)) {
            return; // Pano sahibi
        }
        if (boardMemberRepository.existsByBoardIdAndUserId(boardId, currentUserId)
                && isUserAssignedToTarget(currentUserId, boardId, targetType, targetId)) {
            return; // Atanmış üye
        }
        throw new UnauthorizedAccessException("pano", boardId);
    }

    // Hedefin panoya ait olduğunu doğrula
    private void validateTargetBelongsToBoard(Long boardId, AssignmentTargetType targetType, Long targetId) {
        switch (targetType) {
            case LIST:
                TaskList list = taskListRepository.findById(targetId)
                        .orElseThrow(() -> new ResourceNotFoundException("Liste", "id", targetId));
                if (!list.getBoard().getId().equals(boardId)) {
                    throw new BadRequestException("Seçilen liste bu panoya ait değil.");
                }
                break;
            case TASK:
                Task task = taskRepository.findById(targetId)
                        .orElseThrow(() -> new ResourceNotFoundException("Görev", "id", targetId));
                if (!task.getTaskList().getBoard().getId().equals(boardId)) {
                    throw new BadRequestException("Seçilen görev bu panoya ait değil.");
                }
                break;
            case SUBTASK:
                Subtask subtask = subtaskRepository.findById(targetId)
                        .orElseThrow(() -> new ResourceNotFoundException("Alt görev", "id", targetId));
                if (!subtask.getTask().getTaskList().getBoard().getId().equals(boardId)) {
                    throw new BadRequestException("Seçilen alt görev bu panoya ait değil.");
                }
                break;
        }
    }

    // Entity -> DTO
    private BoardMemberDto mapToDto(BoardMember member) {
        BoardMemberDto dto = new BoardMemberDto();
        dto.setId(member.getId());
        dto.setUserId(member.getUser().getId());
        dto.setUsername(member.getUser().getUsername());
        dto.setProfilePicture(
                profilePictureRepository.findPictureDataByUserId(member.getUser().getId()).orElse(null));
        dto.setCreatedAt(member.getCreatedAt());

        if (member.getAssignments() != null && !member.getAssignments().isEmpty()) {
            dto.setAssignments(member.getAssignments().stream()
                    .map(this::mapAssignmentToDto)
                    .collect(Collectors.toList()));
        }

        return dto;
    }

    private BoardMemberAssignmentDto mapAssignmentToDto(BoardMemberAssignment assignment) {
        BoardMemberAssignmentDto dto = new BoardMemberAssignmentDto();
        dto.setId(assignment.getId());
        dto.setTargetType(assignment.getTargetType().name());
        dto.setTargetId(assignment.getTargetId());
        dto.setTargetName(resolveTargetName(assignment.getTargetType(), assignment.getTargetId()));
        dto.setCreatedAt(assignment.getCreatedAt());
        return dto;
    }

    // Hedefin adını çöz
    private String resolveTargetName(AssignmentTargetType targetType, Long targetId) {
        switch (targetType) {
            case LIST:
                return taskListRepository.findById(targetId).map(TaskList::getName).orElse("Silinmiş liste");
            case TASK:
                return taskRepository.findById(targetId).map(Task::getTitle).orElse("Silinmiş görev");
            case SUBTASK:
                return subtaskRepository.findById(targetId).map(Subtask::getTitle).orElse("Silinmiş alt görev");
            default:
                return "";
        }
    }
}
