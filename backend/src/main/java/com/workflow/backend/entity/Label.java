package com.workflow.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "labels")
@Data
@EqualsAndHashCode(exclude = {"tasks", "board"})
public class Label {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String color; // Hex color code (e.g., "#ff5733")

    @Column(nullable = false)
    private Boolean isDefault = false; // Varsayılan etiketler silinemez

    // Her etiket bir panoya aittir
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_id", nullable = false)
    private Board board;

    // Bir etiket birden fazla göreve atanabilir (Many-to-Many)
    @ManyToMany(mappedBy = "labels")
    private Set<Task> tasks = new HashSet<>();
}
