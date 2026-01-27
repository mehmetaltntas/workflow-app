package com.workflow.backend.entity;

import jakarta.persistence.*;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import java.util.List;

@Entity // 1. Bu bir veritabanı tablosudur
@Table(name = "users") // 2. SQL'de tablonun adı 'users' olsun
@Getter
@Setter
@ToString(exclude = {"boards", "profilePicture"})
@EqualsAndHashCode(exclude = {"boards", "profilePicture"})
public class User {

    @Id // Bu sütun Primary Key'dir
    @GeneratedValue(strategy = GenerationType.IDENTITY) // ID'yi 1, 2, 3 diye otomatik arttır
    private Long id;

    @Version
    private Long version = 0L;

    @Column(unique = true, nullable = false) // Aynı username'den bir daha olamaz ve boş olamaz
    private String username;

    private String password;

    @Column(unique = true)
    private String email;

    @Column(nullable = false)
    private String firstName;

    @Column(nullable = false)
    private String lastName;

    // Google OAuth icin eklenen alanlar
    @Column(unique = true)
    private String googleId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AuthProvider authProvider = AuthProvider.LOCAL;

    // Profil resmi artik ayri tabloda saklaniyor (performans icin).
    // LAZY fetch: Sadece ihtiyac duyuldugunda yuklenir.
    // Her User sorgusu bu buyuk Base64 verisini otomatik cekmez.
    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private UserProfilePicture profilePicture;

    @Column(nullable = false)
    private Boolean isProfilePublic = false;

    // ILISKI: Bir kullanicinin birden fazla panosu olabilir.
    // "mappedBy": Board tablosundaki 'user' degiskeni bu iliskiyi yonetiyor demek.
    // cascade = CascadeType.ALL: Kullaniciyi silersem, ona ait panolari da sil.
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<Board> boards;
}