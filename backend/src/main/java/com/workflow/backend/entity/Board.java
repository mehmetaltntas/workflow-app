package com.workflow.backend.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "boards")
@Data
public class Board {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private String status = "PLANLANDI";

    private String link; // Harici kaynak linki

    @Column(length = 105)
    private String description; // Opsiyonel açıklama (max 105 karakter - 35 x 3 satır)

    private java.time.LocalDateTime deadline; // Bitiş tarihi

    @Column(unique = true)
    private String slug; // YENİ: URL dostu kimlik

    // İLİŞKİ: Bir Pano sadece TEK bir kullanıcıya aittir.
    // @ManyToOne: Board (Many) -> User (One)
    // FetchType.LAZY: Mülakat sorusu!
    // "Board'u veritabanından çektiğimde, sahibini (User) hemen getirme.
    // Ne zaman user.getName() dersem o zaman git sorgu at getir." (Performans için)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id") // Veritabanında oluşacak yabancı anahtar sütunu (FK)
    private User user;

    // Bir Pano'nun birden çok Listesi olur (To Do, Done vb.)
    @OneToMany(mappedBy = "board", cascade = CascadeType.ALL, orphanRemoval = true)
    private java.util.List<TaskList> taskLists;
}