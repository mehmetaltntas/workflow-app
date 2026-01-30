package com.workflow.backend.entity;

import jakarta.persistence.*;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import org.hibernate.annotations.BatchSize;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "tasks", indexes = {
    @Index(name = "idx_tasks_task_list_id", columnList = "task_list_id"),
    @Index(name = "idx_tasks_position", columnList = "position"),
    @Index(name = "idx_tasks_assignee_id", columnList = "assignee_id")
})
@Getter
@Setter
@ToString(exclude = {"labels", "taskList", "assignee", "subtasks"})
@EqualsAndHashCode(exclude = {"labels", "taskList", "assignee", "subtasks"})
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Version
    private Long version = 0L;

    private String title;

    @Column(length = 500)
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
    // @BatchSize: N+1 sorgu yerine batch halinde yükle
    @ManyToMany
    @JoinTable(
        name = "task_labels",
        joinColumns = @JoinColumn(name = "task_id"),
        inverseJoinColumns = @JoinColumn(name = "label_id")
    )
    @BatchSize(size = 50)
    private Set<Label> labels = new HashSet<>();

    // İLİŞKİ: Bir görevin birden fazla alt görevi olabilir
    // @BatchSize: N+1 sorgu yerine batch halinde yükle
    @OneToMany(mappedBy = "task", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("position ASC")
    @BatchSize(size = 50)
    private java.util.List<Subtask> subtasks = new java.util.ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = java.time.LocalDateTime.now();
    }
}