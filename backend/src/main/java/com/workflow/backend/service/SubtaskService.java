package com.workflow.backend.service;

import com.workflow.backend.dto.CreateSubtaskRequest;
import com.workflow.backend.dto.SubtaskDto;
import com.workflow.backend.entity.AssignmentTargetType;
import com.workflow.backend.entity.Subtask;
import com.workflow.backend.entity.Task;
import com.workflow.backend.entity.TaskList;
import com.workflow.backend.repository.SubtaskRepository;
import com.workflow.backend.repository.TaskListRepository;
import com.workflow.backend.exception.DuplicateResourceException;
import com.workflow.backend.exception.ResourceNotFoundException;
import com.workflow.backend.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SubtaskService {

    private final SubtaskRepository subtaskRepository;
    private final TaskRepository taskRepository;
    private final TaskListRepository taskListRepository;
    private final AuthorizationService authorizationService;
    private final BoardMemberService boardMemberService;

    // Alt görev oluştur
    @Transactional
    public SubtaskDto createSubtask(CreateSubtaskRequest request) {
        // Kullanıcı sadece kendi görevine alt görev ekleyebilir
        authorizationService.verifyTaskOwnership(request.getTaskId());

        // Pessimistic lock on Task to prevent race condition in position calculation
        Task task = taskRepository.findByIdWithLock(request.getTaskId())
                .orElseThrow(() -> new ResourceNotFoundException("Görev", "id", request.getTaskId()));

        if (subtaskRepository.existsByTitleAndTask(request.getTitle(), task)) {
            throw new DuplicateResourceException("Alt görev", "title", request.getTitle());
        }

        // Yeni pozisyon hesapla
        Integer maxPosition = subtaskRepository.findMaxPositionByTaskId(task.getId());
        int newPosition = maxPosition + 1;

        Subtask subtask = new Subtask();
        subtask.setTitle(request.getTitle());
        subtask.setIsCompleted(false);
        subtask.setPosition(newPosition);
        subtask.setTask(task);
        subtask.setDescription(request.getDescription());
        subtask.setLink(request.getLink());

        Subtask saved = subtaskRepository.save(subtask);

        // Yeni alt görev eklendi → tamamlanmış task ve listeyi geri al
        if (Boolean.TRUE.equals(task.getIsCompleted())) {
            task.setIsCompleted(false);
            taskRepository.save(task);
        }
        TaskList parentList = task.getTaskList();
        if (Boolean.TRUE.equals(parentList.getIsCompleted())) {
            parentList.setIsCompleted(false);
            taskListRepository.save(parentList);
        }

        return mapToDto(saved);
    }

    // Alt görevi güncelle
    @Transactional
    public SubtaskDto updateSubtask(Long subtaskId, SubtaskDto request) {
        // Kullanıcı sadece kendi alt görevini güncelleyebilir
        authorizationService.verifySubtaskOwnership(subtaskId);

        Subtask subtask = subtaskRepository.findById(subtaskId)
                .orElseThrow(() -> new ResourceNotFoundException("Alt görev", "id", subtaskId));

        if (request.getTitle() != null && !request.getTitle().equals(subtask.getTitle())) {
            if (subtaskRepository.existsByTitleAndTask(request.getTitle(), subtask.getTask())) {
                throw new DuplicateResourceException("Alt görev", "title", request.getTitle());
            }
            subtask.setTitle(request.getTitle());
        }
        if (request.getIsCompleted() != null) {
            subtask.setIsCompleted(request.getIsCompleted());
        }
        if (request.getDescription() != null) {
            subtask.setDescription(request.getDescription());
        }
        if (request.getLink() != null) {
            subtask.setLink(request.getLink());
        }

        Subtask saved = subtaskRepository.save(subtask);

        // Cascade: subtask completion → task → list
        if (request.getIsCompleted() != null) {
            Task parentTask = subtask.getTask();
            List<Subtask> siblings = subtaskRepository.findByTaskIdOrderByPositionAsc(parentTask.getId());
            boolean allSubtasksCompleted = siblings.stream().allMatch(Subtask::getIsCompleted);
            parentTask.setIsCompleted(allSubtasksCompleted);
            taskRepository.save(parentTask);

            TaskList parentList = parentTask.getTaskList();
            List<Task> listTasks = taskRepository.findByTaskListIdOrderByPositionAsc(parentList.getId());
            boolean allTasksCompleted = listTasks.stream().allMatch(Task::getIsCompleted);
            parentList.setIsCompleted(allTasksCompleted);
            taskListRepository.save(parentList);
        }

        return mapToDto(saved);
    }

    // Alt görevi sil
    @Transactional
    public void deleteSubtask(Long subtaskId) {
        // Kullanıcı sadece kendi alt görevini silebilir
        authorizationService.verifySubtaskOwnership(subtaskId);

        Subtask subtask = subtaskRepository.findById(subtaskId)
                .orElseThrow(() -> new ResourceNotFoundException("Alt görev", "id", subtaskId));
        Task parentTask = subtask.getTask();
        TaskList parentList = parentTask.getTaskList();

        subtaskRepository.deleteById(subtaskId);

        // Cascade: kalan alt görevler tamamlandıysa → task ve list güncelle
        List<Subtask> remaining = subtaskRepository.findByTaskIdOrderByPositionAsc(parentTask.getId());
        if (!remaining.isEmpty()) {
            boolean allCompleted = remaining.stream().allMatch(Subtask::getIsCompleted);
            parentTask.setIsCompleted(allCompleted);
            taskRepository.save(parentTask);

            List<Task> listTasks = taskRepository.findByTaskListIdOrderByPositionAsc(parentList.getId());
            boolean allTasksCompleted = listTasks.stream().allMatch(Task::getIsCompleted);
            parentList.setIsCompleted(allTasksCompleted);
            taskListRepository.save(parentList);
        }
    }

    // Görevin alt görevlerini getir
    public List<SubtaskDto> getSubtasksByTaskId(Long taskId) {
        // Pano sahibi VEYA atanmış üye görevin alt görevlerini görebilir
        boardMemberService.verifyAccessToTask(taskId);

        return subtaskRepository.findByTaskIdOrderByPositionAsc(taskId)
                .stream()
                .map(this::mapToDto)
                .toList();
    }

    // Tamamlanma/tamamlanmama toggle
    @Transactional
    public SubtaskDto toggleComplete(Long subtaskId) {
        Subtask subtask = subtaskRepository.findById(subtaskId)
                .orElseThrow(() -> new ResourceNotFoundException("Alt görev", "id", subtaskId));

        // Pano sahibi VEYA atanmış üye toggle edebilir
        Long boardId = subtask.getTask().getTaskList().getBoard().getId();
        boardMemberService.verifyBoardOwnerOrAssignedMember(boardId, AssignmentTargetType.SUBTASK, subtaskId);

        subtask.setIsCompleted(!subtask.getIsCompleted());
        Subtask saved = subtaskRepository.save(subtask);

        // Cascade: subtask → task → list
        Task parentTask = subtask.getTask();
        List<Subtask> siblings = subtaskRepository.findByTaskIdOrderByPositionAsc(parentTask.getId());
        boolean allSubtasksCompleted = siblings.stream().allMatch(Subtask::getIsCompleted);
        parentTask.setIsCompleted(allSubtasksCompleted);
        taskRepository.save(parentTask);

        TaskList parentList = parentTask.getTaskList();
        List<Task> listTasks = taskRepository.findByTaskListIdOrderByPositionAsc(parentList.getId());
        boolean allTasksCompleted = listTasks.stream().allMatch(Task::getIsCompleted);
        parentList.setIsCompleted(allTasksCompleted);
        taskListRepository.save(parentList);

        return mapToDto(saved);
    }

    // Entity -> DTO
    private SubtaskDto mapToDto(Subtask subtask) {
        SubtaskDto dto = new SubtaskDto();
        dto.setId(subtask.getId());
        dto.setVersion(subtask.getVersion());
        dto.setTitle(subtask.getTitle());
        dto.setIsCompleted(subtask.getIsCompleted());
        dto.setPosition(subtask.getPosition());
        dto.setDescription(subtask.getDescription());
        dto.setLink(subtask.getLink());
        dto.setCreatedAt(subtask.getCreatedAt());
        return dto;
    }
}
