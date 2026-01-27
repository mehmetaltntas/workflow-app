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

    boolean existsByTitleAndTask(String title, com.workflow.backend.entity.Task task);

    long countByTaskIdAndIsCompleted(Long taskId, Boolean isCompleted);

    // Authorization: Subtask'ın belirli bir kullanıcıya ait olup olmadığını kontrol et
    @Query("SELECT CASE WHEN COUNT(s) > 0 THEN true ELSE false END FROM Subtask s WHERE s.id = :subtaskId AND s.task.taskList.board.user.id = :userId")
    boolean existsByIdAndTaskTaskListBoardUserId(@Param("subtaskId") Long subtaskId, @Param("userId") Long userId);

    // Profil istatistikleri: Toplam ve tamamlanan alt gorev sayilari
    @Query("SELECT COUNT(s), SUM(CASE WHEN s.isCompleted = true THEN 1 ELSE 0 END) FROM Subtask s WHERE s.task.taskList.board.user.id = :userId")
    List<Object[]> countStatsForUser(@Param("userId") Long userId);
}
