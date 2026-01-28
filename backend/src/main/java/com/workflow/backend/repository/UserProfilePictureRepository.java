package com.workflow.backend.repository;

import com.workflow.backend.entity.UserProfilePicture;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface UserProfilePictureRepository extends JpaRepository<UserProfilePicture, Long> {

    Optional<UserProfilePicture> findByUserId(Long userId);

    @Query("SELECT p.filePath FROM UserProfilePicture p WHERE p.user.id = :userId")
    Optional<String> findFilePathByUserId(@Param("userId") Long userId);

    @Query("SELECT p.user.id, p.filePath FROM UserProfilePicture p WHERE p.user.id IN :userIds")
    List<Object[]> findFilePathsByUserIds(@Param("userIds") Collection<Long> userIds);

    void deleteByUserId(Long userId);
}
