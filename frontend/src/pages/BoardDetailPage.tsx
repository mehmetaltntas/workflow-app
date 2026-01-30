import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useParams, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { AxiosError } from "axios";
import { taskService, labelService } from "../services/api";
import { handleError } from "../utils/errorHandler";
import { useBoardDetailQuery } from "../hooks/queries/useBoards";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryClient";
import { useAuthStore } from "../stores/authStore";
import type { Board, Task, TaskList, Subtask, Priority } from "../types";

import toast from "react-hot-toast";
import { MillerColumn, type MillerColumnItem } from "../components/MillerColumn";
import { MillerPreviewPanel } from "../components/MillerPreviewPanel";
import { subtaskService } from "../services/api";
import { DeleteConfirmation } from "../components/DeleteConfirmation";
import { TaskEditModal } from "../components/TaskEditModal";
import { ListEditModal } from "../components/ListEditModal";
import { SubtaskEditModal } from "../components/SubtaskEditModal";
import { LabelManager } from "../components/LabelManager";
import { getDefaultFilters } from "../components/FilterBar";
import type { FilterState } from "../components/FilterBar";
import { useTheme } from "../contexts/ThemeContext";
import { getThemeColors } from "../utils/themeColors";

import {
  BoardHeader,
  BoardStatsSection,
  BoardFilterSection,
  CreateListModal,
  CreateTaskModal,
  CreateSubtaskModal,
} from "../components/board";

const BoardDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const backPath = (location.state as { from?: string })?.from || '/boards';
  const [searchParams, setSearchParams] = useSearchParams();
  const { theme } = useTheme();
  const colors = getThemeColors(theme);

  // Data State - React Query
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.userId);
  const username = useAuthStore((state) => state.username);
  const { data: board = null, isLoading: loading, error: boardError } = useBoardDetailQuery(slug);

  // Board ownership & member assignment logic
  const isOwner = board?.isOwner ?? true; // default to true for backward compat

  // Find current user's assignments if they are a member
  const currentUserAssignments = useMemo(() => {
    if (isOwner || !board?.members || !board?.currentUserId) return null;
    const memberEntry = board.members.find(m => m.userId === board.currentUserId);
    return memberEntry?.assignments || [];
  }, [board, isOwner]);

  // Helper to check if current user is assigned to a target
  const isAssignedTo = useCallback((targetType: string, targetId: number): boolean => {
    if (isOwner) return true; // Owner can do everything
    if (!currentUserAssignments) return false;

    // Direct assignment check
    if (currentUserAssignments.some(a => a.targetType === targetType && a.targetId === targetId)) {
      return true;
    }

    // Inheritance: if assigned to LIST, can access TASKs and SUBTASKs under it
    if (targetType === 'TASK' && board) {
      const task = board.taskLists?.flatMap(l => l.tasks.map(t => ({ ...t, listId: l.id }))).find(t => t.id === targetId);
      if (task && currentUserAssignments.some(a => a.targetType === 'LIST' && a.targetId === task.listId)) {
        return true;
      }
    }

    if (targetType === 'SUBTASK' && board) {
      // Find the task that contains this subtask, then check list assignment
      for (const list of board.taskLists || []) {
        for (const task of list.tasks || []) {
          const subtask = task.subtasks?.find(s => s.id === targetId);
          if (subtask) {
            if (currentUserAssignments.some(a => a.targetType === 'TASK' && a.targetId === task.id)) return true;
            if (currentUserAssignments.some(a => a.targetType === 'LIST' && a.targetId === list.id)) return true;
          }
        }
      }
    }

    return false;
  }, [isOwner, currentUserAssignments, board]);

  // UI States
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [newListDescription, setNewListDescription] = useState("");
  const [newListLink, setNewListLink] = useState("");
  const [newListPriority, setNewListPriority] = useState<Priority>("NONE");
  const [newListLabelIds, setNewListLabelIds] = useState<number[]>([]);
  const [activeListId, setActiveListId] = useState<number | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskLink, setNewTaskLink] = useState("");

  // Subtask creation state
  const [activeTaskIdForSubtask, setActiveTaskIdForSubtask] = useState<number | null>(null);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [newSubtaskDescription, setNewSubtaskDescription] = useState("");
  const [newSubtaskLink, setNewSubtaskLink] = useState("");
  const [deleteListId, setDeleteListId] = useState<number | null>(null);
  const [deleteTaskId, setDeleteTaskId] = useState<number | null>(null);
  const [deleteSubtaskId, setDeleteSubtaskId] = useState<number | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingList, setEditingList] = useState<TaskList | null>(null);
  const [editingSubtask, setEditingSubtask] = useState<Subtask | null>(null);
  const [showLabelManager, setShowLabelManager] = useState(false);
  const [filters, setFilters] = useState<FilterState>(getDefaultFilters());

  // Miller Navigation State
  const [selectedListId, setSelectedListId] = useState<number | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [hoveredList, setHoveredList] = useState<TaskList | null>(null);
  const [hoveredTask, setHoveredTask] = useState<Task | null>(null);
  const [selectedSubtaskId, setSelectedSubtaskId] = useState<number | null>(null);
  const [hoveredSubtask, setHoveredSubtask] = useState<Subtask | null>(null);
  const [subtaskCache, setSubtaskCache] = useState<Map<number, Subtask[]>>(new Map());
  const [isLoadingSubtasks, setIsLoadingSubtasks] = useState(false);
  const subtaskCacheRef = useRef(subtaskCache);
  subtaskCacheRef.current = subtaskCache;

  // Undo state for list completion - using ref to avoid closure issues
  const listCompletionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (listCompletionTimeoutRef.current) {
        clearTimeout(listCompletionTimeoutRef.current);
      }
    };
  }, []);

  // Sorting
  // Default: Date (oldest to newest), down arrow
  const [sortBy, setSortBy] = useState<"name" | "date">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Error handling for board query
  useEffect(() => {
    if (boardError) {
      const axiosError = boardError as AxiosError;
      if (axiosError.response?.status === 404) {
        toast.error("Pano bulunamadı");
      } else if (axiosError.response?.status !== 401 && axiosError.response?.status !== 403) {
        toast.error("Pano yüklenirken hata oluştu");
      }
    }
  }, [boardError]);

  // Helper to invalidate board query and related caches (cross-query invalidation)
  const invalidateBoard = useCallback(() => {
    if (slug) {
      queryClient.invalidateQueries({ queryKey: queryKeys.boards.detail(slug) });
    }
    if (userId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.boards.list(userId) });
    }
    if (username) {
      queryClient.invalidateQueries({ queryKey: queryKeys.userProfileStats(username) });
    }
  }, [queryClient, slug, userId, username]);

  // URL sync for Miller navigation
  useEffect(() => {
    const listId = searchParams.get('list');
    const taskId = searchParams.get('task');
    setSelectedListId(listId ? parseInt(listId) : null);
    setSelectedTaskId(taskId ? parseInt(taskId) : null);
  }, [searchParams]);

  // Subtasks lazy loading
  const loadSubtasks = useCallback(async (taskId: number, signal?: AbortSignal) => {
    if (subtaskCacheRef.current.has(taskId)) return;

    try {
      setIsLoadingSubtasks(true);
      const subtasks = await subtaskService.getSubtasksByTask(taskId, { signal });
      setSubtaskCache(prev => new Map(prev).set(taskId, subtasks));
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      console.error('Alt görevler yüklenemedi:', error);
    } finally {
      setIsLoadingSubtasks(false);
    }
  }, []);

  const resetListForm = useCallback(() => {
    setNewListName("");
    setNewListDescription("");
    setNewListLink("");
    setNewListPriority("NONE");
    setNewListLabelIds([]);
    setIsAddingList(false);
  }, []);

  const handleCreateList = useCallback(async () => {
    if (!newListName) return;
    try {
      await taskService.createTaskList({
        name: newListName,
        boardId: board!.id,
        description: newListDescription || undefined,
        link: newListLink || undefined,
        priority: newListPriority !== "NONE" ? newListPriority : undefined,
        labelIds: newListLabelIds.length > 0 ? newListLabelIds : undefined,
      });
      resetListForm();
      invalidateBoard();
      toast.success("Liste eklendi");
    } catch (error) {
      handleError(error, 'Liste oluşturulamadı');
    }
  }, [newListName, newListDescription, newListLink, newListPriority, newListLabelIds, board, invalidateBoard, resetListForm]);

  const handleDeleteList = useCallback(async () => {
    if (deleteListId) {
      try {
        await taskService.deleteTaskList(deleteListId);
        setDeleteListId(null);
        invalidateBoard();
        toast.success("Silindi");
      } catch (error) {
        console.error(error);
        toast.error("Silinemedi");
      }
    }
  }, [deleteListId, invalidateBoard]);

  // handleUpdateListName removed - now handled via ListEditModal

  const handleListCompletionToggle = useCallback(async (list: TaskList) => {
    const newState = !list.isCompleted;

    // If there's a pending completion, cancel it
    if (listCompletionTimeoutRef.current) {
      clearTimeout(listCompletionTimeoutRef.current);
      listCompletionTimeoutRef.current = null;
      toast.dismiss();
    }

    // Update UI optimistically via React Query cache
    queryClient.setQueryData(queryKeys.boards.detail(slug!), (prev: Board | undefined) => {
      if (!prev) return prev;
      return {
        ...prev,
        taskLists: prev.taskLists.map(l =>
          l.id === list.id ? { ...l, isCompleted: newState } : l
        )
      };
    });

    // Show toast with undo option
    const toastId = toast(
      (t) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span>{newState ? "Liste tamamlandı" : "Liste devam ediyor"}</span>
          <button
            onClick={() => {
              // Cancel the pending update
              if (listCompletionTimeoutRef.current) {
                clearTimeout(listCompletionTimeoutRef.current);
                listCompletionTimeoutRef.current = null;
              }
              toast.dismiss(t.id);
              toast.success("Geri alındı", { icon: "↩️", duration: 1500 });
              // Revert optimistic update via React Query cache
              queryClient.setQueryData(queryKeys.boards.detail(slug!), (prev: Board | undefined) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  taskLists: prev.taskLists.map(l =>
                    l.id === list.id ? { ...l, isCompleted: !newState } : l
                  )
                };
              });
            }}
            style={{
              background: 'var(--primary)',
              color: 'white',
              border: 'none',
              padding: '4px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '13px',
            }}
          >
            Geri Al
          </button>
        </div>
      ),
      {
        icon: newState ? "✅" : "⏳",
        duration: 5000,
      }
    );

    // Set timeout to actually save the change
    listCompletionTimeoutRef.current = setTimeout(async () => {
      try {
        await taskService.updateTaskList(list.id, { isCompleted: newState });
        listCompletionTimeoutRef.current = null;
        toast.dismiss(toastId);
        invalidateBoard();
      } catch (error) {
        console.error(error);
        toast.error("Hata oluştu");
        // Revert optimistic update on error via React Query cache
        queryClient.setQueryData(queryKeys.boards.detail(slug!), (prev: Board | undefined) => {
          if (!prev) return prev;
          return {
            ...prev,
            taskLists: prev.taskLists.map(l =>
              l.id === list.id ? { ...l, isCompleted: !newState } : l
            )
          };
        });
      }
    }, 5000);
  }, [queryClient, slug, invalidateBoard]);

  const handleCreateTask = useCallback(async (listId: number) => {
    if (!newTaskTitle) return;
    try {
      await taskService.createTask({
        title: newTaskTitle,
        description: newTaskDescription || "",
        taskListId: listId,
        link: newTaskLink || undefined,
      });
      setNewTaskTitle("");
      setNewTaskDescription("");
      setNewTaskLink("");
      setActiveListId(null);
      invalidateBoard();
      toast.success("Görev eklendi");
    } catch (error) {
      handleError(error, 'Görev oluşturulamadı');
    }
  }, [newTaskTitle, newTaskDescription, newTaskLink, invalidateBoard]);

  const handleCreateSubtask = useCallback(async (taskId: number) => {
    if (!newSubtaskTitle) return;
    try {
      await subtaskService.createSubtask({
        title: newSubtaskTitle,
        taskId: taskId,
        description: newSubtaskDescription || undefined,
        link: newSubtaskLink || undefined,
      });
      setNewSubtaskTitle("");
      setNewSubtaskDescription("");
      setNewSubtaskLink("");
      setActiveTaskIdForSubtask(null);
      // Subtask cache'i temizle ve yeniden yükle
      setSubtaskCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(taskId);
        return newCache;
      });
      invalidateBoard();
      toast.success("Alt görev eklendi");
    } catch (error) {
      handleError(error, 'Alt görev oluşturulamadı');
    }
  }, [newSubtaskTitle, newSubtaskDescription, newSubtaskLink, invalidateBoard]);

  const handleTaskCompletionToggle = useCallback(async (task: Task, _list: TaskList) => {
    try {
      const newIsCompleted = !task.isCompleted;
      await taskService.updateTask(task.id, { isCompleted: newIsCompleted });

      // Backend handles cascade: task completion → list completion
      invalidateBoard();
      toast.success(task.isCompleted ? "Devam ediyor" : "Tamamlandı", {
        icon: task.isCompleted ? "⏳" : "✅",
        duration: 2000
      });
    } catch (error) {
      console.error(error);
      toast.error("Hata oluştu");
    }
  }, [invalidateBoard]);

  const handleDeleteTaskConfirm = useCallback(async () => {
    if (deleteTaskId) {
      try {
        await taskService.deleteTask(deleteTaskId);
        setDeleteTaskId(null);
        invalidateBoard();
        toast.success("Görev silindi");
      } catch (error) {
        console.error(error);
        toast.error("Görev silinemedi");
      }
    }
  }, [deleteTaskId, invalidateBoard]);

  const handleUpdateTask = useCallback(async (taskId: number, updates: Partial<Task>) => {
    try {
      await taskService.updateTask(taskId, updates);
      invalidateBoard();
      toast.success("Güncellendi");
    } catch (error) {
      handleError(error, 'Görev güncellenemedi');
      throw error;
    }
  }, [invalidateBoard]);

  // Handler for updating list from modal
  const handleUpdateList = useCallback(async (listId: number, updates: { name?: string; description?: string; link?: string; dueDate?: string | null; priority?: string; labelIds?: number[] }) => {
    try {
      await taskService.updateTaskList(listId, updates);
      invalidateBoard();
      toast.success("Liste güncellendi");
    } catch (error) {
      handleError(error, 'Liste güncellenemedi');
      throw error;
    }
  }, [invalidateBoard]);

  // Handler for bulk deleting tasks from modal
  const handleBulkDeleteTasks = useCallback(async (taskIds: number[]) => {
    try {
      await Promise.all(taskIds.map(taskId => taskService.deleteTask(taskId)));
      invalidateBoard();
      toast.success(`${taskIds.length} görev silindi`);
    } catch (error) {
      console.error(error);
      toast.error("Silme işlemi başarısız");
    }
  }, [invalidateBoard]);

  // Label handlers
  const handleCreateLabel = useCallback(async (data: { name: string; color: string; boardId: number }) => {
    try {
      await labelService.createLabel(data);
      invalidateBoard();
      toast.success("Etiket oluşturuldu");
    } catch (error) {
      console.error(error);
      toast.error("Etiket oluşturulamadı");
    }
  }, [invalidateBoard]);

  const handleUpdateLabel = useCallback(async (labelId: number, data: { name?: string; color?: string }) => {
    try {
      await labelService.updateLabel(labelId, data);
      invalidateBoard();
      toast.success("Etiket güncellendi");
    } catch (error) {
      console.error(error);
      toast.error("Etiket güncellenemedi");
    }
  }, [invalidateBoard]);

  const handleDeleteLabel = useCallback(async (labelId: number) => {
    try {
      await labelService.deleteLabel(labelId);
      invalidateBoard();
      toast.success("Etiket silindi");
    } catch (error) {
      console.error(error);
      toast.error("Etiket silinemedi");
    }
  }, [invalidateBoard]);

  // Filter function for tasks
  const filterTask = useCallback((task: Task): boolean => {
    // Search text filter
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      if (!task.title.toLowerCase().includes(searchLower)) {
        return false;
      }
    }

    // Labels filter
    if (filters.selectedLabels.length > 0) {
      const taskLabelIds = task.labels?.map(l => l.id) || [];
      const hasMatchingLabel = filters.selectedLabels.some(id => taskLabelIds.includes(id));
      if (!hasMatchingLabel) {
        return false;
      }
    }

    // Completion filter
    if (filters.completionFilter !== "all") {
      if (filters.completionFilter === "completed" && !task.isCompleted) {
        return false;
      }
      if (filters.completionFilter === "pending" && task.isCompleted) {
        return false;
      }
    }

    // Priority filter
    if (filters.priorityFilter !== "all") {
      const taskPriority = task.priority || "NONE";
      if (taskPriority !== filters.priorityFilter) {
        return false;
      }
    }

    return true;
  }, [filters]);

  // Memoize sorted and filtered task lists
  const sortedTaskLists = useMemo(() => {
    if (!board?.taskLists) return [];
    return [...board.taskLists].sort((a, b) => {
      if (sortBy === "name") {
        return sortOrder === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      }
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : a.id;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : b.id;
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    }).map(list => ({
      ...list,
      // Pre-sort and filter tasks
      tasks: [...list.tasks]
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
        .filter(filterTask)
    }));
  }, [board?.taskLists, sortBy, sortOrder, filterTask]);

  // Miller column items
  const listItems: MillerColumnItem[] = useMemo(() => {
    if (!board?.taskLists) return [];
    return sortedTaskLists.map(list => ({
      id: list.id,
      title: list.name,
      icon: 'folder' as const,
      isCompleted: list.isCompleted,
      hasChildren: true,
      metadata: {
        count: list.tasks.length, // Already filtered in sortedTaskLists
      },
    }));
  }, [board?.taskLists, sortedTaskLists]);

  const selectedList = useMemo(() => {
    if (!board || !selectedListId) return null;
    return sortedTaskLists.find(l => l.id === selectedListId) || null;
  }, [board, selectedListId, sortedTaskLists]);

  const taskItems: MillerColumnItem[] = useMemo(() => {
    if (!selectedList) return [];
    return selectedList.tasks.map(task => ({
      id: task.id,
      title: task.title,
      icon: 'task' as const,
      isCompleted: task.isCompleted,
      hasChildren: (task.subtasks?.length || 0) > 0,
      metadata: {
        labels: task.labels?.map(l => ({ id: l.id, color: l.color })),
        priority: task.priority,
        dueDate: task.dueDate || undefined,
      },
    }));
  }, [selectedList]);

  const selectedTask = useMemo(() => {
    if (!selectedList || !selectedTaskId) return null;
    return selectedList.tasks.find(t => t.id === selectedTaskId) || null;
  }, [selectedList, selectedTaskId]);

  const selectedSubtask = useMemo(() => {
    if (!selectedTask || !selectedSubtaskId) return null;
    const subtasks = subtaskCache.get(selectedTask.id) || selectedTask.subtasks || [];
    return subtasks.find(s => s.id === selectedSubtaskId) || null;
  }, [selectedTask, selectedSubtaskId, subtaskCache]);

  const subtaskItems: MillerColumnItem[] = useMemo(() => {
    if (!selectedTask) return [];
    const subtasks = subtaskCache.get(selectedTask.id) || selectedTask.subtasks || [];
    return subtasks
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      .map(subtask => ({
        id: subtask.id,
        title: subtask.title,
        icon: 'task' as const,
        isCompleted: subtask.isCompleted,
        hasChildren: false,
      }));
  }, [selectedTask, subtaskCache]);

  // Preview state
  const previewType = useMemo(() => {
    if (hoveredSubtask || selectedSubtask) return 'subtask';
    if (hoveredTask || selectedTask) return 'task';
    if (hoveredList || selectedList) return 'list';
    return null;
  }, [hoveredSubtask, selectedSubtask, hoveredTask, selectedTask, hoveredList, selectedList]);

  const previewData = useMemo(() => {
    if (hoveredSubtask) return hoveredSubtask;
    if (selectedSubtask) return selectedSubtask;
    if (hoveredTask) return hoveredTask;
    if (selectedTask) return selectedTask;
    if (hoveredList) return hoveredList;
    if (selectedList) return selectedList;
    return null;
  }, [hoveredSubtask, selectedSubtask, hoveredTask, selectedTask, hoveredList, selectedList]);

  const previewTasks = useMemo(() => {
    if (hoveredList) return hoveredList.tasks;
    if (selectedList && !selectedTask && !hoveredTask) return selectedList.tasks;
    return undefined;
  }, [hoveredList, selectedList, selectedTask, hoveredTask]);

  const previewSubtasks = useMemo(() => {
    const task = hoveredTask || selectedTask;
    if (!task) return undefined;
    return subtaskCache.get(task.id) || task.subtasks;
  }, [hoveredTask, selectedTask, subtaskCache]);

  // Miller navigation handlers
  const handleListSelect = useCallback((item: MillerColumnItem) => {
    // Toggle: if clicking the same list, close it
    if (selectedListId === item.id) {
      setSearchParams(new URLSearchParams());
      setHoveredTask(null);
      setHoveredSubtask(null);
      setSelectedSubtaskId(null);
      return;
    }

    const newParams = new URLSearchParams();
    newParams.set('list', item.id.toString());
    setSearchParams(newParams);
    setHoveredTask(null);
    setHoveredSubtask(null);
    setSelectedSubtaskId(null);
  }, [setSearchParams, selectedListId]);

  const handleTaskSelect = useCallback((item: MillerColumnItem) => {
    if (!selectedListId) return;

    // Toggle: if clicking the same task, close it but keep list open
    if (selectedTaskId === item.id) {
      const newParams = new URLSearchParams();
      newParams.set('list', selectedListId.toString());
      setSearchParams(newParams);
      setHoveredSubtask(null);
      setSelectedSubtaskId(null);
      return;
    }

    const newParams = new URLSearchParams();
    newParams.set('list', selectedListId.toString());
    newParams.set('task', item.id.toString());
    setSearchParams(newParams);
    setHoveredSubtask(null);
    setSelectedSubtaskId(null);
    loadSubtasks(item.id);
  }, [selectedListId, selectedTaskId, setSearchParams, loadSubtasks]);

  const handleListHover = useCallback((item: MillerColumnItem | null) => {
    if (item) {
      const list = sortedTaskLists.find(l => l.id === item.id);
      setHoveredList(list || null);
    } else {
      setHoveredList(null);
    }
  }, [sortedTaskLists]);

  const handleTaskHover = useCallback((item: MillerColumnItem | null) => {
    if (item && selectedListId) {
      const list = sortedTaskLists.find(l => l.id === selectedListId);
      const task = list?.tasks.find(t => t.id === item.id);
      setHoveredTask(task || null);
    } else {
      setHoveredTask(null);
    }
  }, [sortedTaskLists, selectedListId]);

  const handleSubtaskSelect = useCallback((item: MillerColumnItem) => {
    setSelectedSubtaskId(item.id);
  }, []);

  const handleSubtaskHover = useCallback((item: MillerColumnItem | null) => {
    if (item && selectedTask) {
      const subtasks = subtaskCache.get(selectedTask.id) || selectedTask.subtasks || [];
      const subtask = subtasks.find(s => s.id === item.id);
      setHoveredSubtask(subtask || null);
    } else {
      setHoveredSubtask(null);
    }
  }, [selectedTask, subtaskCache]);

  const handleSubtaskToggle = useCallback(async (subtask: Subtask) => {
    try {
      await subtaskService.toggleSubtask(subtask.id);
      // Subtask cache'i temizle ve yeniden yükle
      if (selectedTask) {
        setSubtaskCache(prev => {
          const newCache = new Map(prev);
          newCache.delete(selectedTask.id);
          return newCache;
        });
        loadSubtasks(selectedTask.id);
      }
      invalidateBoard();
      toast.success(subtask.isCompleted ? "Devam ediyor" : "Tamamlandı", {
        icon: subtask.isCompleted ? "⏳" : "✅",
        duration: 2000
      });
    } catch (error) {
      console.error(error);
      toast.error("Hata oluştu");
    }
  }, [selectedTask, loadSubtasks, invalidateBoard]);

  const handleDeleteSubtaskConfirm = useCallback(async () => {
    if (deleteSubtaskId) {
      try {
        await subtaskService.deleteSubtask(deleteSubtaskId);
        // Subtask cache'i temizle
        if (selectedTask) {
          setSubtaskCache(prev => {
            const newCache = new Map(prev);
            newCache.delete(selectedTask.id);
            return newCache;
          });
        }
        setDeleteSubtaskId(null);
        invalidateBoard();
        toast.success("Alt görev silindi");
      } catch (error) {
        console.error(error);
        toast.error("Alt görev silinemedi");
      }
    }
  }, [deleteSubtaskId, selectedTask, invalidateBoard]);

  const handleUpdateSubtask = useCallback(async (subtaskId: number, updates: {
    title?: string;
    description?: string;
    link?: string;
  }) => {
    try {
      await subtaskService.updateSubtask(subtaskId, updates);
      // Subtask cache'i temizle ve yeniden yükle
      if (selectedTask) {
        setSubtaskCache(prev => {
          const newCache = new Map(prev);
          newCache.delete(selectedTask.id);
          return newCache;
        });
        loadSubtasks(selectedTask.id);
      }
      invalidateBoard();
      toast.success("Alt görev güncellendi");
    } catch (error) {
      handleError(error, 'Alt görev güncellenemedi');
      throw error;
    }
  }, [selectedTask, loadSubtasks, invalidateBoard]);

  const handleBreadcrumbClick = useCallback((level: 'board' | 'list' | 'task') => {
    switch (level) {
      case 'board':
        setSearchParams(new URLSearchParams());
        break;
      case 'list':
        if (selectedListId) {
          const newParams = new URLSearchParams();
          newParams.set('list', selectedListId.toString());
          setSearchParams(newParams);
        }
        break;
      default:
        break;
    }
  }, [selectedListId, setSearchParams]);

  // Close handlers for modals
  const handleCloseTaskModal = useCallback(() => {
    setActiveListId(null);
    setNewTaskTitle("");
    setNewTaskDescription("");
    setNewTaskLink("");
  }, []);

  const handleCloseSubtaskModal = useCallback(() => {
    setActiveTaskIdForSubtask(null);
    setNewSubtaskTitle("");
    setNewSubtaskDescription("");
    setNewSubtaskLink("");
  }, []);

  if (loading)
    return (
      <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-body)", color: "var(--text-muted)" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
          <h2>Yükleniyor...</h2>
        </div>
      </div>
    );

  if (!board)
    return (
      <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-body)", color: "var(--text-muted)" }}>
        <h2>Pano bulunamadı.</h2>
      </div>
    );

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "var(--bg-body)" }}>
      <DeleteConfirmation
        isOpen={!!deleteListId}
        title="Listeyi silmek istiyor musun?"
        message="Bu liste ve içindeki tüm görevler kalıcı olarak silinecek."
        onConfirm={handleDeleteList}
        onCancel={() => setDeleteListId(null)}
        confirmText="Evet, Sil"
        variant="danger"
        autoCloseDelay={6000}
      />

      <DeleteConfirmation
        isOpen={!!deleteTaskId}
        title="Görevi silmek istiyor musun?"
        message="Bu görev ve tüm alt görevleri kalıcı olarak silinecek."
        onConfirm={handleDeleteTaskConfirm}
        onCancel={() => setDeleteTaskId(null)}
        confirmText="Evet, Sil"
        variant="danger"
        autoCloseDelay={6000}
      />

      <DeleteConfirmation
        isOpen={!!deleteSubtaskId}
        title="Alt görevi silmek istiyor musun?"
        message="Bu alt görev kalıcı olarak silinecek."
        onConfirm={handleDeleteSubtaskConfirm}
        onCancel={() => setDeleteSubtaskId(null)}
        confirmText="Evet, Sil"
        variant="danger"
        autoCloseDelay={6000}
      />

      {editingTask && (
        <TaskEditModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSave={handleUpdateTask}
          onSubtaskChange={() => {
            // Subtask cache'ini temizle ve yeniden yükle
            setSubtaskCache(prev => {
              const newCache = new Map(prev);
              newCache.delete(editingTask.id);
              return newCache;
            });
            invalidateBoard();
          }}
        />
      )}

      {editingList && (
        <ListEditModal
          list={editingList}
          boardLabels={board.labels}
          onClose={() => setEditingList(null)}
          onSave={handleUpdateList}
          onDeleteTasks={handleBulkDeleteTasks}
        />
      )}

      {editingSubtask && (
        <SubtaskEditModal
          subtask={editingSubtask}
          onClose={() => setEditingSubtask(null)}
          onSave={handleUpdateSubtask}
        />
      )}

      {showLabelManager && (
        <LabelManager
          boardId={board.id}
          labels={board.labels || []}
          onClose={() => setShowLabelManager(false)}
          onCreateLabel={handleCreateLabel}
          onUpdateLabel={handleUpdateLabel}
          onDeleteLabel={handleDeleteLabel}
        />
      )}

      {/* Modern Header with Breadcrumb */}
      <BoardHeader
        boardName={board.name}
        boardLabels={board.labels || []}
        slug={slug}
        backPath={backPath}
        isOwner={isOwner}
        selectedList={selectedList}
        selectedTask={selectedTask}
        selectedTaskId={selectedTaskId}
        selectedListId={selectedListId}
        selectedSubtask={selectedSubtask}
        sortBy={sortBy}
        sortOrder={sortOrder}
        colors={colors}
        onNavigateBack={() => navigate(backPath)}
        onNavigateInfo={() => navigate(`/boards/info/${slug}`, { state: { from: `/boards/${slug}` } })}
        onBreadcrumbClick={handleBreadcrumbClick}
        onClearSubtaskSelection={() => setSelectedSubtaskId(null)}
        onShowLabelManager={() => setShowLabelManager(true)}
        onSortByChange={setSortBy}
        onSortOrderToggle={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
      />

      {/* Stats Bar */}
      <BoardStatsSection
        board={board}
        selectedList={selectedList}
        selectedTask={selectedTask}
        subtasks={selectedTask ? (subtaskCache.get(selectedTask.id) || selectedTask.subtasks || []) : undefined}
      />

      {/* Filter Bar */}
      <BoardFilterSection
        labels={board.labels || []}
        filters={filters}
        onFilterChange={setFilters}
      />

      {/* Miller Columns Content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Miller Columns Container */}
        <div style={{ display: 'flex', flex: 1, overflowX: 'auto', overflowY: 'hidden' }}>
          {/* Column 1: Lists */}
          <MillerColumn
            title="LİSTELER"
            items={listItems}
            selectedId={selectedListId}
            hoveredId={hoveredList?.id ?? null}
            onSelect={handleListSelect}
            onHover={handleListHover}
            columnIndex={0}
            emptyMessage="Bu panoda liste yok"
            onAddItem={isOwner ? () => setIsAddingList(true) : undefined}
            onItemEdit={isOwner ? (item) => {
              const list = sortedTaskLists.find(l => l.id === item.id);
              if (list) setEditingList(list);
            } : undefined}
            onItemDelete={isOwner ? (item) => setDeleteListId(item.id) : undefined}
            onItemToggle={(item) => {
              if (!isOwner && !isAssignedTo('LIST', item.id)) return;
              const list = sortedTaskLists.find(l => l.id === item.id);
              if (list) handleListCompletionToggle(list);
            }}
          />

          {/* Column 2: Tasks (when list selected) */}
          {selectedListId && selectedList && (
            <MillerColumn
              title="GÖREVLER"
              items={taskItems}
              selectedId={selectedTaskId}
              hoveredId={hoveredTask?.id ?? null}
              onSelect={handleTaskSelect}
              onHover={handleTaskHover}
              columnIndex={1}
              emptyMessage="Bu listede görev yok"
              onAddItem={isOwner ? () => setActiveListId(selectedListId) : undefined}
              onItemEdit={isOwner ? (item) => {
                const task = selectedList.tasks.find(t => t.id === item.id);
                if (task) setEditingTask(task);
              } : undefined}
              onItemDelete={isOwner ? (item) => setDeleteTaskId(item.id) : undefined}
              onItemToggle={(item) => {
                if (!isOwner && !isAssignedTo('TASK', item.id)) return;
                const task = selectedList.tasks.find(t => t.id === item.id);
                if (task) handleTaskCompletionToggle(task, selectedList);
              }}
            />
          )}

          {/* Column 3: Subtasks (when task selected - always visible) */}
          {selectedTaskId && selectedTask && (
            <MillerColumn
              title="ALT GÖREVLER"
              items={subtaskItems}
              selectedId={selectedSubtaskId}
              hoveredId={hoveredSubtask?.id ?? null}
              onSelect={handleSubtaskSelect}
              onHover={handleSubtaskHover}
              columnIndex={2}
              isLoading={isLoadingSubtasks}
              emptyMessage="Alt görev yok"
              onAddItem={isOwner ? () => setActiveTaskIdForSubtask(selectedTask.id) : undefined}
              onItemEdit={isOwner ? (item) => {
                const subtasks = subtaskCache.get(selectedTask.id) || selectedTask.subtasks || [];
                const subtask = subtasks.find(s => s.id === item.id);
                if (subtask) setEditingSubtask(subtask);
              } : undefined}
              onItemToggle={(item) => {
                if (!isOwner && !isAssignedTo('SUBTASK', item.id)) return;
                const subtasks = subtaskCache.get(selectedTask.id) || selectedTask.subtasks || [];
                const subtask = subtasks.find(s => s.id === item.id);
                if (subtask) handleSubtaskToggle(subtask);
              }}
              onItemDelete={isOwner ? (item) => setDeleteSubtaskId(item.id) : undefined}
            />
          )}
        </div>

        {/* Preview Panel */}
        <div
          style={{
            width: '400px',
            minWidth: '400px',
            borderLeft: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <MillerPreviewPanel
            type={previewType}
            data={previewData}
            tasks={previewTasks}
            subtasks={previewSubtasks}
            isLoading={isLoadingSubtasks && previewType === 'task'}
            onEditTask={isOwner ? (task) => setEditingTask(task) : undefined}
            onEditList={isOwner ? (list) => setEditingList(list) : undefined}
            onEditSubtask={isOwner ? (subtask) => setEditingSubtask(subtask) : undefined}
            onToggleTask={(task) => {
              if (!isOwner && !isAssignedTo('TASK', task.id)) return;
              if (selectedList) handleTaskCompletionToggle(task, selectedList);
            }}
            onToggleList={(list) => {
              if (!isOwner && !isAssignedTo('LIST', list.id)) return;
              handleListCompletionToggle(list);
            }}
            onToggleSubtask={(subtask) => {
              if (!isOwner && !isAssignedTo('SUBTASK', subtask.id)) return;
              handleSubtaskToggle(subtask);
            }}
            onDeleteTask={isOwner ? (taskId) => setDeleteTaskId(taskId) : undefined}
            onDeleteList={isOwner ? (listId) => setDeleteListId(listId) : undefined}
            onDeleteSubtask={isOwner ? (subtaskId) => setDeleteSubtaskId(subtaskId) : undefined}
          />
        </div>
      </div>

      {/* Add List Modal */}
      {isAddingList && (
        <CreateListModal
          newListName={newListName}
          newListDescription={newListDescription}
          newListLink={newListLink}
          newListPriority={newListPriority}
          newListLabelIds={newListLabelIds}
          boardLabels={board.labels || []}
          onNameChange={setNewListName}
          onDescriptionChange={setNewListDescription}
          onLinkChange={setNewListLink}
          onPriorityChange={setNewListPriority}
          onLabelIdsChange={setNewListLabelIds}
          onSubmit={handleCreateList}
          onClose={resetListForm}
        />
      )}

      {/* Add Task Modal */}
      {activeListId && (
        <CreateTaskModal
          activeListId={activeListId}
          newTaskTitle={newTaskTitle}
          newTaskDescription={newTaskDescription}
          newTaskLink={newTaskLink}
          onTitleChange={setNewTaskTitle}
          onDescriptionChange={setNewTaskDescription}
          onLinkChange={setNewTaskLink}
          onSubmit={handleCreateTask}
          onClose={handleCloseTaskModal}
        />
      )}

      {/* Add Subtask Modal */}
      {activeTaskIdForSubtask && (
        <CreateSubtaskModal
          activeTaskId={activeTaskIdForSubtask}
          newSubtaskTitle={newSubtaskTitle}
          newSubtaskDescription={newSubtaskDescription}
          newSubtaskLink={newSubtaskLink}
          onTitleChange={setNewSubtaskTitle}
          onDescriptionChange={setNewSubtaskDescription}
          onLinkChange={setNewSubtaskLink}
          onSubmit={handleCreateSubtask}
          onClose={handleCloseSubtaskModal}
        />
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes millerSlideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};
export default BoardDetailPage;
