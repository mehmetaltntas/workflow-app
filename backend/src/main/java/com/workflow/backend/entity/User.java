package com.workflow.backend.entity;

import jakarta.persistence.*;
import lombok.Data; // Getter, Setter, toString hepsini otomatik halleder
import java.util.List;

@Entity // 1. Bu bir veritabanı tablosudur
@Table(name = "users") // 2. SQL'de tablonun adı 'users' olsun
@Data // 3. Lombok: Bize getter/setter yazma hamallığı yaptırma!
public class User {

    @Id // Bu sütun Primary Key'dir
    @GeneratedValue(strategy = GenerationType.IDENTITY) // ID'yi 1, 2, 3 diye otomatik arttır
    private Long id;

    @Column(unique = true, nullable = false) // Aynı username'den bir daha olamaz ve boş olamaz
    private String username;

    private String password;

    @Column(unique = true)
    private String email;

    @Column(columnDefinition = "TEXT") // Base64 encoded image (PostgreSQL için TEXT)
    private String profilePicture;

    // Google OAuth icin eklenen alanlar
    @Column(unique = true)
    private String googleId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AuthProvider authProvider = AuthProvider.LOCAL;

    // İLİŞKİ: Bir kullanıcının birden fazla panosu olabilir.
    // "mappedBy": Board tablosundaki 'user' değişkeni bu ilişkiyi yönetiyor demek.
    // cascade = CascadeType.ALL: Kullanıcıyı silersem, ona ait panoları da sil.
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<Board> boards;
}