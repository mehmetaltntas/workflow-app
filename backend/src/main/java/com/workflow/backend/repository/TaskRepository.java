package com.workflow.backend.repository;

import com.workflow.backend.entity.Task;
import com.workflow.backend.entity.TaskList;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {

    // Bir listedeki görevleri pozisyona göre sıralı getir
    List<Task> findByTaskListIdOrderByPositionAsc(Long taskListId);

    // Bir listedeki görevleri getir (sırasız - eski metot uyumluluğu için)
    List<Task> findByTaskListId(Long taskListId);

    // Görev başlığı kontrolü
    boolean existsByTitleAndTaskList(String title, TaskList taskList);

    // Belirli pozisyondan sonraki görevlerin pozisyonunu artır
    @Modifying
    @Query("UPDATE Task t SET t.position = t.position + 1 WHERE t.taskList.id = :listId AND t.position >= :position")
    void incrementPositionsFrom(@Param("listId") Long listId, @Param("position") Integer position);

    // Belirli pozisyondan sonraki görevlerin pozisyonunu azalt
    @Modifying
    @Query("UPDATE Task t SET t.position = t.position - 1 WHERE t.taskList.id = :listId AND t.position > :position")
    void decrementPositionsFrom(@Param("listId") Long listId, @Param("position") Integer position);

    // Listedeki maksimum pozisyonu bul
    @Query("SELECT COALESCE(MAX(t.position), -1) FROM Task t WHERE t.taskList.id = :listId")
    Integer findMaxPositionByListId(@Param("listId") Long listId);
}
