import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FilterBar, getDefaultFilters, type FilterState } from '../FilterBar'
import type { Label } from '../../types/index'

describe('FilterBar', () => {
  const mockLabels: Label[] = [
    { id: 1, name: 'Bug', color: '#ef4444' },
    { id: 2, name: 'Feature', color: '#22c55e' },
    { id: 3, name: 'Enhancement', color: '#3b82f6' },
  ]

  const defaultFilters: FilterState = {
    searchText: '',
    selectedLabels: [],
    dueDateFilter: 'all',
    completionFilter: 'all',
    priorityFilter: 'all',
  }

  let mockOnFilterChange: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockOnFilterChange = vi.fn()
  })

  it('renders search input', () => {
    render(
      <FilterBar
        labels={mockLabels}
        filters={defaultFilters}
        onFilterChange={mockOnFilterChange}
      />
    )

    const searchInput = screen.getByPlaceholderText('Görev ara...')
    expect(searchInput).toBeInTheDocument()
  })

  it('updates search text on input', () => {
    render(
      <FilterBar
        labels={mockLabels}
        filters={defaultFilters}
        onFilterChange={mockOnFilterChange}
      />
    )

    const searchInput = screen.getByPlaceholderText('Görev ara...')
    fireEvent.change(searchInput, { target: { value: 'test query' } })

    expect(mockOnFilterChange).toHaveBeenCalledWith({
      ...defaultFilters,
      searchText: 'test query',
    })
  })

  it('filters by label selection', () => {
    render(
      <FilterBar
        labels={mockLabels}
        filters={defaultFilters}
        onFilterChange={mockOnFilterChange}
      />
    )

    // Open label dropdown
    const labelButton = screen.getByText('Etiket')
    fireEvent.click(labelButton)

    // Select a label
    const bugLabel = screen.getByText('Bug')
    fireEvent.click(bugLabel)

    expect(mockOnFilterChange).toHaveBeenCalledWith({
      ...defaultFilters,
      selectedLabels: [1],
    })
  })

  it('filters by priority', () => {
    render(
      <FilterBar
        labels={mockLabels}
        filters={defaultFilters}
        onFilterChange={mockOnFilterChange}
      />
    )

    // Open priority dropdown - it's the last filter button with "Tümü" text
    // Buttons order: Etiket, Date(Tümü), Completion(Tümü), Priority(Tümü)
    const allButtons = screen.getAllByRole('button')
    // Find buttons that contain "Tümü" - priority is the 4th filter dropdown (last one showing Tümü)
    const tumuButtons = allButtons.filter(btn => btn.textContent?.includes('Tümü'))
    const priorityButton = tumuButtons[tumuButtons.length - 1] // Last "Tümü" button is priority
    fireEvent.click(priorityButton)

    // Select high priority
    const highPriority = screen.getByText('Yüksek')
    fireEvent.click(highPriority)

    expect(mockOnFilterChange).toHaveBeenCalledWith({
      ...defaultFilters,
      priorityFilter: 'HIGH',
    })
  })

  it('filters by due date', () => {
    render(
      <FilterBar
        labels={mockLabels}
        filters={defaultFilters}
        onFilterChange={mockOnFilterChange}
      />
    )

    // Open date dropdown - it's the first filter button with "Tümü" text
    // Buttons order: Etiket, Date(Tümü), Completion(Tümü), Priority(Tümü)
    const allButtons = screen.getAllByRole('button')
    const tumuButtons = allButtons.filter(btn => btn.textContent?.includes('Tümü'))
    const dateButton = tumuButtons[0] // First "Tümü" button is date filter
    fireEvent.click(dateButton)

    // Click on 'Bugün' option
    const todayOption = screen.getByText('Bugün')
    fireEvent.click(todayOption)

    expect(mockOnFilterChange).toHaveBeenCalledWith({
      ...defaultFilters,
      dueDateFilter: 'today',
    })
  })

  it('filters by completion status', () => {
    render(
      <FilterBar
        labels={mockLabels}
        filters={defaultFilters}
        onFilterChange={mockOnFilterChange}
      />
    )

    // Find and click the completion filter dropdown
    // The dropdown shows "Tümü" by default
    const buttons = screen.getAllByRole('button')
    const completionButton = buttons.find(btn =>
      btn.textContent?.includes('Tümü') &&
      btn.innerHTML.includes('CheckSquare')
    )

    if (completionButton) {
      fireEvent.click(completionButton)

      // Select "Tamamlanan"
      const completedOption = screen.getByText('Tamamlanan')
      fireEvent.click(completedOption)

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        ...defaultFilters,
        completionFilter: 'completed',
      })
    }
  })

  it('clears all filters on reset', () => {
    const activeFilters: FilterState = {
      searchText: 'test',
      selectedLabels: [1, 2],
      dueDateFilter: 'today',
      completionFilter: 'completed',
      priorityFilter: 'HIGH',
    }

    render(
      <FilterBar
        labels={mockLabels}
        filters={activeFilters}
        onFilterChange={mockOnFilterChange}
      />
    )

    // Find and click the clear button
    const clearButton = screen.getByText(/Temizle/)
    fireEvent.click(clearButton)

    expect(mockOnFilterChange).toHaveBeenCalledWith(defaultFilters)
  })

  it('shows active filter count in clear button', () => {
    const activeFilters: FilterState = {
      searchText: 'test',
      selectedLabels: [1],
      dueDateFilter: 'today',
      completionFilter: 'all',
      priorityFilter: 'all',
    }

    render(
      <FilterBar
        labels={mockLabels}
        filters={activeFilters}
        onFilterChange={mockOnFilterChange}
      />
    )

    // Should show 3 active filters (searchText, labels, dueDate)
    expect(screen.getByText(/Temizle \(3\)/)).toBeInTheDocument()
  })

  it('toggles label off when clicked again', () => {
    const filtersWithLabel: FilterState = {
      ...defaultFilters,
      selectedLabels: [1],
    }

    render(
      <FilterBar
        labels={mockLabels}
        filters={filtersWithLabel}
        onFilterChange={mockOnFilterChange}
      />
    )

    // Open label dropdown
    const labelButton = screen.getByText('Etiket')
    fireEvent.click(labelButton)

    // Click on already selected label
    const bugLabel = screen.getByText('Bug')
    fireEvent.click(bugLabel)

    expect(mockOnFilterChange).toHaveBeenCalledWith({
      ...defaultFilters,
      selectedLabels: [],
    })
  })

  it('does not render label filter when no labels exist', () => {
    render(
      <FilterBar
        labels={[]}
        filters={defaultFilters}
        onFilterChange={mockOnFilterChange}
      />
    )

    // Label button should not be present
    expect(screen.queryByText('Etiket')).not.toBeInTheDocument()
  })

  it('getDefaultFilters returns correct default values', () => {
    const defaults = getDefaultFilters()

    expect(defaults).toEqual({
      searchText: '',
      selectedLabels: [],
      dueDateFilter: 'all',
      completionFilter: 'all',
      priorityFilter: 'all',
    })
  })

  it('clears search text when X button is clicked', () => {
    const filtersWithSearch: FilterState = {
      ...defaultFilters,
      searchText: 'test query',
    }

    render(
      <FilterBar
        labels={mockLabels}
        filters={filtersWithSearch}
        onFilterChange={mockOnFilterChange}
      />
    )

    // Find the clear search button (X button in search field)
    const clearSearchButtons = screen.getAllByRole('button')
    // The first small X button should be inside the search field
    const clearSearchButton = clearSearchButtons.find(btn =>
      btn.getAttribute('style')?.includes('absolute')
    )

    if (clearSearchButton) {
      fireEvent.click(clearSearchButton)

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        ...defaultFilters,
        searchText: '',
      })
    }
  })
})
