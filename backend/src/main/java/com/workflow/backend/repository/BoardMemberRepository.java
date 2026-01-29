package com.workflow.backend.repository;

import com.workflow.backend.entity.Board;
import com.workflow.backend.entity.BoardMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface BoardMemberRepository extends JpaRepository<BoardMember, Long> {

    @Query("SELECT bm FROM BoardMember bm JOIN FETCH bm.user WHERE bm.board.id = :boardId")
    List<BoardMember> findByBoardIdWithUser(@Param("boardId") Long boardId);

    @Query("SELECT bm FROM BoardMember bm JOIN FETCH bm.user WHERE bm.board.id = :boardId AND bm.status = 'ACCEPTED'")
    List<BoardMember> findAcceptedByBoardIdWithUser(@Param("boardId") Long boardId);

    boolean existsByBoardIdAndUserId(Long boardId, Long userId);

    @Query("SELECT CASE WHEN COUNT(bm) > 0 THEN true ELSE false END FROM BoardMember bm WHERE bm.board.id = :boardId AND bm.user.id = :userId AND bm.status = 'ACCEPTED'")
    boolean existsAcceptedByBoardIdAndUserId(@Param("boardId") Long boardId, @Param("userId") Long userId);

    @Query("SELECT bm FROM BoardMember bm JOIN FETCH bm.user WHERE bm.board.id = :boardId AND bm.user.id = :userId")
    Optional<BoardMember> findByBoardIdAndUserId(@Param("boardId") Long boardId, @Param("userId") Long userId);

    void deleteByBoardIdAndUserId(Long boardId, Long userId);

    @Query("SELECT bm.board FROM BoardMember bm WHERE bm.user.id = :userId AND bm.status = 'ACCEPTED'")
    List<Board> findAcceptedBoardsByUserId(@Param("userId") Long userId);

    @Query("SELECT bm FROM BoardMember bm WHERE bm.id = :id AND bm.status = 'PENDING'")
    Optional<BoardMember> findPendingById(@Param("id") Long id);

    @Query("SELECT bm FROM BoardMember bm JOIN FETCH bm.user JOIN FETCH bm.board b JOIN FETCH b.user WHERE bm.user.id = :userId AND bm.status = 'PENDING'")
    List<BoardMember> findPendingByUserId(@Param("userId") Long userId);

    @Query("SELECT bm FROM BoardMember bm JOIN FETCH bm.user WHERE bm.board.id = :boardId AND bm.status IN ('PENDING', 'REJECTED')")
    List<BoardMember> findPendingAndRejectedByBoardIdWithUser(@Param("boardId") Long boardId);
}
