package com.workflow.backend.dto;

import com.workflow.backend.entity.PrivacyMode;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
@Schema(description = "Gizlilik ayari guncelleme")
public class UpdatePrivacyRequest {

    @NotNull(message = "privacyMode alani bos olamaz")
    @Schema(description = "Gizlilik modu: HIDDEN, PUBLIC, PRIVATE", example = "PRIVATE",
            requiredMode = Schema.RequiredMode.REQUIRED)
    private PrivacyMode privacyMode;

    @Schema(description = "Detayli gizlilik ayarlari (sadece PRIVATE modunda kullanilir)")
    private GranularPrivacySettings granularSettings;

    @Data
    @Schema(description = "Detayli gizlilik ayarlari")
    public static class GranularPrivacySettings {
        @Schema(description = "Profil resmini goster", example = "true")
        private Boolean showProfilePicture;

        @Schema(description = "Genel ilerlemeyi goster", example = "true")
        private Boolean showOverallProgress;

        @Schema(description = "Pano istatistiklerini goster", example = "true")
        private Boolean showBoardStats;

        @Schema(description = "Liste istatistiklerini goster", example = "true")
        private Boolean showListStats;

        @Schema(description = "Gorev istatistiklerini goster", example = "true")
        private Boolean showTaskStats;

        @Schema(description = "Alt gorev istatistiklerini goster", example = "true")
        private Boolean showSubtaskStats;

        @Schema(description = "Ekip panosu istatistiklerini goster", example = "true")
        private Boolean showTeamBoardStats;

        @Schema(description = "Populer kategorileri goster", example = "true")
        private Boolean showTopCategories;

        @Schema(description = "Baglanti sayisini goster", example = "true")
        private Boolean showConnectionCount;
    }
}
