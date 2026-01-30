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

    boolean existsByBoardMemberIdAndTargetTypeAndTargetId(Long boardMemberId, AssignmentTargetType targetType, Long targetId);

    void deleteByTargetTypeAndTargetId(AssignmentTargetType targetType, Long targetId);

    // Profil istatistikleri: Uye olunan ekip panolarinda atanan liste sayilari
    @Query("SELECT COUNT(tl), SUM(CASE WHEN tl.isCompleted = true THEN 1 ELSE 0 END) " +
           "FROM TaskList tl " +
           "WHERE tl.board.boardType = com.workflow.backend.entity.BoardType.TEAM " +
           "AND tl.board.user.id <> :userId " +
           "AND EXISTS (SELECT 1 FROM BoardMemberAssignment bma " +
           "JOIN bma.boardMember bm " +
           "WHERE bm.user.id = :userId AND bm.status = 'ACCEPTED' " +
           "AND bm.board = tl.board " +
           "AND bma.targetType = com.workflow.backend.entity.AssignmentTargetType.LIST " +
           "AND bma.targetId = tl.id)")
    List<Object[]> countAssignedListStatsForMember(@Param("userId") Long userId);

    // Profil istatistikleri: Uye olunan ekip panolarinda atanan gorev sayilari
    // (dogrudan TASK atamasi VEYA atanan listenin altindaki gorevler)
    @Query("SELECT COUNT(DISTINCT t.id), " +
           "SUM(CASE WHEN t.isCompleted = true THEN 1 ELSE 0 END) " +
           "FROM Task t " +
           "WHERE t.taskList.board.boardType = com.workflow.backend.entity.BoardType.TEAM " +
           "AND t.taskList.board.user.id <> :userId " +
           "AND (EXISTS (SELECT 1 FROM BoardMemberAssignment bma " +
           "JOIN bma.boardMember bm " +
           "WHERE bm.user.id = :userId AND bm.status = 'ACCEPTED' " +
           "AND bm.board = t.taskList.board " +
           "AND bma.targetType = com.workflow.backend.entity.AssignmentTargetType.TASK " +
           "AND bma.targetId = t.id) " +
           "OR EXISTS (SELECT 1 FROM BoardMemberAssignment bma " +
           "JOIN bma.boardMember bm " +
           "WHERE bm.user.id = :userId AND bm.status = 'ACCEPTED' " +
           "AND bm.board = t.taskList.board " +
           "AND bma.targetType = com.workflow.backend.entity.AssignmentTargetType.LIST " +
           "AND bma.targetId = t.taskList.id))")
    List<Object[]> countAssignedTaskStatsForMember(@Param("userId") Long userId);

    // Profil istatistikleri: Uye olunan ekip panolarinda atanan alt gorev sayilari
    // (dogrudan SUBTASK atamasi VEYA atanan gorev altindaki alt gorevler VEYA atanan liste altindaki alt gorevler)
    @Query("SELECT COUNT(DISTINCT s.id), " +
           "SUM(CASE WHEN s.isCompleted = true THEN 1 ELSE 0 END) " +
           "FROM Subtask s " +
           "WHERE s.task.taskList.board.boardType = com.workflow.backend.entity.BoardType.TEAM " +
           "AND s.task.taskList.board.user.id <> :userId " +
           "AND (EXISTS (SELECT 1 FROM BoardMemberAssignment bma " +
           "JOIN bma.boardMember bm " +
           "WHERE bm.user.id = :userId AND bm.status = 'ACCEPTED' " +
           "AND bm.board = s.task.taskList.board " +
           "AND bma.targetType = com.workflow.backend.entity.AssignmentTargetType.SUBTASK " +
           "AND bma.targetId = s.id) " +
           "OR EXISTS (SELECT 1 FROM BoardMemberAssignment bma " +
           "JOIN bma.boardMember bm " +
           "WHERE bm.user.id = :userId AND bm.status = 'ACCEPTED' " +
           "AND bm.board = s.task.taskList.board " +
           "AND bma.targetType = com.workflow.backend.entity.AssignmentTargetType.TASK " +
           "AND bma.targetId = s.task.id) " +
           "OR EXISTS (SELECT 1 FROM BoardMemberAssignment bma " +
           "JOIN bma.boardMember bm " +
           "WHERE bm.user.id = :userId AND bm.status = 'ACCEPTED' " +
           "AND bm.board = s.task.taskList.board " +
           "AND bma.targetType = com.workflow.backend.entity.AssignmentTargetType.LIST " +
           "AND bma.targetId = s.task.taskList.id))")
    List<Object[]> countAssignedSubtaskStatsForMember(@Param("userId") Long userId);
}
