package com.workflow.backend.repository;

import com.workflow.backend.entity.Subtask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SubtaskRepository extends JpaRepository<Subtask, Long> {

    List<Subtask> findByTaskIdOrderByPositionAsc(Long taskId);

    @Query("SELECT COALESCE(MAX(s.position), -1) FROM Subtask s WHERE s.task.id = :taskId")
    Integer findMaxPositionByTaskId(Long taskId);

    long countByTaskIdAndIsCompleted(Long taskId, Boolean isCompleted);
}
