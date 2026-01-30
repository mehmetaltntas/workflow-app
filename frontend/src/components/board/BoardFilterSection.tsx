import { FilterBar } from "../FilterBar";
import type { FilterState } from "../FilterBar";
import type { Label } from "../../types";

export interface BoardFilterSectionProps {
  labels: Label[];
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}

export const BoardFilterSection = ({
  labels,
  filters,
  onFilterChange,
}: BoardFilterSectionProps) => {
  return (
    <FilterBar
      labels={labels}
      filters={filters}
      onFilterChange={onFilterChange}
    />
  );
};
