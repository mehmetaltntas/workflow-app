package com.workflow.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.BatchSize;

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
    // @BatchSize: N+1 sorgu yerine batch halinde yükle (örn: 20 list için 1 sorgu)
    @OneToMany(mappedBy = "board", cascade = CascadeType.ALL, orphanRemoval = true)
    @BatchSize(size = 20)
    private java.util.List<TaskList> taskLists;

    // Bir Pano'nun birden çok etiketi olabilir
    @OneToMany(mappedBy = "board", cascade = CascadeType.ALL, orphanRemoval = true)
    @BatchSize(size = 50)
    private java.util.List<Label> labels;
}