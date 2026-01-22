package com.workflow.backend.service;

import com.workflow.backend.exception.UnauthorizedAccessException;
import com.workflow.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * Tüm yetkilendirme kontrollerini merkezi yöneten servis.
 * Kullanıcıların sadece kendi kaynaklarına erişmesini sağlar.
 */
@Service
@RequiredArgsConstructor
public class AuthorizationService {

    private final CurrentUserService currentUserService;
    private final BoardRepository boardRepository;
    private final TaskListRepository taskListRepository;
    private final TaskRepository taskRepository;
    private final LabelRepository labelRepository;
    private final SubtaskRepository subtaskRepository;

    /**
     * Board'un mevcut kullanıcıya ait olup olmadığını kontrol eder.
     * @param boardId kontrol edilecek board ID
     * @throws UnauthorizedAccessException eğer kullanıcı yetkili değilse
     */
    public void verifyBoardOwnership(Long boardId) {
        Long currentUserId = currentUserService.getCurrentUserId();
        if (!boardRepository.existsByIdAndUserId(boardId, currentUserId)) {
            throw new UnauthorizedAccessException("pano", boardId);
        }
    }

    /**
     * TaskList'in mevcut kullanıcıya ait olup olmadığını kontrol eder.
     * @param taskListId kontrol edilecek task list ID
     * @throws UnauthorizedAccessException eğer kullanıcı yetkili değilse
     */
    public void verifyTaskListOwnership(Long taskListId) {
        Long currentUserId = currentUserService.getCurrentUserId();
        if (!taskListRepository.existsByIdAndBoardUserId(taskListId, currentUserId)) {
            throw new UnauthorizedAccessException("liste", taskListId);
        }
    }

    /**
     * Task'ın mevcut kullanıcıya ait olup olmadığını kontrol eder.
     * @param taskId kontrol edilecek task ID
     * @throws UnauthorizedAccessException eğer kullanıcı yetkili değilse
     */
    public void verifyTaskOwnership(Long taskId) {
        Long currentUserId = currentUserService.getCurrentUserId();
        if (!taskRepository.existsByIdAndTaskListBoardUserId(taskId, currentUserId)) {
            throw new UnauthorizedAccessException("görev", taskId);
        }
    }

    /**
     * Label'ın mevcut kullanıcıya ait olup olmadığını kontrol eder.
     * @param labelId kontrol edilecek label ID
     * @throws UnauthorizedAccessException eğer kullanıcı yetkili değilse
     */
    public void verifyLabelOwnership(Long labelId) {
        Long currentUserId = currentUserService.getCurrentUserId();
        if (!labelRepository.existsByIdAndBoardUserId(labelId, currentUserId)) {
            throw new UnauthorizedAccessException("etiket", labelId);
        }
    }

    /**
     * Subtask'ın mevcut kullanıcıya ait olup olmadığını kontrol eder.
     * @param subtaskId kontrol edilecek subtask ID
     * @throws UnauthorizedAccessException eğer kullanıcı yetkili değilse
     */
    public void verifySubtaskOwnership(Long subtaskId) {
        Long currentUserId = currentUserService.getCurrentUserId();
        if (!subtaskRepository.existsByIdAndTaskTaskListBoardUserId(subtaskId, currentUserId)) {
            throw new UnauthorizedAccessException("alt görev", subtaskId);
        }
    }

    /**
     * Kullanıcının kendi kaydına erişip erişmediğini kontrol eder.
     * @param userId kontrol edilecek user ID
     * @throws UnauthorizedAccessException eğer kullanıcı başka birinin kaydına erişmeye çalışıyorsa
     */
    public void verifyUserOwnership(Long userId) {
        Long currentUserId = currentUserService.getCurrentUserId();
        if (!currentUserId.equals(userId)) {
            throw new UnauthorizedAccessException("kullanıcı", userId);
        }
    }
}
