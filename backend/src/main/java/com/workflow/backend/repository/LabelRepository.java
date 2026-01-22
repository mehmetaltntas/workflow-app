package com.workflow.backend.repository;

import com.workflow.backend.entity.Board;
import com.workflow.backend.entity.Label;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface LabelRepository extends JpaRepository<Label, Long> {

    List<Label> findByBoardId(Long boardId);

    List<Label> findByBoard(Board board);

    boolean existsByNameAndBoard(String name, Board board);

    // Authorization: Label'ın belirli bir kullanıcıya ait olup olmadığını kontrol et
    @Query("SELECT CASE WHEN COUNT(l) > 0 THEN true ELSE false END FROM Label l WHERE l.id = :labelId AND l.board.user.id = :userId")
    boolean existsByIdAndBoardUserId(@Param("labelId") Long labelId, @Param("userId") Long userId);
}
