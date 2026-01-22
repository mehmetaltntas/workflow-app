package com.workflow.backend.repository;

import com.workflow.backend.entity.Subtask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SubtaskRepository extends JpaRepository<Subtask, Long> {

    List<Subtask> findByTaskIdOrderByPositionAsc(Long taskId);

    @Query("SELECT COALESCE(MAX(s.position), -1) FROM Subtask s WHERE s.task.id = :taskId")
    Integer findMaxPositionByTaskId(Long taskId);

    long countByTaskIdAndIsCompleted(Long taskId, Boolean isCompleted);

    // Authorization: Subtask'ın belirli bir kullanıcıya ait olup olmadığını kontrol et
    @Query("SELECT CASE WHEN COUNT(s) > 0 THEN true ELSE false END FROM Subtask s WHERE s.id = :subtaskId AND s.task.taskList.board.user.id = :userId")
    boolean existsByIdAndTaskTaskListBoardUserId(@Param("subtaskId") Long subtaskId, @Param("userId") Long userId);
}
