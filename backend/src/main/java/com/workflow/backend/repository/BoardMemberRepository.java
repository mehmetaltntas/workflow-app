package com.workflow.backend.repository;

import com.workflow.backend.entity.BoardMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface BoardMemberRepository extends JpaRepository<BoardMember, Long> {

    @Query("SELECT bm FROM BoardMember bm JOIN FETCH bm.user WHERE bm.board.id = :boardId")
    List<BoardMember> findByBoardIdWithUser(@Param("boardId") Long boardId);

    boolean existsByBoardIdAndUserId(Long boardId, Long userId);

    @Query("SELECT bm FROM BoardMember bm JOIN FETCH bm.user WHERE bm.board.id = :boardId AND bm.user.id = :userId")
    Optional<BoardMember> findByBoardIdAndUserId(@Param("boardId") Long boardId, @Param("userId") Long userId);

    void deleteByBoardIdAndUserId(Long boardId, Long userId);
}
