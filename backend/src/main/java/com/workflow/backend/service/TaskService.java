package com.workflow.backend.service;

import com.workflow.backend.dto.CreateTaskListRequest;
import com.workflow.backend.dto.CreateTaskRequest;
import com.workflow.backend.dto.TaskListDto;
import com.workflow.backend.dto.TaskDto;
import com.workflow.backend.entity.Board;
import com.workflow.backend.entity.Task;
import com.workflow.backend.entity.TaskList;
import com.workflow.backend.repository.BoardRepository;
import com.workflow.backend.repository.TaskListRepository;
import com.workflow.backend.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskListRepository taskListRepository;
    private final TaskRepository taskRepository;
    private final BoardRepository boardRepository;

    // 1. YENİ LİSTE (SÜTUN) OLUŞTURMA
    public TaskListDto createTaskList(CreateTaskListRequest request) {
        // Panoyu bul
        Board board = boardRepository.findById(request.getBoardId())
                .orElseThrow(() -> new RuntimeException("Pano bulunamadı!"));

        TaskList list = new TaskList();
        list.setName(request.getName());
        list.setLink(request.getLink());
        list.setBoard(board);

        if (taskListRepository.existsByNameAndBoard(request.getName(), board)) {
            throw new RuntimeException("Bu liste isminden zaten var!");
        }

        TaskList savedList = taskListRepository.save(list);
        return mapToListDto(savedList);
    }

    // 2. YENİ GÖREV (KART) OLUŞTURMA
    @Transactional // Veritabanı tutarlılığı için (Sıralama işlemi önemli)
    public TaskDto createTask(CreateTaskRequest request) {
        // Listeyi bul
        TaskList taskList = taskListRepository.findById(request.getTaskListId())
                .orElseThrow(() -> new RuntimeException("Liste bulunamadı!"));

        if (taskRepository.existsByTitleAndTaskList(request.getTitle(), taskList)) {
            throw new RuntimeException("Bu görev isminden bu listede zaten var!");
        }

        // POZİSYON HESABI: Mevcut listede kaç görev var?
        List<Task> existingTasks = taskRepository.findByTaskListId(taskList.getId());
        int newPosition = existingTasks.size(); // 0 tane varsa 0. sıraya, 5 tane varsa 6. sıraya

        Task task = new Task();
        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        task.setPosition(newPosition); // Otomatik hesaplanan sıra
        task.setTaskList(taskList);
        task.setLink(request.getLink());

        Task savedTask = taskRepository.save(task);

        return mapToDto(savedTask);
    }

    // Entity -> DTO Çevirici
    private TaskDto mapToDto(Task task) {
        TaskDto dto = new TaskDto();
        dto.setId(task.getId());
        dto.setTitle(task.getTitle());
        dto.setDescription(task.getDescription());
        dto.setPosition(task.getPosition());
        dto.setLink(task.getLink());
        dto.setIsCompleted(task.getIsCompleted());
        dto.setCreatedAt(task.getCreatedAt());
        return dto;
    }

    private TaskListDto mapToListDto(TaskList list) {
        TaskListDto dto = new TaskListDto();
        dto.setId(list.getId());
        dto.setName(list.getName());
        dto.setLink(list.getLink());
        dto.setIsCompleted(list.getIsCompleted());
        if (list.getTasks() != null) {
            dto.setTasks(list.getTasks().stream().map(this::mapToDto).toList());
        } else {
            dto.setTasks(List.of());
        }
        return dto;
    }

    // ... TaskService içinde ...

    // GÖREV TAŞIMA (Sürükle-Bırak için)

    // LİSTE SİL
    public void deleteTaskList(Long listId) {
        taskListRepository.deleteById(listId);
    }

    // LİSTE GÜNCELLE (isim, link, tamamlandı durumu)
    @Transactional
    public TaskListDto updateTaskList(Long listId, TaskListDto request) {
        TaskList list = taskListRepository.findById(listId)
                .orElseThrow(() -> new RuntimeException("Liste bulunamadı"));

        if (request.getName() != null && !request.getName().equals(list.getName())) {
            if (taskListRepository.existsByNameAndBoard(request.getName(), list.getBoard())) {
                throw new RuntimeException("Bu liste isminden zaten var!");
            }
            list.setName(request.getName());
        }

        if (request.getLink() != null) {
            list.setLink(request.getLink());
        }

        // Liste tamamlandı durumu değiştiyse, tüm görevleri de güncelle
        if (request.getIsCompleted() != null) {
            list.setIsCompleted(request.getIsCompleted());
            // Cascading: Liste tamamlandığında tüm görevleri de tamamla/geri al
            if (list.getTasks() != null) {
                for (Task task : list.getTasks()) {
                    task.setIsCompleted(request.getIsCompleted());
                    taskRepository.save(task);
                }
            }
        }

        TaskList savedList = taskListRepository.save(list);
        return mapToListDto(savedList);
    }

    // GÖREV SİL
    public void deleteTask(Long taskId) {
        taskRepository.deleteById(taskId);
    }

    // GÖREV GÜNCELLE (Tamamlandı, Link, vb.)
    public TaskDto updateTask(Long taskId, TaskDto request) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Görev bulunamadı"));

        if (request.getTitle() != null)
            task.setTitle(request.getTitle());
        if (request.getDescription() != null)
            task.setDescription(request.getDescription());
        if (request.getLink() != null)
            task.setLink(request.getLink());
        if (request.getIsCompleted() != null)
            task.setIsCompleted(request.getIsCompleted());

        return mapToDto(taskRepository.save(task));
    }
}