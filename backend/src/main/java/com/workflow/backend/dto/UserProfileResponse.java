package com.workflow.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "Kullanici profil bilgileri")
public class UserProfileResponse {

    @Schema(description = "Kullanici ID", example = "1")
    private Long id;

    @Schema(description = "Kullanici adi", example = "johndoe")
    private String username;

    @Schema(description = "Kullanicinin adi", example = "Mehmet")
    private String firstName;

    @Schema(description = "Kullanicinin soyadi", example = "Altintas")
    private String lastName;

    @Schema(description = "Profil resmi (Base64 encoded)")
    private String profilePicture;

    @Schema(description = "Profil herkese acik mi", example = "true")
    private Boolean isProfilePublic;

    @Schema(description = "Baglanti sayisi", example = "5")
    private Long connectionCount;

    @Schema(description = "Baglanti durumu (null/PENDING/PENDING_RECEIVED/ACCEPTED/REJECTED/SELF)")
    private String connectionStatus;

    @Schema(description = "Baglanti ID (kabul/red islemleri icin)")
    private Long connectionId;
}
