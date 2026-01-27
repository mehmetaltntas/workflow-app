package com.workflow.backend.repository;

import com.workflow.backend.entity.UserProfilePicture;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserProfilePictureRepository extends JpaRepository<UserProfilePicture, Long> {

    Optional<UserProfilePicture> findByUserId(Long userId);

    @Query("SELECT p.pictureData FROM UserProfilePicture p WHERE p.user.id = :userId")
    Optional<String> findPictureDataByUserId(@Param("userId") Long userId);

    void deleteByUserId(Long userId);
}
