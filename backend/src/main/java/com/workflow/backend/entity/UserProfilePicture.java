package com.workflow.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Profil resmini ayri bir tabloda saklar.
 * Bu sayede User sorgularinda buyuk Base64 verisi otomatik olarak cekilmez,
 * sadece ihtiyac duyuldugunda lazy olarak yuklenir.
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

    @Column(columnDefinition = "TEXT")
    private String pictureData;

    public UserProfilePicture(User user, String pictureData) {
        this.user = user;
        this.pictureData = pictureData;
    }
}
