package com.workflow.backend.repository;

import com.workflow.backend.entity.Label;
import com.workflow.backend.entity.TaskList;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TaskListRepository extends JpaRepository<TaskList, Long> {
    // Bir panodaki listeleri getir
    List<TaskList> findByBoardId(Long boardId);

    boolean existsByNameAndBoard(String name, com.workflow.backend.entity.Board board);

    // Authorization: TaskList'in belirli bir kullanıcıya ait olup olmadığını kontrol et
    @Query("SELECT CASE WHEN COUNT(tl) > 0 THEN true ELSE false END FROM TaskList tl WHERE tl.id = :taskListId AND tl.board.user.id = :userId")
    boolean existsByIdAndBoardUserId(@Param("taskListId") Long taskListId, @Param("userId") Long userId);

    // Belirli bir etiketi kullanan listeleri getir
    @Query("SELECT tl FROM TaskList tl JOIN tl.labels l WHERE l = :label")
    List<TaskList> findByLabelsContaining(@Param("label") Label label);
}