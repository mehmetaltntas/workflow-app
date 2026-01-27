package com.workflow.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Schema(description = "Baglanti bilgileri")
public class ConnectionResponse {

    @Schema(description = "Baglanti ID", example = "1")
    private Long id;

    @Schema(description = "Gonderen kullanici ID", example = "1")
    private Long senderId;

    @Schema(description = "Gonderen kullanici adi", example = "johndoe")
    private String senderUsername;

    @Schema(description = "Gonderen profil resmi")
    private String senderProfilePicture;

    @Schema(description = "Alan kullanici ID", example = "2")
    private Long receiverId;

    @Schema(description = "Alan kullanici adi", example = "janedoe")
    private String receiverUsername;

    @Schema(description = "Alan profil resmi")
    private String receiverProfilePicture;

    @Schema(description = "Baglanti durumu", example = "PENDING")
    private String status;

    @Schema(description = "Olusturulma tarihi")
    private LocalDateTime createdAt;
}
