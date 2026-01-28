package com.workflow.backend.dto;

import com.workflow.backend.entity.Priority;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.hibernate.validator.constraints.URL;

import java.time.LocalDate;

@Data
@Schema(description = "Görev oluşturma isteği")
public class CreateTaskRequest {

    @NotBlank(message = "Görev başlığı boş olamaz")
    @Size(min = 1, max = 25, message = "Görev başlığı 1-25 karakter arasında olmalıdır")
    @Schema(description = "Görev başlığı", example = "API entegrasyonu yap", requiredMode = Schema.RequiredMode.REQUIRED)
    private String title;

    @Size(max = 500, message = "Açıklama en fazla 500 karakter olabilir")
    @Schema(description = "Görev açıklaması", example = "REST API ile veri çekme işlemi")
    private String description;

    @URL(message = "Geçerli bir URL giriniz")
    @Schema(description = "İlgili link", example = "https://docs.api.com")
    private String link;

    @NotNull(message = "Liste ID boş olamaz")
    @Schema(description = "Görevin ekleneceği liste ID", example = "1", requiredMode = Schema.RequiredMode.REQUIRED)
    private Long taskListId;

    @Schema(description = "Son tarih", example = "2024-12-31")
    private LocalDate dueDate;

    @Schema(description = "Öncelik seviyesi", example = "HIGH", allowableValues = {"LOW", "MEDIUM", "HIGH"})
    private Priority priority;
}
