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

    @Query("SELECT CASE WHEN COUNT(bm) > 0 THEN true ELSE false END FROM BoardMember bm WHERE bm.board.id = :boardId AND bm.user.id = :userId AND bm.status = 'ACCEPTED' AND bm.board.boardType = com.workflow.backend.entity.BoardType.TEAM")
    boolean existsAcceptedByBoardIdAndUserId(@Param("boardId") Long boardId, @Param("userId") Long userId);

    @Query("SELECT bm FROM BoardMember bm JOIN FETCH bm.user WHERE bm.board.id = :boardId AND bm.user.id = :userId")
    Optional<BoardMember> findByBoardIdAndUserId(@Param("boardId") Long boardId, @Param("userId") Long userId);

    void deleteByBoardIdAndUserId(Long boardId, Long userId);

    @Query("SELECT b FROM Board b JOIN FETCH b.user WHERE b IN (SELECT bm.board FROM BoardMember bm WHERE bm.user.id = :userId AND bm.status = 'ACCEPTED' AND bm.board.boardType = com.workflow.backend.entity.BoardType.TEAM)")
    List<Board> findAcceptedBoardsByUserId(@Param("userId") Long userId);

    @Query("SELECT COUNT(bm) FROM BoardMember bm WHERE bm.board.id = :boardId AND bm.role = com.workflow.backend.entity.BoardMemberRole.MODERATOR")
    long countModeratorsByBoardId(@Param("boardId") Long boardId);

    @Query("SELECT CASE WHEN COUNT(bm) > 0 THEN true ELSE false END FROM BoardMember bm WHERE bm.board.id = :boardId AND bm.user.id = :userId AND bm.role = com.workflow.backend.entity.BoardMemberRole.MODERATOR AND bm.status = 'ACCEPTED'")
    boolean isModeratorOnBoard(@Param("boardId") Long boardId, @Param("userId") Long userId);

    // Profil istatistikleri: Uye olunan ekip panosu sayisi (sahip olunmayanlar)
    @Query("SELECT COUNT(bm) FROM BoardMember bm WHERE bm.user.id = :userId AND bm.status = 'ACCEPTED' AND bm.board.user.id <> :userId")
    long countMemberTeamBoards(@Param("userId") Long userId);

    // Profil istatistikleri: Uye olunan ekip panolarinin status dagilimi
    @Query("SELECT bm.board.status, COUNT(bm) FROM BoardMember bm WHERE bm.user.id = :userId AND bm.status = 'ACCEPTED' AND bm.board.user.id <> :userId GROUP BY bm.board.status")
    List<Object[]> countMemberTeamBoardsByStatus(@Param("userId") Long userId);

}
