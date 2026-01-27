package com.workflow.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Schema(description = "Bildirim bilgileri")
public class NotificationResponse {

    @Schema(description = "Bildirim ID", example = "1")
    private Long id;

    @Schema(description = "Bildirim tipi", example = "CONNECTION_REQUEST")
    private String type;

    @Schema(description = "Bildirim mesaji", example = "johndoe size baglanti istegi gonderdi")
    private String message;

    @Schema(description = "Okundu mu", example = "false")
    private Boolean isRead;

    @Schema(description = "Aksiyon yapan kullanici ID", example = "1")
    private Long actorId;

    @Schema(description = "Aksiyon yapan kullanici adi", example = "johndoe")
    private String actorUsername;

    @Schema(description = "Aksiyon yapan profil resmi")
    private String actorProfilePicture;

    @Schema(description = "Referans ID (ornegin connection id)", example = "5")
    private Long referenceId;

    @Schema(description = "Olusturulma tarihi")
    private LocalDateTime createdAt;
}
