package com.workflow.backend.service;

import com.workflow.backend.dto.*;
import com.workflow.backend.entity.Board;
import com.workflow.backend.entity.Label;
import com.workflow.backend.entity.Priority;
import com.workflow.backend.entity.Task;
import com.workflow.backend.entity.TaskList;
import com.workflow.backend.exception.DuplicateResourceException;
import com.workflow.backend.exception.ResourceNotFoundException;
import com.workflow.backend.repository.BoardRepository;
import com.workflow.backend.repository.LabelRepository;
import com.workflow.backend.repository.TaskListRepository;
import com.workflow.backend.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TaskService {

    private static final Logger logger = LoggerFactory.getLogger(TaskService.class);

    private final TaskListRepository taskListRepository;
    private final TaskRepository taskRepository;
    private final BoardRepository boardRepository;
    private final LabelRepository labelRepository;
    private final AuthorizationService authorizationService;

    // 1. YENİ LİSTE (SÜTUN) OLUŞTURMA
    @Transactional
    public TaskListDto createTaskList(CreateTaskListRequest request) {
        // Kullanıcı sadece kendi panosuna liste ekleyebilir
        authorizationService.verifyBoardOwnership(request.getBoardId());

        Board board = boardRepository.findById(request.getBoardId())
                .orElseThrow(() -> new ResourceNotFoundException("Pano", "id", request.getBoardId()));

        TaskList list = new TaskList();
        list.setName(request.getName());
        list.setDescription(request.getDescription());
        list.setLink(request.getLink());
        list.setDueDate(request.getDueDate());
        list.setBoard(board);

        // Öncelik
        if (request.getPriority() != null && !request.getPriority().isEmpty()) {
            try {
                list.setPriority(Priority.valueOf(request.getPriority()));
            } catch (IllegalArgumentException e) {
                // Geçersiz priority değeri, null olarak bırak
            }
        }

        // Etiketler
        if (request.getLabelIds() != null && !request.getLabelIds().isEmpty()) {
            List<Label> labels = labelRepository.findAllById(request.getLabelIds());
            for (Label label : labels) {
                if (!label.getBoard().getId().equals(board.getId())) {
                    throw new RuntimeException("Etiket bu panoya ait değil: " + label.getId());
                }
            }
            list.setLabels(new HashSet<>(labels));
        }

        if (taskListRepository.existsByNameAndBoard(request.getName(), board)) {
            throw new DuplicateResourceException("Liste", "name", request.getName());
        }

        TaskList savedList = taskListRepository.save(list);
        return mapToListDto(savedList);
    }

    // 2. YENİ GÖREV (KART) OLUŞTURMA
    @Transactional
    public TaskDto createTask(CreateTaskRequest request) {
        // Kullanıcı sadece kendi listesine görev ekleyebilir
        authorizationService.verifyTaskListOwnership(request.getTaskListId());

        TaskList taskList = taskListRepository.findById(request.getTaskListId())
                .orElseThrow(() -> new ResourceNotFoundException("Liste", "id", request.getTaskListId()));

        if (taskRepository.existsByTitleAndTaskList(request.getTitle(), taskList)) {
            throw new DuplicateResourceException("Görev", "title", request.getTitle());
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
        task.setPriority(request.getPriority());

        Task savedTask = taskRepository.save(task);
        logger.info("Yeni görev oluşturuldu: {} (pozisyon: {})", savedTask.getTitle(), savedTask.getPosition());

        // Yeni görev eklendi → tamamlanmış listeyi geri al
        if (Boolean.TRUE.equals(taskList.getIsCompleted())) {
            taskList.setIsCompleted(false);
            taskListRepository.save(taskList);
        }

        return mapToDto(savedTask);
    }

    // 3. GÖREV TAŞIMA / SIRALAMA (Drag & Drop)
    @Transactional
    public TaskDto reorderTask(Long taskId, ReorderTaskRequest request) {
        // Kullanıcı sadece kendi görevini taşıyabilir ve kendi listesine taşıyabilir
        authorizationService.verifyTaskOwnership(taskId);
        authorizationService.verifyTaskListOwnership(request.getTargetListId());

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Görev", "id", taskId));

        TaskList targetList = taskListRepository.findById(request.getTargetListId())
                .orElseThrow(() -> new ResourceNotFoundException("Hedef liste", "id", request.getTargetListId()));

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

        List<Task> tasksToUpdate;
        if (oldPosition < newPosition) {
            // Aşağı taşınıyor: Aradaki elemanları yukarı kaydır
            tasksToUpdate = taskRepository.findByTaskListIdOrderByPositionAsc(listId).stream()
                    .filter(t -> t.getPosition() > oldPosition && t.getPosition() <= newPosition)
                    .peek(t -> t.setPosition(t.getPosition() - 1))
                    .toList();
        } else if (oldPosition > newPosition) {
            // Yukarı taşınıyor: Aradaki elemanları aşağı kaydır
            tasksToUpdate = taskRepository.findByTaskListIdOrderByPositionAsc(listId).stream()
                    .filter(t -> t.getPosition() >= newPosition && t.getPosition() < oldPosition)
                    .peek(t -> t.setPosition(t.getPosition() + 1))
                    .toList();
        } else {
            return;
        }
        taskRepository.saveAll(tasksToUpdate);
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
        // Kullanıcı sadece kendi listesindeki görevleri sıralayabilir
        authorizationService.verifyTaskListOwnership(request.getListId());

        TaskList list = taskListRepository.findById(request.getListId())
                .orElseThrow(() -> new ResourceNotFoundException("Liste", "id", request.getListId()));

        logger.info("Toplu sıralama başlatıldı: Liste {} için {} görev", list.getName(), request.getTaskPositions().size());

        List<Task> tasksToUpdate = new java.util.ArrayList<>();
        for (BatchReorderRequest.TaskPosition tp : request.getTaskPositions()) {
            Task task = taskRepository.findById(tp.getTaskId())
                    .orElseThrow(() -> new ResourceNotFoundException("Görev", "id", tp.getTaskId()));

            if (!task.getTaskList().getId().equals(request.getListId())) {
                throw new RuntimeException("Görev bu listeye ait değil: " + tp.getTaskId());
            }

            task.setPosition(tp.getPosition());
            tasksToUpdate.add(task);
        }
        taskRepository.saveAll(tasksToUpdate);

        List<Task> updatedTasks = taskRepository.findByTaskListIdOrderByPositionAsc(request.getListId());
        return updatedTasks.stream().map(this::mapToDto).toList();
    }

    // LİSTE SİL
    public void deleteTaskList(Long listId) {
        // Kullanıcı sadece kendi listesini silebilir
        authorizationService.verifyTaskListOwnership(listId);
        taskListRepository.deleteById(listId);
    }

    // LİSTE GÜNCELLE
    @Transactional
    public TaskListDto updateTaskList(Long listId, TaskListDto request) {
        // Kullanıcı sadece kendi listesini güncelleyebilir
        authorizationService.verifyTaskListOwnership(listId);

        TaskList list = taskListRepository.findById(listId)
                .orElseThrow(() -> new ResourceNotFoundException("Liste", "id", listId));

        if (request.getName() != null && !request.getName().equals(list.getName())) {
            if (taskListRepository.existsByNameAndBoard(request.getName(), list.getBoard())) {
                throw new DuplicateResourceException("Liste", "name", request.getName());
            }
            list.setName(request.getName());
        }

        if (request.getDescription() != null) {
            list.setDescription(request.getDescription());
        }

        if (request.getLink() != null) {
            list.setLink(request.getLink());
        }

        // dueDate null olarak da gönderilebilir (tarihi kaldırmak için)
        list.setDueDate(request.getDueDate());

        // Öncelik
        if (request.getPriority() != null) {
            try {
                list.setPriority(Priority.valueOf(request.getPriority()));
            } catch (IllegalArgumentException e) {
                list.setPriority(null);
            }
        }

        // Etiketleri güncelle (labelIds gönderildiyse)
        if (request.getLabelIds() != null) {
            List<Label> labels = labelRepository.findAllById(request.getLabelIds());
            Long boardId = list.getBoard().getId();
            for (Label label : labels) {
                if (!label.getBoard().getId().equals(boardId)) {
                    throw new RuntimeException("Etiket bu panoya ait değil: " + label.getId());
                }
            }
            list.setLabels(new HashSet<>(labels));
        }

        if (request.getIsCompleted() != null) {
            list.setIsCompleted(request.getIsCompleted());
            if (list.getTasks() != null) {
                list.getTasks().forEach(task -> task.setIsCompleted(request.getIsCompleted()));
                taskRepository.saveAll(list.getTasks());
            }
        }

        TaskList savedList = taskListRepository.save(list);
        return mapToListDto(savedList);
    }

    // GÖREV SİL
    @Transactional
    public void deleteTask(Long taskId) {
        // Kullanıcı sadece kendi görevini silebilir
        authorizationService.verifyTaskOwnership(taskId);

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Görev", "id", taskId));

        Long listId = task.getTaskList().getId();
        Integer position = task.getPosition();

        TaskList parentList = task.getTaskList();

        taskRepository.deleteById(taskId);

        // Silinen görevden sonraki pozisyonları güncelle
        taskRepository.decrementPositionsFrom(listId, position);

        // Cascade: kalan görevler tamamlandıysa → list güncelle
        List<Task> remaining = taskRepository.findByTaskListIdOrderByPositionAsc(listId);
        if (!remaining.isEmpty()) {
            boolean allCompleted = remaining.stream().allMatch(Task::getIsCompleted);
            parentList.setIsCompleted(allCompleted);
            taskListRepository.save(parentList);
        }
    }

    // GÖREV GÜNCELLE
    @Transactional
    public TaskDto updateTask(Long taskId, TaskDto request) {
        // Kullanıcı sadece kendi görevini güncelleyebilir
        authorizationService.verifyTaskOwnership(taskId);

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Görev", "id", taskId));

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
        // priority null olarak da gönderilebilir
        if (request.getPriority() != null)
            task.setPriority(request.getPriority());

        // Etiketleri güncelle (labelIds gönderildiyse)
        if (request.getLabelIds() != null) {
            List<Label> labels = labelRepository.findAllById(request.getLabelIds());
            Long boardId = task.getTaskList().getBoard().getId();
            for (Label label : labels) {
                if (!label.getBoard().getId().equals(boardId)) {
                    throw new RuntimeException("Etiket bu panoya ait değil: " + label.getId());
                }
            }
            task.setLabels(new HashSet<>(labels));
        }

        Task savedTask = taskRepository.save(task);

        // Cascade: task completion → list completion
        if (request.getIsCompleted() != null) {
            TaskList parentList = task.getTaskList();
            List<Task> listTasks = taskRepository.findByTaskListIdOrderByPositionAsc(parentList.getId());
            boolean allTasksCompleted = listTasks.stream().allMatch(Task::getIsCompleted);
            parentList.setIsCompleted(allTasksCompleted);
            taskListRepository.save(parentList);
        }

        return mapToDto(savedTask);
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
        dto.setPriority(task.getPriority());

        // Etiketleri ekle
        if (task.getLabels() != null && !task.getLabels().isEmpty()) {
            dto.setLabels(task.getLabels().stream().map(label -> {
                LabelDto labelDto = new LabelDto();
                labelDto.setId(label.getId());
                labelDto.setName(label.getName());
                labelDto.setColor(label.getColor());
                return labelDto;
            }).toList());
        }

        // Alt görevleri ekle
        if (task.getSubtasks() != null && !task.getSubtasks().isEmpty()) {
            dto.setSubtasks(task.getSubtasks().stream().map(subtask -> {
                SubtaskDto subtaskDto = new SubtaskDto();
                subtaskDto.setId(subtask.getId());
                subtaskDto.setTitle(subtask.getTitle());
                subtaskDto.setIsCompleted(subtask.getIsCompleted());
                subtaskDto.setPosition(subtask.getPosition());
                return subtaskDto;
            }).toList());
        }

        return dto;
    }

    private TaskListDto mapToListDto(TaskList list) {
        TaskListDto dto = new TaskListDto();
        dto.setId(list.getId());
        dto.setName(list.getName());
        dto.setDescription(list.getDescription());
        dto.setLink(list.getLink());
        dto.setIsCompleted(list.getIsCompleted());
        dto.setDueDate(list.getDueDate());
        dto.setPriority(list.getPriority() != null ? list.getPriority().name() : null);
        dto.setCreatedAt(list.getCreatedAt());

        // Etiketleri ekle
        if (list.getLabels() != null && !list.getLabels().isEmpty()) {
            dto.setLabels(list.getLabels().stream().map(label -> {
                LabelDto labelDto = new LabelDto();
                labelDto.setId(label.getId());
                labelDto.setName(label.getName());
                labelDto.setColor(label.getColor());
                return labelDto;
            }).toList());
        }

        if (list.getTasks() != null) {
            dto.setTasks(list.getTasks().stream().map(this::mapToDto).toList());
        } else {
            dto.setTasks(List.of());
        }
        return dto;
    }
}
