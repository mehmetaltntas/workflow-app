package com.workflow.backend.repository;

import com.workflow.backend.entity.AssignmentTargetType;
import com.workflow.backend.entity.BoardMemberAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface BoardMemberAssignmentRepository extends JpaRepository<BoardMemberAssignment, Long> {

    @Query("SELECT CASE WHEN COUNT(a) > 0 THEN true ELSE false END FROM BoardMemberAssignment a " +
           "WHERE a.boardMember.user.id = :userId AND a.targetType = :targetType AND a.targetId = :targetId")
    boolean existsByUserAndTarget(@Param("userId") Long userId,
                                  @Param("targetType") AssignmentTargetType targetType,
                                  @Param("targetId") Long targetId);

    @Query("SELECT a FROM BoardMemberAssignment a " +
           "JOIN FETCH a.boardMember bm " +
           "JOIN FETCH bm.user " +
           "WHERE bm.board.id = :boardId")
    List<BoardMemberAssignment> findByBoardIdWithMemberAndUser(@Param("boardId") Long boardId);

    void deleteByTargetTypeAndTargetId(AssignmentTargetType targetType, Long targetId);
}
