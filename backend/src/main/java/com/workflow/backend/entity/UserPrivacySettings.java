package com.workflow.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "user_privacy_settings")
@Getter
@Setter
public class UserPrivacySettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Version
    @Column(nullable = false)
    private Long version = 0L;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false)
    private Boolean showProfilePicture = true;

    @Column(nullable = false)
    private Boolean showOverallProgress = true;

    @Column(nullable = false)
    private Boolean showBoardStats = true;

    @Column(nullable = false)
    private Boolean showListStats = true;

    @Column(nullable = false)
    private Boolean showTaskStats = true;

    @Column(nullable = false)
    private Boolean showSubtaskStats = true;

    @Column(nullable = false)
    private Boolean showTeamBoardStats = true;

    @Column(nullable = false)
    private Boolean showTopCategories = true;

    @Column(nullable = false)
    private Boolean showConnectionCount = true;

    public UserPrivacySettings() {}

    public UserPrivacySettings(User user) {
        this.user = user;
    }
}
