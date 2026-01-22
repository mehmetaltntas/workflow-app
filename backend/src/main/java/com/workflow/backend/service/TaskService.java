package com.workflow.backend.service;

import com.workflow.backend.dto.*;
import com.workflow.backend.entity.Board;
import com.workflow.backend.entity.Task;
import com.workflow.backend.entity.TaskList;
import com.workflow.backend.repository.BoardRepository;
import com.workflow.backend.repository.TaskListRepository;
import com.workflow.backend.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TaskService {

    private static final Logger logger = LoggerFactory.getLogger(TaskService.class);

    private final TaskListRepository taskListRepository;
    private final TaskRepository taskRepository;
    private final BoardRepository boardRepository;

    // 1. YENİ LİSTE (SÜTUN) OLUŞTURMA
    public TaskListDto createTaskList(CreateTaskListRequest request) {
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
    @Transactional
    public TaskDto createTask(CreateTaskRequest request) {
        TaskList taskList = taskListRepository.findById(request.getTaskListId())
                .orElseThrow(() -> new RuntimeException("Liste bulunamadı!"));

        if (taskRepository.existsByTitleAndTaskList(request.getTitle(), taskList)) {
            throw new RuntimeException("Bu görev isminden bu listede zaten var!");
        }

        // POZİSYON HESABI: Listedeki en yüksek pozisyon + 1
        Integer maxPosition = taskRepository.findMaxPositionByListId(taskList.getId());
        int newPosition = maxPosition + 1;

        Task task = new Task();
        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        task.setPosition(newPosition);
        task.setTaskList(taskList);
        task.setLink(request.getLink());
        task.setDueDate(request.getDueDate());

        Task savedTask = taskRepository.save(task);
        logger.info("Yeni görev oluşturuldu: {} (pozisyon: {})", savedTask.getTitle(), savedTask.getPosition());

        return mapToDto(savedTask);
    }

    // 3. GÖREV TAŞIMA / SIRALAMA (Drag & Drop)
    @Transactional
    public TaskDto reorderTask(Long taskId, ReorderTaskRequest request) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Görev bulunamadı!"));

        TaskList targetList = taskListRepository.findById(request.getTargetListId())
                .orElseThrow(() -> new RuntimeException("Hedef liste bulunamadı!"));

        Long sourceListId = task.getTaskList().getId();
        Long targetListId = request.getTargetListId();
        Integer oldPosition = task.getPosition();
        Integer newPosition = request.getNewPosition();

        logger.info("Görev taşınıyor: {} | Kaynak: Liste {} Pozisyon {} | Hedef: Liste {} Pozisyon {}",
                task.getTitle(), sourceListId, oldPosition, targetListId, newPosition);

        // Aynı liste içinde mi taşınıyor?
        if (sourceListId.equals(targetListId)) {
            // Aynı liste içinde sıralama
            reorderWithinSameList(task, oldPosition, newPosition);
        } else {
            // Farklı listeye taşıma
            moveToAnotherList(task, sourceListId, targetList, newPosition);
        }

        task.setPosition(newPosition);
        task.setTaskList(targetList);
        Task savedTask = taskRepository.save(task);

        logger.info("Görev taşındı: {} -> Liste {} Pozisyon {}", savedTask.getTitle(), targetListId, newPosition);

        return mapToDto(savedTask);
    }

    private void reorderWithinSameList(Task task, Integer oldPosition, Integer newPosition) {
        Long listId = task.getTaskList().getId();

        if (oldPosition < newPosition) {
            // Aşağı taşınıyor: Aradaki elemanları yukarı kaydır
            taskRepository.findByTaskListIdOrderByPositionAsc(listId).stream()
                    .filter(t -> t.getPosition() > oldPosition && t.getPosition() <= newPosition)
                    .forEach(t -> {
                        t.setPosition(t.getPosition() - 1);
                        taskRepository.save(t);
                    });
        } else if (oldPosition > newPosition) {
            // Yukarı taşınıyor: Aradaki elemanları aşağı kaydır
            taskRepository.findByTaskListIdOrderByPositionAsc(listId).stream()
                    .filter(t -> t.getPosition() >= newPosition && t.getPosition() < oldPosition)
                    .forEach(t -> {
                        t.setPosition(t.getPosition() + 1);
                        taskRepository.save(t);
                    });
        }
    }

    private void moveToAnotherList(Task task, Long sourceListId, TaskList targetList, Integer newPosition) {
        Integer oldPosition = task.getPosition();

        // Kaynak listede: Eski pozisyondan sonrakileri yukarı kaydır
        taskRepository.decrementPositionsFrom(sourceListId, oldPosition);

        // Hedef listede: Yeni pozisyondan itibaren aşağı kaydır
        taskRepository.incrementPositionsFrom(targetList.getId(), newPosition);
    }

    // 4. TOPLU SIRALAMA (Batch Reorder)
    @Transactional
    public List<TaskDto> batchReorder(BatchReorderRequest request) {
        TaskList list = taskListRepository.findById(request.getListId())
                .orElseThrow(() -> new RuntimeException("Liste bulunamadı!"));

        logger.info("Toplu sıralama başlatıldı: Liste {} için {} görev", list.getName(), request.getTaskPositions().size());

        for (BatchReorderRequest.TaskPosition tp : request.getTaskPositions()) {
            Task task = taskRepository.findById(tp.getTaskId())
                    .orElseThrow(() -> new RuntimeException("Görev bulunamadı: " + tp.getTaskId()));

            if (!task.getTaskList().getId().equals(request.getListId())) {
                throw new RuntimeException("Görev bu listeye ait değil: " + tp.getTaskId());
            }

            task.setPosition(tp.getPosition());
            taskRepository.save(task);
        }

        List<Task> updatedTasks = taskRepository.findByTaskListIdOrderByPositionAsc(request.getListId());
        return updatedTasks.stream().map(this::mapToDto).toList();
    }

    // LİSTE SİL
    public void deleteTaskList(Long listId) {
        taskListRepository.deleteById(listId);
    }

    // LİSTE GÜNCELLE
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

        if (request.getIsCompleted() != null) {
            list.setIsCompleted(request.getIsCompleted());
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
    @Transactional
    public void deleteTask(Long taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Görev bulunamadı!"));

        Long listId = task.getTaskList().getId();
        Integer position = task.getPosition();

        taskRepository.deleteById(taskId);

        // Silinen görevden sonraki pozisyonları güncelle
        taskRepository.decrementPositionsFrom(listId, position);
    }

    // GÖREV GÜNCELLE
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
        // dueDate null olarak da gönderilebilir (tarihi kaldırmak için)
        task.setDueDate(request.getDueDate());

        return mapToDto(taskRepository.save(task));
    }

    // Entity -> DTO Çeviriciler
    private TaskDto mapToDto(Task task) {
        TaskDto dto = new TaskDto();
        dto.setId(task.getId());
        dto.setTitle(task.getTitle());
        dto.setDescription(task.getDescription());
        dto.setPosition(task.getPosition());
        dto.setLink(task.getLink());
        dto.setIsCompleted(task.getIsCompleted());
        dto.setCreatedAt(task.getCreatedAt());
        dto.setDueDate(task.getDueDate());
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
}
