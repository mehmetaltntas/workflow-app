package com.workflow.backend.repository;

import com.workflow.backend.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {
    // Bir listedeki görevleri getir
    List<Task> findByTaskListId(Long taskListId);

    boolean existsByTitleAndTaskList(String title, com.workflow.backend.entity.TaskList taskList);
}