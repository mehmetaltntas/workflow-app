package com.workflow.backend.service;

import com.workflow.backend.dto.BoardMemberAssignmentDto;
import com.workflow.backend.dto.BoardMemberDto;
import com.workflow.backend.dto.BulkCreateAssignmentRequest;
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
import java.util.Map;
import java.util.Set;
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
    private final NotificationRepository notificationRepository;
    private final CurrentUserService currentUserService;
    private final AuthorizationService authorizationService;
    private final NotificationService notificationService;
    private final ConnectionService connectionService;

    // Üye ekle
    @Transactional
    public BoardMemberDto addMember(Long boardId, Long userId) {
        // Sadece pano sahibi üye ekleyebilir
        authorizationService.verifyBoardOwnership(boardId);

        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new ResourceNotFoundException("Pano", "id", boardId));

        if (board.getBoardType() == BoardType.INDIVIDUAL) {
            throw new IllegalStateException("Bireysel panolara sorumlu kişi eklenemez");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Kullanıcı", "id", userId));

        // Pano sahibi kendini üye olarak ekleyemez
        if (board.getUser().getId().equals(userId)) {
            throw new BadRequestException("Pano sahibi zaten tam yetkiye sahiptir.");
        }

        // Kabul edilmiş bağlantı kontrolü
        Long currentUserId = currentUserService.getCurrentUserId();
        if (!connectionRepository.existsBetweenUsersWithStatus(currentUserId, userId, ConnectionStatus.ACCEPTED)) {
            throw new BadRequestException("Bu kullanıcıyla kabul edilmiş bir bağlantınız bulunmamaktadır.");
        }

        // Mevcut üyelik kaydı kontrolü (REJECTED ise tekrar davet et, PENDING ise mevcut kaydı dön, ACCEPTED ise hata)
        java.util.Optional<BoardMember> existingMember = boardMemberRepository.findByBoardIdAndUserId(boardId, userId);
        if (existingMember.isPresent()) {
            BoardMember existing = existingMember.get();
            if (existing.getStatus() == BoardMemberStatus.REJECTED) {
                // Reddedilmiş daveti tekrar PENDING yap
                existing.setStatus(BoardMemberStatus.PENDING);
                BoardMember saved = boardMemberRepository.save(existing);

                // Davet bildirimi gönder
                User currentUser = currentUserService.getCurrentUser();
                String message = currentUser.getUsername() + " sizi \"" + board.getName() + "\" panosuna sorumlu kişi olarak davet etti.";
                notificationService.createNotification(user, currentUser, NotificationType.BOARD_MEMBER_INVITATION, message, saved.getId());

                return mapToDto(saved);
            }
            if (existing.getStatus() == BoardMemberStatus.PENDING) {
                // Zaten bekleyen davet var, mevcut kaydı dön (idempotent)
                return mapToDto(existing);
            }
            throw new DuplicateResourceException("Pano üyesi", "userId", userId);
        }

        BoardMember member = new BoardMember();
        member.setBoard(board);
        member.setUser(user);
        member.setStatus(BoardMemberStatus.PENDING);

        BoardMember saved = boardMemberRepository.save(member);

        // Davet bildirimi gönder
        User currentUser = currentUserService.getCurrentUser();
        String message = currentUser.getUsername() + " sizi \"" + board.getName() + "\" panosuna sorumlu kişi olarak davet etti.";
        notificationService.createNotification(user, currentUser, NotificationType.BOARD_MEMBER_INVITATION, message, saved.getId());

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

    // Pano üyelerini getir (sadece ACCEPTED) - bağlantı durumuna göre profil filtreleme
    @Transactional(readOnly = true)
    public List<BoardMemberDto> getMembers(Long boardId) {
        // Pano sahibi veya üye görebilir
        verifyBoardOwnerOrMember(boardId);

        Long currentUserId = currentUserService.getCurrentUserId();
        boolean isOwner = boardRepository.existsByIdAndUserId(boardId, currentUserId);

        List<BoardMember> members = boardMemberRepository.findAcceptedByBoardIdWithUser(boardId);

        Set<Long> connectedUserIds = null;
        if (!isOwner && !members.isEmpty()) {
            List<Long> memberUserIds = members.stream()
                    .map(m -> m.getUser().getId())
                    .filter(id -> !id.equals(currentUserId))
                    .collect(Collectors.toList());
            connectedUserIds = connectionService.getConnectedUserIds(currentUserId, memberUserIds);
        }

        final Set<Long> finalConnectedUserIds = connectedUserIds;
        final boolean finalIsOwner = isOwner;

        // Profil resmi URL'lerini toplu olarak ön-yükle (N+1 sorgu önleme)
        Set<Long> userIds = members.stream().map(m -> m.getUser().getId()).collect(Collectors.toSet());
        Map<Long, String> profilePictureMap = userIds.isEmpty() ? Map.of() :
                profilePictureRepository.findFilePathsByUserIds(userIds).stream()
                        .collect(Collectors.toMap(row -> (Long) row[0],
                                row -> "/users/" + row[0] + "/profile-picture"));

        return members.stream().map(member -> {
            boolean showProfile = finalIsOwner
                    || member.getUser().getId().equals(currentUserId)
                    || (finalConnectedUserIds != null && finalConnectedUserIds.contains(member.getUser().getId()));
            return mapToDto(member, showProfile, profilePictureMap);
        }).collect(Collectors.toList());
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

        // Aynı atama zaten var mı? (veritabanı sorgusu ile kontrol)
        if (assignmentRepository.existsByBoardMemberIdAndTargetTypeAndTargetId(memberId, targetType, request.getTargetId())) {
            throw new DuplicateResourceException("Atama", "target", request.getTargetType() + ":" + request.getTargetId());
        }

        BoardMemberAssignment assignment = new BoardMemberAssignment();
        assignment.setBoardMember(member);
        assignment.setTargetType(targetType);
        assignment.setTargetId(request.getTargetId());

        BoardMemberAssignment saved = assignmentRepository.save(assignment);
        return mapAssignmentToDto(saved);
    }

    // Toplu atama oluştur
    @Transactional
    public List<BoardMemberAssignmentDto> createBulkAssignment(Long boardId, Long memberId, BulkCreateAssignmentRequest request) {
        return request.getAssignments().stream()
                .map(assignmentRequest -> createAssignment(boardId, memberId, assignmentRequest))
                .collect(Collectors.toList());
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

    /**
     * Task'a erişim kontrolü: Pano sahibi VEYA atanmış üye.
     * @return true if owner, false if assigned member
     * @throws UnauthorizedAccessException eğer ne sahip ne de atanmış üye ise
     */
    public boolean verifyAccessToTask(Long taskId) {
        Long currentUserId = currentUserService.getCurrentUserId();

        // Pano sahibi kontrolü
        if (taskRepository.existsByIdAndTaskListBoardUserId(taskId, currentUserId)) {
            return true;
        }

        // Atanmış üye kontrolü
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Görev", "id", taskId));
        Long boardId = task.getTaskList().getBoard().getId();

        if (boardMemberRepository.existsAcceptedByBoardIdAndUserId(boardId, currentUserId)
                && isUserAssignedToTarget(currentUserId, boardId, AssignmentTargetType.TASK, taskId)) {
            return false; // Atanmış üye
        }

        throw new UnauthorizedAccessException("görev", taskId);
    }

    /**
     * TaskList'e erişim kontrolü: Pano sahibi VEYA atanmış üye.
     * @return true if owner, false if assigned member
     * @throws UnauthorizedAccessException eğer ne sahip ne de atanmış üye ise
     */
    public boolean verifyAccessToTaskList(Long taskListId) {
        Long currentUserId = currentUserService.getCurrentUserId();

        // Pano sahibi kontrolü
        if (taskListRepository.existsByIdAndBoardUserId(taskListId, currentUserId)) {
            return true;
        }

        // Atanmış üye kontrolü
        TaskList taskList = taskListRepository.findById(taskListId)
                .orElseThrow(() -> new ResourceNotFoundException("Liste", "id", taskListId));
        Long boardId = taskList.getBoard().getId();

        if (boardMemberRepository.existsAcceptedByBoardIdAndUserId(boardId, currentUserId)
                && isUserAssignedToTarget(currentUserId, boardId, AssignmentTargetType.LIST, taskListId)) {
            return false; // Atanmış üye
        }

        throw new UnauthorizedAccessException("liste", taskListId);
    }

    // Pano sahibi VEYA üye kontrolü (görüntüleme için)
    public void verifyBoardOwnerOrMember(Long boardId) {
        Long currentUserId = currentUserService.getCurrentUserId();
        if (boardRepository.existsByIdAndUserId(boardId, currentUserId)) {
            return; // Pano sahibi
        }
        if (boardMemberRepository.existsAcceptedByBoardIdAndUserId(boardId, currentUserId)) {
            return; // Kabul edilmiş pano üyesi
        }
        throw new UnauthorizedAccessException("pano", boardId);
    }

    // Pano sahibi VEYA atanmış üye kontrolü (toggle için)
    public void verifyBoardOwnerOrAssignedMember(Long boardId, AssignmentTargetType targetType, Long targetId) {
        Long currentUserId = currentUserService.getCurrentUserId();
        if (boardRepository.existsByIdAndUserId(boardId, currentUserId)) {
            return; // Pano sahibi
        }
        if (boardMemberRepository.existsAcceptedByBoardIdAndUserId(boardId, currentUserId)
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

    // Daveti kabul et
    @Transactional
    public BoardMemberDto acceptMemberInvitation(Long memberId) {
        Long currentUserId = currentUserService.getCurrentUserId();
        BoardMember member = boardMemberRepository.findPendingById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Davet", "id", memberId));

        // Sadece davet edilen kişi kabul edebilir
        if (!member.getUser().getId().equals(currentUserId)) {
            throw new UnauthorizedAccessException("davet", memberId);
        }

        member.setStatus(BoardMemberStatus.ACCEPTED);
        BoardMember saved = boardMemberRepository.save(member);

        // Davet bildirimini sil
        notificationRepository.deleteByReferenceIdAndType(memberId, NotificationType.BOARD_MEMBER_INVITATION);

        // Pano sahibine kabul bildirimi gönder
        User currentUser = currentUserService.getCurrentUser();
        User boardOwner = member.getBoard().getUser();
        String message = currentUser.getUsername() + " \"" + member.getBoard().getName() + "\" panosuna sorumlu kişi davetini kabul etti.";
        notificationService.createNotification(boardOwner, currentUser, NotificationType.BOARD_MEMBER_ACCEPTED, message, saved.getId());

        return mapToDto(saved);
    }

    // Daveti reddet
    @Transactional
    public void rejectMemberInvitation(Long memberId) {
        Long currentUserId = currentUserService.getCurrentUserId();
        BoardMember member = boardMemberRepository.findPendingById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Davet", "id", memberId));

        // Sadece davet edilen kişi reddedebilir
        if (!member.getUser().getId().equals(currentUserId)) {
            throw new UnauthorizedAccessException("davet", memberId);
        }

        // Davet bildirimini sil
        notificationRepository.deleteByReferenceIdAndType(memberId, NotificationType.BOARD_MEMBER_INVITATION);

        // Durumu REJECTED olarak güncelle (tekrar davet edilebilmesi için kayıt korunur)
        member.setStatus(BoardMemberStatus.REJECTED);
        boardMemberRepository.save(member);
    }

    // Bekleyen davetleri getir
    @Transactional(readOnly = true)
    public List<BoardMemberDto> getPendingInvitations() {
        Long currentUserId = currentUserService.getCurrentUserId();
        List<BoardMember> pendingMembers = boardMemberRepository.findPendingByUserId(currentUserId);

        // Profil resmi URL'lerini toplu olarak ön-yükle (N+1 sorgu önleme)
        Set<Long> userIds = pendingMembers.stream().map(m -> m.getUser().getId()).collect(Collectors.toSet());
        Map<Long, String> profilePictureMap = userIds.isEmpty() ? Map.of() :
                profilePictureRepository.findFilePathsByUserIds(userIds).stream()
                        .collect(Collectors.toMap(row -> (Long) row[0],
                                row -> "/users/" + row[0] + "/profile-picture"));

        return pendingMembers.stream()
                .map(m -> mapToDto(m, true, profilePictureMap))
                .collect(Collectors.toList());
    }

    // Entity -> DTO (tam profil bilgisi - geriye uyumlu)
    private BoardMemberDto mapToDto(BoardMember member) {
        return mapToDto(member, true);
    }

    // Entity -> DTO (profil bilgisi filtrelemeli)
    private BoardMemberDto mapToDto(BoardMember member, boolean showProfileInfo) {
        return mapToDto(member, showProfileInfo, null);
    }

    // Entity -> DTO (ön-yüklenmiş profil resimleri ile)
    private BoardMemberDto mapToDto(BoardMember member, boolean showProfileInfo, Map<Long, String> profilePictureMap) {
        BoardMemberDto dto = new BoardMemberDto();
        dto.setId(member.getId());
        dto.setUsername(member.getUser().getUsername());
        dto.setStatus(member.getStatus().name());
        dto.setCreatedAt(member.getCreatedAt());

        if (showProfileInfo) {
            dto.setUserId(member.getUser().getId());
            dto.setFirstName(member.getUser().getFirstName());
            dto.setLastName(member.getUser().getLastName());
            if (profilePictureMap != null) {
                dto.setProfilePicture(profilePictureMap.get(member.getUser().getId()));
            } else {
                dto.setProfilePicture(
                        profilePictureRepository.findFilePathByUserId(member.getUser().getId())
                                .map(fp -> "/users/" + member.getUser().getId() + "/profile-picture").orElse(null));
            }
        }

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
