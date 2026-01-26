import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useParams, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { AxiosError } from "axios";
import { taskService, labelService } from "../services/api";
import { useBoardDetailQuery } from "../hooks/queries/useBoards";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryClient";
import type { Board, Task, TaskList, Subtask, Priority, Label } from "../types";

import toast from "react-hot-toast";
import { ArrowLeft, X, ArrowUp, ArrowDown, Tag, Home, ChevronRight } from "lucide-react";
import { MillerColumn, type MillerColumnItem } from "../components/MillerColumn";
import { MillerPreviewPanel } from "../components/MillerPreviewPanel";
import { subtaskService } from "../services/api";
import { DeleteConfirmation } from "../components/DeleteConfirmation";
import { TaskEditModal } from "../components/TaskEditModal";
import { ListEditModal } from "../components/ListEditModal";
import { SubtaskEditModal } from "../components/SubtaskEditModal";
import { LabelManager } from "../components/LabelManager";
import { FilterBar, getDefaultFilters } from "../components/FilterBar";
import { StatsBar } from "../components/StatsBar";
import type { FilterState } from "../components/FilterBar";
import { useTheme } from "../contexts/ThemeContext";
import { getThemeColors } from "../utils/themeColors";
import { colors as tokenColors } from "../styles/tokens";

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
  const { data: board = null, isLoading: loading, error: boardError } = useBoardDetailQuery(slug);

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

  // Helper to invalidate board query (replaces loadBoardData)
  const invalidateBoard = useCallback(() => {
    if (slug) {
      queryClient.invalidateQueries({ queryKey: queryKeys.boards.detail(slug) });
    }
  }, [queryClient, slug]);

  // URL sync for Miller navigation
  useEffect(() => {
    const listId = searchParams.get('list');
    const taskId = searchParams.get('task');
    setSelectedListId(listId ? parseInt(listId) : null);
    setSelectedTaskId(taskId ? parseInt(taskId) : null);
  }, [searchParams]);

  // Subtasks lazy loading
  const loadSubtasks = useCallback(async (taskId: number) => {
    if (subtaskCacheRef.current.has(taskId)) return;

    try {
      setIsLoadingSubtasks(true);
      const subtasks = await subtaskService.getSubtasksByTask(taskId);
      setSubtaskCache(prev => new Map(prev).set(taskId, subtasks));
    } catch (error) {
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
      console.error(error);
      toast.error("Hata oluştu");
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
      console.error(error);
      toast.error("Görev eklenemedi");
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
      console.error(error);
      toast.error("Alt görev eklenemedi");
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

  const handleDeleteTask = useCallback(async (taskId: number) => {
    try {
      await taskService.deleteTask(taskId);
      invalidateBoard();
      toast.success("Silindi");
    } catch (error) {
      console.error(error);
      toast.error("Silinemedi");
    }
  }, [invalidateBoard]);

  const handleUpdateTask = useCallback(async (taskId: number, updates: Partial<Task>) => {
    try {
      await taskService.updateTask(taskId, updates);
      invalidateBoard();
      toast.success("Güncellendi");
    } catch (error) {
      console.error(error);
      toast.error("Hata oluştu");
    }
  }, [invalidateBoard]);

  // Handler for updating list from modal
  const handleUpdateList = useCallback(async (listId: number, updates: { name?: string; description?: string; link?: string; dueDate?: string | null; priority?: string; labelIds?: number[] }) => {
    try {
      await taskService.updateTaskList(listId, updates);
      invalidateBoard();
      toast.success("Liste güncellendi");
    } catch (error) {
      console.error(error);
      toast.error("Güncellenemedi");
    }
  }, [invalidateBoard]);

  // Handler for bulk deleting tasks from modal
  const handleBulkDeleteTasks = useCallback(async (taskIds: number[]) => {
    try {
      for (const taskId of taskIds) {
        await taskService.deleteTask(taskId);
      }
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

  const handleDeleteSubtask = useCallback(async (subtaskId: number) => {
    try {
      await subtaskService.deleteSubtask(subtaskId);
      // Subtask cache'i temizle
      if (selectedTask) {
        setSubtaskCache(prev => {
          const newCache = new Map(prev);
          newCache.delete(selectedTask.id);
          return newCache;
        });
      }
      invalidateBoard();
      toast.success("Alt görev silindi");
    } catch (error) {
      console.error(error);
      toast.error("Alt görev silinemedi");
    }
  }, [selectedTask, invalidateBoard]);

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
      console.error(error);
      toast.error("Alt görev güncellenemedi");
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
      <div style={{ padding: "16px 24px", background: colors.bgHeader, borderBottom: `1px solid ${colors.borderDefault}`, display: "flex", justifyContent: "space-between", alignItems: "center", backdropFilter: "blur(20px)", zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button onClick={() => navigate(backPath)} className="btn btn-ghost" style={{ padding: "8px 12px", display: "flex", alignItems: "center", gap: "8px", borderRadius: '12px', color: 'var(--text-muted)' }}>
            <ArrowLeft size={16} />
          </button>

          {/* Breadcrumb Navigation */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => handleBreadcrumbClick('board')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '8px',
                border: 'none',
                background: !selectedListId ? 'var(--primary)' : 'transparent',
                color: !selectedListId ? tokenColors.dark.text.primary : 'var(--text-main)',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                transition: 'all 0.15s ease',
              }}
            >
              <Home size={14} />
              {board.name}
            </button>

            {selectedList && (
              <>
                <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                <button
                  onClick={() => handleBreadcrumbClick('list')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: selectedList && !selectedTaskId ? 'var(--primary)' : 'transparent',
                    color: selectedList && !selectedTaskId ? tokenColors.dark.text.primary : 'var(--text-main)',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 500,
                    transition: 'all 0.15s ease',
                  }}
                >
                  {selectedList.name}
                </button>
              </>
            )}

            {selectedTask && (
              <>
                <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                <button
                  onClick={() => setSelectedSubtaskId(null)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: selectedTask && !selectedSubtask ? 'var(--primary)' : 'transparent',
                    color: selectedTask && !selectedSubtask ? tokenColors.dark.text.primary : 'var(--text-main)',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 500,
                    maxWidth: '200px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {selectedTask.title}
                </button>
              </>
            )}

            {selectedSubtask && (
              <>
                <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    background: 'var(--primary)',
                    color: tokenColors.dark.text.primary,
                    fontSize: '14px',
                    fontWeight: 500,
                    maxWidth: '200px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {selectedSubtask.title}
                </span>
              </>
            )}
          </nav>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          {/* Labels Button */}
          <button
            onClick={() => setShowLabelManager(true)}
            className="header-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '12px',
              border: `1px solid ${colors.borderDefault}`,
              background: colors.bgElevated,
              color: colors.textSecondary,
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
              backdropFilter: 'blur(10px)',
            }}
          >
            <Tag size={14} />
            Etiketler
            {board.labels && board.labels.length > 0 && (
              <span style={{
                background: 'var(--primary)',
                color: tokenColors.dark.text.primary,
                fontSize: '10px',
                fontWeight: '700',
                padding: '2px 6px',
                borderRadius: '8px',
                minWidth: '18px',
                textAlign: 'center',
              }}>
                {board.labels.length}
              </span>
            )}
          </button>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: colors.bgElevated,
            padding: '4px',
            borderRadius: '14px',
            border: `1px solid ${colors.borderDefault}`,
            backdropFilter: 'blur(10px)',
            boxShadow: 'var(--shadow-md)',
          }}>
            {/* Sort Type Buttons */}
            <div style={{ display: 'flex', gap: '2px' }}>
              <button
                onClick={() => setSortBy("name")}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  fontSize: '11px',
                  fontWeight: '700',
                  letterSpacing: '0.03em',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  background: sortBy === "name" ? 'rgba(var(--primary-rgb), 0.15)' : 'transparent',
                  color: sortBy === "name" ? 'var(--primary)' : colors.textMuted,
                  boxShadow: sortBy === "name" ? '0 2px 8px rgba(var(--primary-rgb), 0.2)' : 'none',
                }}
              >
                Alfabetik
              </button>
              <button
                onClick={() => setSortBy("date")}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  fontSize: '11px',
                  fontWeight: '700',
                  letterSpacing: '0.03em',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  background: sortBy === "date" ? 'rgba(var(--primary-rgb), 0.15)' : 'transparent',
                  color: sortBy === "date" ? 'var(--primary)' : colors.textMuted,
                  boxShadow: sortBy === "date" ? '0 2px 8px rgba(var(--primary-rgb), 0.2)' : 'none',
                }}
              >
                Tarih
              </button>
            </div>

            {/* Divider */}
            <div style={{
              width: '1px',
              height: '20px',
              background: colors.divider,
              margin: '0 6px'
            }} />

            {/* Direction Toggle Arrow */}
            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                background: colors.bgHover,
                color: 'var(--primary)',
                transition: 'all 0.2s ease',
              }}
              title={
                sortBy === "name"
                  ? (sortOrder === "asc" ? "A'dan Z'ye" : "Z'den A'ya")
                  : (sortOrder === "asc" ? "Eskiden Yeniye" : "Yeniden Eskiye")
              }
            >
              {sortOrder === "asc" ? <ArrowDown size={16} /> : <ArrowUp size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <StatsBar
        board={board}
        selectedList={selectedList}
        selectedTask={selectedTask}
        subtasks={selectedTask ? (subtaskCache.get(selectedTask.id) || selectedTask.subtasks || []) : undefined}
      />

      {/* Filter Bar */}
      <FilterBar
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
            onAddItem={() => setIsAddingList(true)}
            onItemEdit={(item) => {
              const list = sortedTaskLists.find(l => l.id === item.id);
              if (list) setEditingList(list);
            }}
            onItemDelete={(item) => setDeleteListId(item.id)}
            onItemToggle={(item) => {
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
              onAddItem={() => setActiveListId(selectedListId)}
              onItemEdit={(item) => {
                const task = selectedList.tasks.find(t => t.id === item.id);
                if (task) setEditingTask(task);
              }}
              onItemDelete={(item) => handleDeleteTask(item.id)}
              onItemToggle={(item) => {
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
              onAddItem={() => setActiveTaskIdForSubtask(selectedTask.id)}
              onItemEdit={(item) => {
                const subtasks = subtaskCache.get(selectedTask.id) || selectedTask.subtasks || [];
                const subtask = subtasks.find(s => s.id === item.id);
                if (subtask) setEditingSubtask(subtask);
              }}
              onItemToggle={(item) => {
                const subtasks = subtaskCache.get(selectedTask.id) || selectedTask.subtasks || [];
                const subtask = subtasks.find(s => s.id === item.id);
                if (subtask) handleSubtaskToggle(subtask);
              }}
              onItemDelete={(item) => handleDeleteSubtask(item.id)}
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
            onEditTask={(task) => setEditingTask(task)}
            onEditList={(list) => setEditingList(list)}
            onEditSubtask={(subtask) => setEditingSubtask(subtask)}
            onToggleTask={(task) => {
              if (selectedList) handleTaskCompletionToggle(task, selectedList);
            }}
            onToggleList={(list) => handleListCompletionToggle(list)}
            onToggleSubtask={(subtask) => handleSubtaskToggle(subtask)}
            onDeleteTask={(taskId) => handleDeleteTask(taskId)}
            onDeleteList={(listId) => setDeleteListId(listId)}
            onDeleteSubtask={(subtaskId) => handleDeleteSubtask(subtaskId)}
          />
        </div>
      </div>

      {/* Add List Modal/Inline UI */}
      {isAddingList && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: tokenColors.dark.bg.modalOverlay,
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={resetListForm}
        >
          <div
            style={{
              background: tokenColors.dark.bg.card,
              borderRadius: '20px',
              padding: '28px',
              width: '550px',
              maxHeight: '85vh',
              overflowY: 'auto',
              border: `1px solid ${tokenColors.dark.border.strong}`,
              boxShadow: '0 24px 48px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center" style={{ marginBottom: '20px' }}>
              <span style={{ fontSize: "16px", fontWeight: "700", color: 'var(--text-main)' }}>Yeni Liste</span>
              <button onClick={resetListForm} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
            </div>

            {/* Liste Adı */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>Liste Adı *</label>
              <input
                autoFocus
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                maxLength={25}
                placeholder="Liste adı..."
                style={{
                  width: "100%",
                  borderRadius: '10px',
                  background: tokenColors.dark.bg.hover,
                  border: `1px solid ${tokenColors.dark.border.subtle}`,
                  padding: '12px',
                  fontSize: '14px',
                  color: 'var(--text-main)',
                }}
              />
            </div>

            {/* Açıklama */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>Açıklama</label>
              <textarea
                value={newListDescription}
                onChange={(e) => setNewListDescription(e.target.value)}
                placeholder="Liste açıklaması..."
                style={{
                  width: "100%",
                  borderRadius: '10px',
                  background: tokenColors.dark.bg.hover,
                  border: `1px solid ${tokenColors.dark.border.subtle}`,
                  padding: '12px',
                  fontSize: '14px',
                  color: 'var(--text-main)',
                  minHeight: '80px',
                  resize: 'vertical',
                }}
              />
            </div>

            {/* Link */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>Link</label>
              <input
                type="url"
                value={newListLink}
                onChange={(e) => setNewListLink(e.target.value)}
                placeholder="https://..."
                style={{
                  width: "100%",
                  borderRadius: '10px',
                  background: tokenColors.dark.bg.hover,
                  border: `1px solid ${tokenColors.dark.border.subtle}`,
                  padding: '12px',
                  fontSize: '14px',
                  color: 'var(--primary)',
                }}
              />
            </div>

            {/* Öncelik */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>Öncelik</label>
              <select
                value={newListPriority}
                onChange={(e) => setNewListPriority(e.target.value as Priority)}
                style={{
                  width: "100%",
                  borderRadius: '10px',
                  background: tokenColors.dark.bg.hover,
                  border: `1px solid ${tokenColors.dark.border.subtle}`,
                  padding: '12px',
                  fontSize: '14px',
                  color: 'var(--text-main)',
                  cursor: 'pointer',
                }}
              >
                <option value="NONE">Yok</option>
                <option value="LOW">Düşük</option>
                <option value="MEDIUM">Orta</option>
                <option value="HIGH">Yüksek</option>
              </select>
            </div>

            {/* Etiketler */}
            {board?.labels && board.labels.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Etiketler</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {board.labels.map((label: Label) => {
                    const isSelected = newListLabelIds.includes(label.id);
                    return (
                      <button
                        key={label.id}
                        type="button"
                        onClick={() => setNewListLabelIds(prev =>
                          isSelected ? prev.filter(id => id !== label.id) : [...prev, label.id]
                        )}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          border: `1px solid ${isSelected ? label.color : tokenColors.dark.border.subtle}`,
                          background: isSelected ? `${label.color}25` : 'transparent',
                          color: isSelected ? label.color : 'var(--text-muted)',
                          fontSize: '13px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: label.color }} />
                        {label.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <button
              onClick={handleCreateList}
              disabled={!newListName.trim()}
              className="btn btn-primary font-semibold"
              style={{
                width: '100%',
                borderRadius: '10px',
                height: '42px',
                opacity: !newListName.trim() ? 0.5 : 1,
                cursor: !newListName.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              Oluştur
            </button>
          </div>
        </div>
      )}

      {/* Add Task Modal/Inline UI */}
      {activeListId && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: tokenColors.dark.bg.modalOverlay,
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => {
            setActiveListId(null);
            setNewTaskTitle("");
            setNewTaskDescription("");
            setNewTaskLink("");
          }}
        >
          <div
            style={{
              background: tokenColors.dark.bg.card,
              borderRadius: '20px',
              padding: '28px',
              width: '500px',
              maxHeight: '85vh',
              overflowY: 'auto',
              border: `1px solid ${tokenColors.dark.border.strong}`,
              boxShadow: '0 24px 48px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center" style={{ marginBottom: '20px' }}>
              <span style={{ fontSize: "16px", fontWeight: "700", color: 'var(--text-main)' }}>Yeni Görev</span>
              <button onClick={() => {
                setActiveListId(null);
                setNewTaskTitle("");
                setNewTaskDescription("");
                setNewTaskLink("");
              }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
            </div>

            {/* İsim */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>Görev Adı *</label>
              <input
                autoFocus
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                maxLength={25}
                placeholder="Görev adı..."
                style={{
                  width: "100%",
                  borderRadius: '10px',
                  background: tokenColors.dark.bg.hover,
                  border: `1px solid ${tokenColors.dark.border.subtle}`,
                  padding: '12px',
                  fontSize: '14px',
                  color: 'var(--text-main)',
                }}
                onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); handleCreateTask(activeListId); } }}
              />
            </div>

            {/* Açıklama */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>Açıklama</label>
              <textarea
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                placeholder="Görev açıklaması..."
                style={{
                  width: "100%",
                  minHeight: "80px",
                  borderRadius: '10px',
                  background: tokenColors.dark.bg.hover,
                  border: `1px solid ${tokenColors.dark.border.subtle}`,
                  padding: '12px',
                  fontSize: '14px',
                  color: 'var(--text-main)',
                  resize: 'vertical',
                }}
              />
            </div>

            {/* Link */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>Bağlantı</label>
              <input
                type="url"
                value={newTaskLink}
                onChange={(e) => setNewTaskLink(e.target.value)}
                placeholder="https://..."
                style={{
                  width: "100%",
                  borderRadius: '10px',
                  background: tokenColors.dark.bg.hover,
                  border: `1px solid ${tokenColors.dark.border.subtle}`,
                  padding: '12px',
                  fontSize: '14px',
                  color: 'var(--primary)',
                }}
              />
            </div>

            <button
              onClick={() => handleCreateTask(activeListId)}
              disabled={!newTaskTitle.trim()}
              className="btn btn-primary font-semibold"
              style={{
                width: '100%',
                borderRadius: '10px',
                height: '42px',
                opacity: !newTaskTitle.trim() ? 0.5 : 1,
                cursor: !newTaskTitle.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              Oluştur
            </button>
          </div>
        </div>
      )}

      {/* Add Subtask Modal */}
      {activeTaskIdForSubtask && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: tokenColors.dark.bg.modalOverlay,
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => {
            setActiveTaskIdForSubtask(null);
            setNewSubtaskTitle("");
            setNewSubtaskDescription("");
            setNewSubtaskLink("");
          }}
        >
          <div
            style={{
              background: tokenColors.dark.bg.card,
              borderRadius: '20px',
              padding: '28px',
              width: '500px',
              maxHeight: '85vh',
              overflowY: 'auto',
              border: `1px solid ${tokenColors.dark.border.strong}`,
              boxShadow: '0 24px 48px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center" style={{ marginBottom: '20px' }}>
              <span style={{ fontSize: "16px", fontWeight: "700", color: 'var(--text-main)' }}>Yeni Alt Görev</span>
              <button onClick={() => {
                setActiveTaskIdForSubtask(null);
                setNewSubtaskTitle("");
                setNewSubtaskDescription("");
                setNewSubtaskLink("");
              }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
            </div>

            {/* İsim */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>Alt Görev Adı *</label>
              <input
                autoFocus
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                maxLength={25}
                placeholder="Alt görev adı..."
                style={{
                  width: "100%",
                  borderRadius: '10px',
                  background: tokenColors.dark.bg.hover,
                  border: `1px solid ${tokenColors.dark.border.subtle}`,
                  padding: '12px',
                  fontSize: '14px',
                  color: 'var(--text-main)',
                }}
                onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); handleCreateSubtask(activeTaskIdForSubtask); } }}
              />
            </div>

            {/* Açıklama */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>Açıklama</label>
              <textarea
                value={newSubtaskDescription}
                onChange={(e) => setNewSubtaskDescription(e.target.value)}
                placeholder="Alt görev açıklaması..."
                style={{
                  width: "100%",
                  minHeight: "80px",
                  borderRadius: '10px',
                  background: tokenColors.dark.bg.hover,
                  border: `1px solid ${tokenColors.dark.border.subtle}`,
                  padding: '12px',
                  fontSize: '14px',
                  color: 'var(--text-main)',
                  resize: 'vertical',
                }}
              />
            </div>

            {/* Link */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>Bağlantı</label>
              <input
                type="url"
                value={newSubtaskLink}
                onChange={(e) => setNewSubtaskLink(e.target.value)}
                placeholder="https://..."
                style={{
                  width: "100%",
                  borderRadius: '10px',
                  background: tokenColors.dark.bg.hover,
                  border: `1px solid ${tokenColors.dark.border.subtle}`,
                  padding: '12px',
                  fontSize: '14px',
                  color: 'var(--primary)',
                }}
              />
            </div>

            <button
              onClick={() => handleCreateSubtask(activeTaskIdForSubtask)}
              disabled={!newSubtaskTitle.trim()}
              className="btn btn-primary font-semibold"
              style={{
                width: '100%',
                borderRadius: '10px',
                height: '42px',
                opacity: !newSubtaskTitle.trim() ? 0.5 : 1,
                cursor: !newSubtaskTitle.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              Oluştur
            </button>
          </div>
        </div>
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
