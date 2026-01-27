import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ViewMode = 'grid' | 'list';
export type SortField = 'alphabetic' | 'date' | 'deadline';
export type SortDirection = 'asc' | 'desc';

interface UIState {
  // Modal states
  isCreateBoardModalOpen: boolean;
  isEditBoardModalOpen: boolean;
  isDeleteConfirmOpen: boolean;
  editingBoardId: number | null;
  deletingBoardId: number | null;

  // Panel states
  isPanelOpen: boolean;
  selectedInfoBoardId: number | null;

  // View preferences (persisted)
  viewMode: ViewMode;
  sortField: SortField;
  sortDirection: SortDirection;

  // Pinned boards (persisted)
  pinnedBoardIds: number[];

  // Actions - Modals
  openCreateBoardModal: () => void;
  closeCreateBoardModal: () => void;
  openEditBoardModal: (boardId: number) => void;
  closeEditBoardModal: () => void;
  openDeleteConfirm: (boardId: number) => void;
  closeDeleteConfirm: () => void;

  // Actions - Panel
  togglePanel: () => void;
  setSelectedInfoBoard: (boardId: number | null) => void;

  // Actions - View preferences
  setViewMode: (mode: ViewMode) => void;
  setSortField: (field: SortField) => void;
  setSortDirection: (direction: SortDirection) => void;

  // Actions - Pinned boards
  togglePinBoard: (boardId: number) => void;
  unpinBoard: (boardId: number) => void;
}

export const MAX_PINNED_BOARDS = 5;

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Initial modal states
      isCreateBoardModalOpen: false,
      isEditBoardModalOpen: false,
      isDeleteConfirmOpen: false,
      editingBoardId: null,
      deletingBoardId: null,

      // Initial panel states
      isPanelOpen: true,
      selectedInfoBoardId: null,

      // Initial view preferences
      viewMode: 'grid',
      sortField: 'alphabetic',
      sortDirection: 'asc',

      // Initial pinned boards
      pinnedBoardIds: [],

      // Modal actions
      openCreateBoardModal: () => set({ isCreateBoardModalOpen: true }),
      closeCreateBoardModal: () => set({ isCreateBoardModalOpen: false }),
      openEditBoardModal: (boardId) => set({ isEditBoardModalOpen: true, editingBoardId: boardId }),
      closeEditBoardModal: () => set({ isEditBoardModalOpen: false, editingBoardId: null }),
      openDeleteConfirm: (boardId) => set({ isDeleteConfirmOpen: true, deletingBoardId: boardId }),
      closeDeleteConfirm: () => set({ isDeleteConfirmOpen: false, deletingBoardId: null }),

      // Panel actions
      togglePanel: () => set((state) => ({ isPanelOpen: !state.isPanelOpen })),
      setSelectedInfoBoard: (boardId) => set({ selectedInfoBoardId: boardId }),

      // View preference actions
      setViewMode: (mode) => set({ viewMode: mode }),
      setSortField: (field) => set({ sortField: field }),
      setSortDirection: (direction) => set({ sortDirection: direction }),

      // Pinned board actions
      togglePinBoard: (boardId) => set((state) => {
        if (state.pinnedBoardIds.includes(boardId)) {
          return { pinnedBoardIds: state.pinnedBoardIds.filter(id => id !== boardId) };
        } else {
          if (state.pinnedBoardIds.length >= MAX_PINNED_BOARDS) {
            return state; // Don't add if max reached
          }
          return { pinnedBoardIds: [...state.pinnedBoardIds, boardId] };
        }
      }),
      unpinBoard: (boardId) => set((state) => ({
        pinnedBoardIds: state.pinnedBoardIds.filter(id => id !== boardId)
      })),
    }),
    {
      name: 'workflow-ui',
      partialize: (state) => ({
        viewMode: state.viewMode,
        sortField: state.sortField,
        sortDirection: state.sortDirection,
        pinnedBoardIds: state.pinnedBoardIds,
        isPanelOpen: state.isPanelOpen,
      }),
    }
  )
);
