package com.workflow.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "tasks")
@Data
@EqualsAndHashCode(exclude = {"labels", "taskList", "assignee"})
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @Column(length = 500) // Açıklama biraz uzun olabilir
    private String description;

    private String link; // Harici link

    private Boolean isCompleted = false; // Tamamlandı durumu

    private java.time.LocalDateTime createdAt; // Oluşturulma tarihi

    private java.time.LocalDate dueDate; // Son tarih (deadline)

    @Enumerated(EnumType.STRING)
    @Column(length = 10)
    private Priority priority = Priority.NONE; // Öncelik seviyesi

    // Sürükle bırak için sıralama sayısı (0, 1, 2...)
    private Integer position;

    // İLİŞKİ: Hangi Listeye ait? (Yapılacaklar mı, Bitti mi?)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_list_id")
    private TaskList taskList;

    // İLİŞKİ: Bu görevi kime atadık? (Opsiyonel)
    // Görev silinirse kullanıcı silinmesin! (Cascade yok)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignee_id") // Atanan kişi
    private User assignee;

    // İLİŞKİ: Bir görevin birden fazla etiketi olabilir (Many-to-Many)
    @ManyToMany
    @JoinTable(
        name = "task_labels",
        joinColumns = @JoinColumn(name = "task_id"),
        inverseJoinColumns = @JoinColumn(name = "label_id")
    )
    private Set<Label> labels = new HashSet<>();

    @PrePersist
    protected void onCreate() {
        createdAt = java.time.LocalDateTime.now();
    }
}