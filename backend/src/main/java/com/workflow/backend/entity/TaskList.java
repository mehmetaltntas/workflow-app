package com.workflow.backend.entity;

import jakarta.persistence.*;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import org.hibernate.annotations.BatchSize;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "task_lists", indexes = {
    @Index(name = "idx_task_lists_board_id", columnList = "board_id")
}) // 'lists' SQL'de özel kelime olabilir, o yüzden 'task_lists' dedik
@Getter
@Setter
@ToString(exclude = {"labels", "board", "tasks"})
@EqualsAndHashCode(exclude = {"labels", "board", "tasks"})
public class TaskList {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Version
    private Long version = 0L;

    private String name; // Örn: "To Do", "In Progress"

    @Column(length = 100)
    private String description; // Açıklama

    private String link; // Opsiyonel link

    private Boolean isCompleted = false; // Tamamlandı mı?

    private LocalDate dueDate; // Son tarih

    @Enumerated(EnumType.STRING)
    private Priority priority; // Öncelik seviyesi

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt; // Oluşturulma tarihi

    // İLİŞKİ: Hangi Board'a ait?
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_id")
    private Board board;

    // İLİŞKİ: Bu listenin içindeki görevler
    // Task silinirse, liste silinmesin ama Liste silinirse içindeki Tasklar
    // silinsin (Cascade)
    // @BatchSize: N+1 sorgu yerine batch halinde yükle
    @OneToMany(mappedBy = "taskList", cascade = CascadeType.ALL, orphanRemoval = true)
    @BatchSize(size = 50)
    private List<Task> tasks;

    // İLİŞKİ: Etiketler (Many-to-Many)
    @ManyToMany
    @JoinTable(
        name = "task_list_labels",
        joinColumns = @JoinColumn(name = "task_list_id"),
        inverseJoinColumns = @JoinColumn(name = "label_id")
    )
    @BatchSize(size = 20)
    private Set<Label> labels = new HashSet<>();
}