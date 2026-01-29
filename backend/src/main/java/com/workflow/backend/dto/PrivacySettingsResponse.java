package com.workflow.backend.dto;

import com.workflow.backend.entity.PrivacyMode;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "Gizlilik ayarlari yaniti")
public class PrivacySettingsResponse {

    @Schema(description = "Gizlilik modu: HIDDEN, PUBLIC, PRIVATE")
    private PrivacyMode privacyMode;

    @Schema(description = "Profil resmini goster")
    private Boolean showProfilePicture;

    @Schema(description = "Genel ilerlemeyi goster")
    private Boolean showOverallProgress;

    @Schema(description = "Pano istatistiklerini goster")
    private Boolean showBoardStats;

    @Schema(description = "Liste istatistiklerini goster")
    private Boolean showListStats;

    @Schema(description = "Gorev istatistiklerini goster")
    private Boolean showTaskStats;

    @Schema(description = "Alt gorev istatistiklerini goster")
    private Boolean showSubtaskStats;

    @Schema(description = "Ekip panosu istatistiklerini goster")
    private Boolean showTeamBoardStats;

    @Schema(description = "Populer kategorileri goster")
    private Boolean showTopCategories;

    @Schema(description = "Baglanti sayisini goster")
    private Boolean showConnectionCount;
}
