package com.workflow.backend.repository;

import com.workflow.backend.entity.Task;
import com.workflow.backend.entity.TaskList;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TaskRepository extends JpaRepository<Task, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT t FROM Task t WHERE t.id = :id")
    Optional<Task> findByIdWithLock(@Param("id") Long id);

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

    // Authorization: Task'ın belirli bir kullanıcıya ait olup olmadığını kontrol et
    @Query("SELECT CASE WHEN COUNT(t) > 0 THEN true ELSE false END FROM Task t WHERE t.id = :taskId AND t.taskList.board.user.id = :userId")
    boolean existsByIdAndTaskListBoardUserId(@Param("taskId") Long taskId, @Param("userId") Long userId);

    // N+1 Optimizasyonu: Board'a ait tüm task'ları labels ile birlikte getir
    @Query("SELECT DISTINCT t FROM Task t " +
           "LEFT JOIN FETCH t.labels " +
           "WHERE t.taskList.board.id = :boardId")
    List<Task> findByBoardIdWithLabels(@Param("boardId") Long boardId);

    // N+1 Optimizasyonu: Board'a ait tüm task'ları subtasks ile birlikte getir
    @Query("SELECT DISTINCT t FROM Task t " +
           "LEFT JOIN FETCH t.subtasks " +
           "WHERE t.taskList.board.id = :boardId")
    List<Task> findByBoardIdWithSubtasks(@Param("boardId") Long boardId);

    // Profil istatistikleri: Toplam ve tamamlanan gorev sayilari
    @Query("SELECT COUNT(t), SUM(CASE WHEN t.isCompleted = true THEN 1 ELSE 0 END) FROM Task t WHERE t.taskList.board.user.id = :userId")
    List<Object[]> countStatsForUser(@Param("userId") Long userId);

    // Profil istatistikleri: Leaf-node progress icin alt gorevi olan/olmayan gorevler
    @Query("SELECT t.isCompleted, SIZE(t.subtasks) FROM Task t WHERE t.taskList.board.user.id = :userId")
    List<Object[]> findTaskSubtaskInfoForUser(@Param("userId") Long userId);

    // Profil istatistikleri: Bireysel panolardaki gorev sayilari
    @Query("SELECT COUNT(t), SUM(CASE WHEN t.isCompleted = true THEN 1 ELSE 0 END) FROM Task t WHERE t.taskList.board.user.id = :userId AND t.taskList.board.boardType = com.workflow.backend.entity.BoardType.INDIVIDUAL")
    List<Object[]> countIndividualStatsForUser(@Param("userId") Long userId);

    // Profil istatistikleri: Kullanicinin sahip oldugu ekip panolarindaki gorev sayilari
    @Query("SELECT COUNT(t), SUM(CASE WHEN t.isCompleted = true THEN 1 ELSE 0 END) FROM Task t WHERE t.taskList.board.user.id = :userId AND t.taskList.board.boardType = com.workflow.backend.entity.BoardType.TEAM")
    List<Object[]> countOwnedTeamTaskStatsForUser(@Param("userId") Long userId);
}
