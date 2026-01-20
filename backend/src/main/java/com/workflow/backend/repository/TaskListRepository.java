package com.workflow.backend.repository;

import com.workflow.backend.entity.TaskList;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TaskListRepository extends JpaRepository<TaskList, Long> {
    // Bir panodaki listeleri getir
    List<TaskList> findByBoardId(Long boardId);

    boolean existsByNameAndBoard(String name, com.workflow.backend.entity.Board board);
}