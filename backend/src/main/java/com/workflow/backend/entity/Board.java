package com.workflow.backend.entity;

import jakarta.persistence.*;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import org.hibernate.annotations.BatchSize;

@Entity
@Table(name = "boards", indexes = {
    @Index(name = "idx_boards_user_id", columnList = "user_id")
})
@Getter
@Setter
@ToString(exclude = {"user", "taskLists", "labels", "boardMembers"})
@EqualsAndHashCode(exclude = {"user", "taskLists", "labels", "boardMembers"})
public class Board {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Version
    private Long version = 0L;

    private String name;

    private String status = "PLANLANDI";

    private String link; // Harici kaynak linki

    @Column(length = 500)
    private String description; // Opsiyonel açıklama (max 500 karakter)

    private java.time.LocalDateTime deadline; // Bitiş tarihi

    private String category; // Pano kategorisi

    @Column(unique = true)
    private String slug; // YENİ: URL dostu kimlik

    private java.time.LocalDateTime createdAt; // Oluşturulma tarihi

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = java.time.LocalDateTime.now();
        }
    }

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

    // Pano üyeleri (sorumlu kişiler)
    @OneToMany(mappedBy = "board", cascade = CascadeType.ALL, orphanRemoval = true)
    @BatchSize(size = 20)
    private java.util.List<BoardMember> boardMembers;
}