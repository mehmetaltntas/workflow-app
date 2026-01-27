package com.workflow.backend.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.Map;

@Getter
@Setter
public class UserProfileStatsResponse {

    private int totalBoards;
    private Map<String, Integer> boardsByStatus; // PLANLANDI, DEVAM_EDIYOR, TAMAMLANDI, DURDURULDU, BIRAKILDI
    private int totalLists;
    private int completedLists;
    private int totalTasks;
    private int completedTasks;
    private int totalSubtasks;
    private int completedSubtasks;
    private int overallProgress; // yuzde olarak
    private List<CategoryStat> topCategories;

    @Getter
    @Setter
    public static class CategoryStat {
        private String category;
        private int count;

        public CategoryStat(String category, int count) {
            this.category = category;
            this.count = count;
        }
    }
}
