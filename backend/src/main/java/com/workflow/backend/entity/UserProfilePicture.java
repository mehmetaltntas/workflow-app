package com.workflow.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Profil resmini ayri bir tabloda saklar.
 * Dosya sisteminde saklanan profil resminin yolunu tutar.
 */
@Entity
@Table(name = "user_profile_pictures")
@Getter
@Setter
@NoArgsConstructor
public class UserProfilePicture {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Version
    private Long version;

    @Column(name = "file_path", length = 500)
    private String filePath;

    public UserProfilePicture(User user, String filePath) {
        this.user = user;
        this.filePath = filePath;
    }
}
