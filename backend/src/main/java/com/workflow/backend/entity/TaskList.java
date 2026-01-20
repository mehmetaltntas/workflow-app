package com.workflow.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.util.List;

@Entity
@Table(name = "task_lists") // 'lists' SQL'de özel kelime olabilir, o yüzden 'task_lists' dedik
@Data
public class TaskList {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name; // Örn: "To Do", "In Progress"

    private String link; // Opsiyonel link

    // İLİŞKİ: Hangi Board'a ait?
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_id")
    private Board board;

    // İLİŞKİ: Bu listenin içindeki görevler
    // Task silinirse, liste silinmesin ama Liste silinirse içindeki Tasklar
    // silinsin (Cascade)
    @OneToMany(mappedBy = "taskList", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Task> tasks;
}