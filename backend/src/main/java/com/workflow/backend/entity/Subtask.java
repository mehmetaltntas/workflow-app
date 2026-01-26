package com.workflow.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Entity
@Table(name = "subtasks")
@Data
@EqualsAndHashCode(exclude = {"task"})
public class Subtask {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    private Boolean isCompleted = false;

    private Integer position = 0; // Sıralama için

    @Column(length = 100)
    private String description;

    @Column(length = 500)
    private String link;

    // İLİŞKİ: Hangi göreve ait?
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id", nullable = false)
    private Task task;
}
