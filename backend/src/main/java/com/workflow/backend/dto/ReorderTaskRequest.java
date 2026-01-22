package com.workflow.backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * Tek bir task'ın pozisyonunu ve/veya listesini değiştirmek için kullanılır.
 * Drag & Drop işlemlerinde kullanılır.
 */
@Data
public class ReorderTaskRequest {

    @NotNull(message = "Hedef liste ID boş olamaz")
    private Long targetListId;

    @NotNull(message = "Yeni pozisyon boş olamaz")
    @Min(value = 0, message = "Pozisyon 0 veya daha büyük olmalı")
    private Integer newPosition;
}
