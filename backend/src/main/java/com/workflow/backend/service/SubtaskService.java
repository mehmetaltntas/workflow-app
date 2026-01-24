package com.workflow.backend.service;

import com.workflow.backend.dto.CreateSubtaskRequest;
import com.workflow.backend.dto.SubtaskDto;
import com.workflow.backend.entity.Subtask;
import com.workflow.backend.entity.Task;
import com.workflow.backend.repository.SubtaskRepository;
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
    private final AuthorizationService authorizationService;

    // Alt görev oluştur
    @Transactional
    public SubtaskDto createSubtask(CreateSubtaskRequest request) {
        // Kullanıcı sadece kendi görevine alt görev ekleyebilir
        authorizationService.verifyTaskOwnership(request.getTaskId());

        Task task = taskRepository.findById(request.getTaskId())
                .orElseThrow(() -> new RuntimeException("Görev bulunamadı!"));

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
        return mapToDto(saved);
    }

    // Alt görevi güncelle
    @Transactional
    public SubtaskDto updateSubtask(Long subtaskId, SubtaskDto request) {
        // Kullanıcı sadece kendi alt görevini güncelleyebilir
        authorizationService.verifySubtaskOwnership(subtaskId);

        Subtask subtask = subtaskRepository.findById(subtaskId)
                .orElseThrow(() -> new RuntimeException("Alt görev bulunamadı!"));

        if (request.getTitle() != null) {
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
        return mapToDto(saved);
    }

    // Alt görevi sil
    @Transactional
    public void deleteSubtask(Long subtaskId) {
        // Kullanıcı sadece kendi alt görevini silebilir
        authorizationService.verifySubtaskOwnership(subtaskId);
        subtaskRepository.deleteById(subtaskId);
    }

    // Görevin alt görevlerini getir
    public List<SubtaskDto> getSubtasksByTaskId(Long taskId) {
        // Kullanıcı sadece kendi görevinin alt görevlerini görebilir
        authorizationService.verifyTaskOwnership(taskId);

        return subtaskRepository.findByTaskIdOrderByPositionAsc(taskId)
                .stream()
                .map(this::mapToDto)
                .toList();
    }

    // Tamamlanma/tamamlanmama toggle
    @Transactional
    public SubtaskDto toggleComplete(Long subtaskId) {
        // Kullanıcı sadece kendi alt görevini toggle edebilir
        authorizationService.verifySubtaskOwnership(subtaskId);

        Subtask subtask = subtaskRepository.findById(subtaskId)
                .orElseThrow(() -> new RuntimeException("Alt görev bulunamadı!"));

        subtask.setIsCompleted(!subtask.getIsCompleted());
        Subtask saved = subtaskRepository.save(subtask);
        return mapToDto(saved);
    }

    // Entity -> DTO
    private SubtaskDto mapToDto(Subtask subtask) {
        SubtaskDto dto = new SubtaskDto();
        dto.setId(subtask.getId());
        dto.setTitle(subtask.getTitle());
        dto.setIsCompleted(subtask.getIsCompleted());
        dto.setPosition(subtask.getPosition());
        dto.setDescription(subtask.getDescription());
        dto.setLink(subtask.getLink());
        return dto;
    }
}
