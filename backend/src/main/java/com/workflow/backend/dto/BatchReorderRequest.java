package com.workflow.backend.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

/**
 * Bir liste içindeki tüm task'ların sırasını toplu güncellemek için kullanılır.
 */
@Data
public class BatchReorderRequest {

    @NotNull(message = "Liste ID boş olamaz")
    private Long listId;

    @NotEmpty(message = "Task sıralaması boş olamaz")
    @Size(max = 100, message = "Tek seferde en fazla 100 görev sıralanabilir")
    @Valid
    private List<TaskPosition> taskPositions;

    @Data
    public static class TaskPosition {
        @NotNull(message = "Task ID boş olamaz")
        private Long taskId;

        @NotNull(message = "Pozisyon boş olamaz")
        private Integer position;
    }
}
