package com.workflow.backend.repository;

import com.workflow.backend.entity.Board;
import com.workflow.backend.entity.Label;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LabelRepository extends JpaRepository<Label, Long> {

    List<Label> findByBoardId(Long boardId);

    List<Label> findByBoard(Board board);

    boolean existsByNameAndBoard(String name, Board board);
}
