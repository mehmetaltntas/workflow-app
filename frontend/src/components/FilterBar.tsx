import React, { useState } from "react";
import { Search, X, Filter, CheckSquare, Tag, ChevronDown, Flag } from "lucide-react";
import type { Label, Priority } from "../types";
import { colors, cssVars, shadows, spacing, radius, typography } from "../styles/tokens";

export interface FilterState {
  searchText: string;
  selectedLabels: number[];
  completionFilter: "all" | "completed" | "pending";
  priorityFilter: "all" | Priority;
}

interface FilterBarProps {
  labels: Label[];
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}

const completionOptions = [
  { value: "all", label: "Tümü" },
  { value: "pending", label: "Devam Eden" },
  { value: "completed", label: "Tamamlanan" },
];

const priorityOptions = [
  { value: "all", label: "Tümü", color: null },
  { value: "HIGH", label: "Yüksek", color: colors.priority.high },
  { value: "MEDIUM", label: "Orta", color: colors.priority.medium },
  { value: "LOW", label: "Düşük", color: colors.priority.low },
  { value: "NONE", label: "Önceliksiz", color: colors.dark.text.subtle },
];

export const FilterBar: React.FC<FilterBarProps> = ({ labels, filters, onFilterChange }) => {
  const [showLabelDropdown, setShowLabelDropdown] = useState(false);
  const [showCompletionDropdown, setShowCompletionDropdown] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const toggleLabel = (labelId: number) => {
    const newLabels = filters.selectedLabels.includes(labelId)
      ? filters.selectedLabels.filter(id => id !== labelId)
      : [...filters.selectedLabels, labelId];
    updateFilter("selectedLabels", newLabels);
  };

  const clearAllFilters = () => {
    onFilterChange({
      searchText: "",
      selectedLabels: [],
      completionFilter: "all",
      priorityFilter: "all",
    });
  };

  const hasActiveFilters =
    filters.searchText ||
    filters.selectedLabels.length > 0 ||
    filters.completionFilter !== "all" ||
    filters.priorityFilter !== "all";

  const activeFilterCount =
    (filters.searchText ? 1 : 0) +
    (filters.selectedLabels.length > 0 ? 1 : 0) +
    (filters.completionFilter !== "all" ? 1 : 0) +
    (filters.priorityFilter !== "all" ? 1 : 0);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: spacing[3],
        padding: `${spacing[3]} ${spacing[6]}`,
        background: colors.dark.bg.overlay,
        borderBottom: `1px solid ${colors.dark.border.subtle}`,
      }}
    >
      {/* Search Input */}
      <div
        style={{
          position: "relative",
          flex: "0 0 280px",
        }}
      >
        <Search
          size={16}
          style={{
            position: "absolute",
            left: spacing[3],
            top: "50%",
            transform: "translateY(-50%)",
            color: colors.dark.text.subtle,
          }}
        />
        <input
          type="text"
          value={filters.searchText}
          onChange={(e) => updateFilter("searchText", e.target.value)}
          placeholder="Görev ara..."
          style={{
            width: "100%",
            padding: `${spacing[2.5]} ${spacing[3]} ${spacing[2.5]} ${spacing[10]}`,
            borderRadius: radius.lg,
            border: `1px solid ${cssVars.border}`,
            background: colors.dark.glass.bg,
            color: cssVars.textMain,
            fontSize: typography.fontSize.base,
            outline: "none",
            transition: "all 0.2s",
            boxSizing: "border-box",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = colors.brand.primary;
            e.currentTarget.style.background = colors.dark.bg.hover;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = cssVars.border;
            e.currentTarget.style.background = colors.dark.glass.bg;
          }}
        />
        {filters.searchText && (
          <button
            onClick={() => updateFilter("searchText", "")}
            style={{
              position: "absolute",
              right: spacing[2],
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: colors.dark.text.subtle,
              padding: spacing[1],
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: radius.sm,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = cssVars.textMain)}
            onMouseLeave={(e) => (e.currentTarget.style.color = colors.dark.text.subtle)}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Filter Icon */}
      <div style={{ display: "flex", alignItems: "center", gap: spacing[1], color: colors.dark.text.tertiary, paddingLeft: spacing[2] }}>
        <Filter size={14} />
        <span style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, textTransform: "uppercase", letterSpacing: typography.letterSpacing.wider }}>
          Filtreler
        </span>
      </div>

      {/* Labels Filter Dropdown */}
      {labels.length > 0 && (
        <div style={{ position: "relative" }}>
          <button
            onClick={() => {
              setShowLabelDropdown(!showLabelDropdown);
              setShowCompletionDropdown(false);
              setShowPriorityDropdown(false);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: spacing[1.5],
              padding: `${spacing[2]} ${spacing[3]}`,
              borderRadius: radius.md,
              border: filters.selectedLabels.length > 0
                ? `1px solid ${colors.brand.primary}`
                : `1px solid ${cssVars.border}`,
              background: filters.selectedLabels.length > 0
                ? colors.brand.primaryLight
                : colors.dark.glass.bg,
              color: filters.selectedLabels.length > 0 ? colors.brand.primary : colors.dark.text.secondary,
              fontSize: typography.fontSize.md,
              fontWeight: typography.fontWeight.semibold,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            <Tag size={14} />
            Etiket
            {filters.selectedLabels.length > 0 && (
              <span
                style={{
                  background: colors.brand.primary,
                  color: cssVars.textMain,
                  fontSize: typography.fontSize.xs,
                  padding: `${spacing[0.5]} ${spacing[1.5]}`,
                  borderRadius: spacing[1.5],
                  minWidth: spacing[4],
                  textAlign: "center",
                }}
              >
                {filters.selectedLabels.length}
              </span>
            )}
            <ChevronDown size={12} style={{ transform: showLabelDropdown ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }} />
          </button>

          {showLabelDropdown && (
            <div
              style={{
                position: "absolute",
                top: `calc(100% + ${spacing[1.5]})`,
                left: 0,
                minWidth: "200px",
                background: cssVars.bgCard,
                border: `1px solid ${cssVars.border}`,
                borderRadius: radius.lg,
                padding: spacing[2],
                zIndex: 100,
                boxShadow: shadows.lg,
              }}
            >
              {labels.map((label) => (
                <button
                  key={label.id}
                  onClick={() => toggleLabel(label.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: spacing[2.5],
                    width: "100%",
                    padding: `${spacing[2]} ${spacing[2.5]}`,
                    borderRadius: radius.md,
                    border: "none",
                    background: filters.selectedLabels.includes(label.id)
                      ? `${label.color}20`
                      : "transparent",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    if (!filters.selectedLabels.includes(label.id)) {
                      e.currentTarget.style.background = colors.dark.bg.hover;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!filters.selectedLabels.includes(label.id)) {
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  <div
                    style={{
                      width: spacing[4],
                      height: spacing[4],
                      borderRadius: radius.sm,
                      background: label.color,
                      border: filters.selectedLabels.includes(label.id)
                        ? `2px solid ${cssVars.textMain}`
                        : "none",
                    }}
                  />
                  <span
                    style={{
                      flex: 1,
                      textAlign: "left",
                      fontSize: typography.fontSize.md,
                      fontWeight: typography.fontWeight.medium,
                      color: filters.selectedLabels.includes(label.id)
                        ? label.color
                        : colors.dark.text.secondary,
                    }}
                  >
                    {label.name}
                  </span>
                </button>
              ))}
              {filters.selectedLabels.length > 0 && (
                <>
                  <div style={{ height: "1px", background: cssVars.border, margin: `${spacing[1.5]} 0` }} />
                  <button
                    onClick={() => updateFilter("selectedLabels", [])}
                    style={{
                      width: "100%",
                      padding: `${spacing[2]} ${spacing[2.5]}`,
                      borderRadius: radius.md,
                      border: "none",
                      background: "transparent",
                      color: colors.semantic.danger,
                      fontSize: typography.fontSize.sm,
                      fontWeight: typography.fontWeight.semibold,
                      cursor: "pointer",
                      textAlign: "center",
                    }}
                  >
                    Seçimi Temizle
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Completion Filter Dropdown */}
      <div style={{ position: "relative" }}>
        <button
          onClick={() => {
            setShowCompletionDropdown(!showCompletionDropdown);
            setShowLabelDropdown(false);
            setShowPriorityDropdown(false);
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: spacing[1.5],
            padding: `${spacing[2]} ${spacing[3]}`,
            borderRadius: radius.md,
            border: filters.completionFilter !== "all"
              ? `1px solid ${colors.brand.primary}`
              : `1px solid ${cssVars.border}`,
            background: filters.completionFilter !== "all"
              ? colors.brand.primaryLight
              : colors.dark.glass.bg,
            color: filters.completionFilter !== "all" ? colors.brand.primary : colors.dark.text.secondary,
            fontSize: typography.fontSize.md,
            fontWeight: typography.fontWeight.semibold,
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          <CheckSquare size={14} />
          {completionOptions.find((o) => o.value === filters.completionFilter)?.label || "Durum"}
          <ChevronDown size={12} style={{ transform: showCompletionDropdown ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }} />
        </button>

        {showCompletionDropdown && (
          <div
            style={{
              position: "absolute",
              top: `calc(100% + ${spacing[1.5]})`,
              left: 0,
              minWidth: "150px",
              background: cssVars.bgCard,
              border: `1px solid ${cssVars.border}`,
              borderRadius: radius.lg,
              padding: spacing[2],
              zIndex: 100,
              boxShadow: shadows.lg,
            }}
          >
            {completionOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  updateFilter("completionFilter", option.value as FilterState["completionFilter"]);
                  setShowCompletionDropdown(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: spacing[2.5],
                  width: "100%",
                  padding: `${spacing[2]} ${spacing[2.5]}`,
                  borderRadius: radius.md,
                  border: "none",
                  background: filters.completionFilter === option.value
                    ? colors.brand.primaryLight
                    : "transparent",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (filters.completionFilter !== option.value) {
                    e.currentTarget.style.background = colors.dark.bg.hover;
                  }
                }}
                onMouseLeave={(e) => {
                  if (filters.completionFilter !== option.value) {
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                <span
                  style={{
                    fontSize: typography.fontSize.md,
                    fontWeight: typography.fontWeight.medium,
                    color: filters.completionFilter === option.value
                      ? colors.brand.primary
                      : colors.dark.text.secondary,
                  }}
                >
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Priority Filter Dropdown */}
      <div style={{ position: "relative" }}>
        <button
          onClick={() => {
            setShowPriorityDropdown(!showPriorityDropdown);
            setShowLabelDropdown(false);
            setShowCompletionDropdown(false);
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: spacing[1.5],
            padding: `${spacing[2]} ${spacing[3]}`,
            borderRadius: radius.md,
            border: filters.priorityFilter !== "all"
              ? `1px solid ${colors.brand.primary}`
              : `1px solid ${cssVars.border}`,
            background: filters.priorityFilter !== "all"
              ? colors.brand.primaryLight
              : colors.dark.glass.bg,
            color: filters.priorityFilter !== "all" ? colors.brand.primary : colors.dark.text.secondary,
            fontSize: typography.fontSize.md,
            fontWeight: typography.fontWeight.semibold,
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          <Flag size={14} />
          {priorityOptions.find((o) => o.value === filters.priorityFilter)?.label || "Öncelik"}
          <ChevronDown size={12} style={{ transform: showPriorityDropdown ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }} />
        </button>

        {showPriorityDropdown && (
          <div
            style={{
              position: "absolute",
              top: `calc(100% + ${spacing[1.5]})`,
              left: 0,
              minWidth: "150px",
              background: cssVars.bgCard,
              border: `1px solid ${cssVars.border}`,
              borderRadius: radius.lg,
              padding: spacing[2],
              zIndex: 100,
              boxShadow: shadows.lg,
            }}
          >
            {priorityOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  updateFilter("priorityFilter", option.value as FilterState["priorityFilter"]);
                  setShowPriorityDropdown(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: spacing[2.5],
                  width: "100%",
                  padding: `${spacing[2]} ${spacing[2.5]}`,
                  borderRadius: radius.md,
                  border: "none",
                  background: filters.priorityFilter === option.value
                    ? colors.brand.primaryLight
                    : "transparent",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (filters.priorityFilter !== option.value) {
                    e.currentTarget.style.background = colors.dark.bg.hover;
                  }
                }}
                onMouseLeave={(e) => {
                  if (filters.priorityFilter !== option.value) {
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                {option.color && (
                  <div
                    style={{
                      width: spacing[2],
                      height: spacing[2],
                      borderRadius: radius.full,
                      background: option.color,
                    }}
                  />
                )}
                <span
                  style={{
                    fontSize: typography.fontSize.md,
                    fontWeight: typography.fontWeight.medium,
                    color: filters.priorityFilter === option.value
                      ? colors.brand.primary
                      : colors.dark.text.secondary,
                  }}
                >
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Clear All Filters */}
      {hasActiveFilters && (
        <button
          onClick={clearAllFilters}
          style={{
            display: "flex",
            alignItems: "center",
            gap: spacing[1.5],
            padding: `${spacing[2]} ${spacing[3]}`,
            borderRadius: radius.md,
            border: `1px solid ${colors.semantic.danger}4d`,
            background: colors.semantic.dangerLight,
            color: colors.semantic.danger,
            fontSize: typography.fontSize.md,
            fontWeight: typography.fontWeight.semibold,
            cursor: "pointer",
            transition: "all 0.2s",
            marginLeft: "auto",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = `${colors.semantic.danger}33`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = colors.semantic.dangerLight;
          }}
        >
          <X size={14} />
          Temizle ({activeFilterCount})
        </button>
      )}

      {/* Click outside to close dropdowns */}
      {(showLabelDropdown || showCompletionDropdown || showPriorityDropdown) && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 99,
          }}
          onClick={() => {
            setShowLabelDropdown(false);
            setShowCompletionDropdown(false);
            setShowPriorityDropdown(false);
          }}
        />
      )}
    </div>
  );
};

export const getDefaultFilters = (): FilterState => ({
  searchText: "",
  selectedLabels: [],
  completionFilter: "all",
  priorityFilter: "all",
});
