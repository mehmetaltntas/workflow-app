package com.workflow.backend.repository;

import com.workflow.backend.entity.UserPrivacySettings;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserPrivacySettingsRepository extends JpaRepository<UserPrivacySettings, Long> {
    Optional<UserPrivacySettings> findByUserId(Long userId);
}
