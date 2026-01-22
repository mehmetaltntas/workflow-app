import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AxiosError } from "axios";
import { boardService, taskService, labelService } from "../services/api";
import type { Board, Task, TaskList, Priority } from "../types";

import toast from "react-hot-toast";
import { ArrowLeft, Plus, X, ArrowUp, ArrowDown, CheckSquare, Square, Link as LinkIcon, ExternalLink, ChevronDown, Calendar, Tag, Flag } from "lucide-react";
import { ActionMenu } from "../components/ActionMenu";
import { DeleteConfirmation } from "../components/DeleteConfirmation";
import { TaskEditModal } from "../components/TaskEditModal";
import { ListEditModal } from "../components/ListEditModal";
import { SortableTask } from "../components/SortableTask";
import { LabelManager } from "../components/LabelManager";
import { FilterBar, getDefaultFilters } from "../components/FilterBar";
import { StatsBar } from "../components/StatsBar";
import type { FilterState } from "../components/FilterBar";

// Drag & Drop
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragOverlay,
} from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

const BoardDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  // Data State
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);

  // UI States
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [newListLink, setNewListLink] = useState("");
  const [showListLinkInput, setShowListLinkInput] = useState(false);
  const [activeListId, setActiveListId] = useState<number | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskLink, setNewTaskLink] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>("NONE");
  const [showTaskLinkInput, setShowTaskLinkInput] = useState(false);
  const [showTaskDueDateInput, setShowTaskDueDateInput] = useState(false);
  const [showTaskPriorityInput, setShowTaskPriorityInput] = useState(false);
  const [deleteListId, setDeleteListId] = useState<number | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingList, setEditingList] = useState<TaskList | null>(null);
  const [showLabelManager, setShowLabelManager] = useState(false);
  const [filters, setFilters] = useState<FilterState>(getDefaultFilters());

  // Sorting
  // Default: Date (oldest to newest), down arrow
  const [sortBy, setSortBy] = useState<"name" | "date">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Drag & Drop State
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // Drag & Drop Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px hareket etmeden drag başlamaz (click ile karışmaması için)
      },
    })
  );

  const loadBoardData = useCallback(
    async (boardSlug: string) => {
      if (!boardSlug || boardSlug === "null" || boardSlug === "undefined") {
        setLoading(false);
        toast.error("Geçersiz pano adresi");
        navigate("/boards");
        return;
      }
      try {
        setLoading(true);
        const response = await boardService.getBoardDetails(boardSlug);
        setBoard(response.data);
      } catch (err) {
        const error = err as AxiosError;
        console.error(error);
        if (error.response && error.response.status === 404) {
          toast.error("Pano bulunamadı");
          setBoard(null);
        } else if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          // Handled by interceptor
        } else {
          toast.error("Pano yüklenirken hata oluştu");
        }
      } finally {
        setLoading(false);
      }
    },
    [navigate],
  );

  useEffect(() => {
    if (slug) loadBoardData(slug);
  }, [slug, loadBoardData]);

  const handleCreateList = useCallback(async () => {
    if (!newListName) return;
    try {
      await taskService.createTaskList({
        name: newListName,
        link: newListLink || undefined,
        boardId: board!.id,
      });
      setNewListName("");
      setNewListLink("");
      setShowListLinkInput(false);
      setIsAddingList(false);
      loadBoardData(slug!);
      toast.success("Liste eklendi");
    } catch (error) {
      console.error(error);
      toast.error("Hata oluştu");
    }
  }, [newListName, newListLink, board, loadBoardData, slug]);

  const handleDeleteList = useCallback(async () => {
    if (deleteListId) {
      try {
        await taskService.deleteTaskList(deleteListId);
        setDeleteListId(null);
        loadBoardData(slug!);
        toast.success("Silindi");
      } catch (error) {
        console.error(error);
        toast.error("Silinemedi");
      }
    }
  }, [deleteListId, loadBoardData, slug]);

  // handleUpdateListName removed - now handled via ListEditModal

  const handleListCompletionToggle = useCallback(async (list: TaskList) => {
    try {
      await taskService.updateTaskList(list.id, { isCompleted: !list.isCompleted });
      loadBoardData(slug!);
      toast.success(list.isCompleted ? "Liste devam ediyor" : "Liste tamamlandı", {
        icon: list.isCompleted ? "⏳" : "✅",
        duration: 2000
      });
    } catch (error) {
      console.error(error);
      toast.error("Hata oluştu");
    }
  }, [loadBoardData, slug]);

  const handleCreateTask = useCallback(async (listId: number) => {
    if (!newTaskTitle) return;
    try {
      await taskService.createTask({
        title: newTaskTitle,
        description: "",
        link: newTaskLink || undefined,
        dueDate: newTaskDueDate || undefined,
        priority: newTaskPriority !== "NONE" ? newTaskPriority : undefined,
        taskListId: listId,
      });
      setNewTaskTitle("");
      setNewTaskLink("");
      setNewTaskDueDate("");
      setNewTaskPriority("NONE");
      setShowTaskLinkInput(false);
      setShowTaskDueDateInput(false);
      setShowTaskPriorityInput(false);
      setActiveListId(null);
      loadBoardData(slug!);
      toast.success("Eklendi");
    } catch (error) {
      console.error(error);
      toast.error("Eklenemedi");
    }
  }, [newTaskTitle, newTaskLink, newTaskDueDate, newTaskPriority, loadBoardData, slug]);

  const handleTaskCompletionToggle = useCallback(async (task: Task, list: TaskList) => {
    try {
      const newIsCompleted = !task.isCompleted;
      await taskService.updateTask(task.id, { isCompleted: newIsCompleted });

      // Check if all tasks in list will be completed
      const allTasksCompleted = list.tasks.every(t =>
        t.id === task.id ? newIsCompleted : t.isCompleted
      );

      // If all tasks are completed, mark list as completed
      if (allTasksCompleted && !list.isCompleted) {
        await taskService.updateTaskList(list.id, { isCompleted: true });
      }
      // If uncompleting a task and list is completed, unmark list
      else if (!newIsCompleted && list.isCompleted) {
        await taskService.updateTaskList(list.id, { isCompleted: false });
      }

      loadBoardData(slug!);
      toast.success(task.isCompleted ? "Devam ediyor" : "Tamamlandı", {
        icon: task.isCompleted ? "⏳" : "✅",
        duration: 2000
      });
    } catch (error) {
      console.error(error);
      toast.error("Hata oluştu");
    }
  }, [loadBoardData, slug]);

  const handleDeleteTask = useCallback(async (taskId: number) => {
    try {
      await taskService.deleteTask(taskId);
      loadBoardData(slug!);
      toast.success("Silindi");
    } catch (error) {
      console.error(error);
      toast.error("Silinemedi");
    }
  }, [loadBoardData, slug]);

  const handleUpdateTask = useCallback(async (taskId: number, updates: Partial<Task> & { labelIds?: number[] }) => {
    try {
      await taskService.updateTask(taskId, updates);
      loadBoardData(slug!);
      toast.success("Güncellendi");
    } catch (error) {
      console.error(error);
      toast.error("Hata oluştu");
    }
  }, [loadBoardData, slug]);

  // Handler for updating list from modal
  const handleUpdateList = useCallback(async (listId: number, updates: { name?: string; link?: string }) => {
    try {
      await taskService.updateTaskList(listId, updates);
      loadBoardData(slug!);
      toast.success("Liste güncellendi");
    } catch (error) {
      console.error(error);
      toast.error("Güncellenemedi");
    }
  }, [loadBoardData, slug]);

  // Handler for bulk deleting tasks from modal
  const handleBulkDeleteTasks = useCallback(async (taskIds: number[]) => {
    try {
      for (const taskId of taskIds) {
        await taskService.deleteTask(taskId);
      }
      loadBoardData(slug!);
      toast.success(`${taskIds.length} görev silindi`);
    } catch (error) {
      console.error(error);
      toast.error("Silme işlemi başarısız");
    }
  }, [loadBoardData, slug]);

  // Label handlers
  const handleCreateLabel = useCallback(async (data: { name: string; color: string; boardId: number }) => {
    try {
      await labelService.createLabel(data);
      loadBoardData(slug!);
      toast.success("Etiket oluşturuldu");
    } catch (error) {
      console.error(error);
      toast.error("Etiket oluşturulamadı");
    }
  }, [loadBoardData, slug]);

  const handleUpdateLabel = useCallback(async (labelId: number, data: { name?: string; color?: string }) => {
    try {
      await labelService.updateLabel(labelId, data);
      loadBoardData(slug!);
      toast.success("Etiket güncellendi");
    } catch (error) {
      console.error(error);
      toast.error("Etiket güncellenemedi");
    }
  }, [loadBoardData, slug]);

  const handleDeleteLabel = useCallback(async (labelId: number) => {
    try {
      await labelService.deleteLabel(labelId);
      loadBoardData(slug!);
      toast.success("Etiket silindi");
    } catch (error) {
      console.error(error);
      toast.error("Etiket silinemedi");
    }
  }, [loadBoardData, slug]);

  // ==================== DRAG & DROP HANDLERS ====================

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const taskId = active.id as number;

    // Sürüklenen task'ı bul
    for (const list of board?.taskLists || []) {
      const task = list.tasks.find(t => t.id === taskId);
      if (task) {
        setActiveTask(task);
        break;
      }
    }
  }, [board?.taskLists]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over || !board) return;

    const activeId = active.id as number;
    const overId = over.id;

    // Task ve hedef listeyi bul
    let sourceList: TaskList | undefined;
    let destList: TaskList | undefined;
    let activeTaskObj: Task | undefined;

    for (const list of board.taskLists) {
      const task = list.tasks.find(t => t.id === activeId);
      if (task) {
        sourceList = list;
        activeTaskObj = task;
      }
      if (list.tasks.some(t => t.id === overId) || list.id === overId) {
        destList = list;
      }
    }

    if (!sourceList || !destList || !activeTaskObj) return;

    // Yeni pozisyonu hesapla
    const destTasks = destList.tasks.filter(t => t.id !== activeId);
    const overIndex = destTasks.findIndex(t => t.id === overId);
    const newPosition = overIndex >= 0 ? overIndex : destTasks.length;

    // Aynı liste içinde aynı pozisyondaysa bir şey yapma
    if (sourceList.id === destList.id) {
      const oldIndex = sourceList.tasks.findIndex(t => t.id === activeId);
      if (oldIndex === newPosition) return;
    }

    try {
      await taskService.reorderTask(activeId, {
        targetListId: destList.id,
        newPosition: newPosition,
      });

      // Başarılı olursa veriyi yeniden yükle
      loadBoardData(slug!);
    } catch (error) {
      console.error("Drag & drop hatası:", error);
      toast.error("Taşıma başarısız");
      loadBoardData(slug!);
    }
  }, [board, loadBoardData, slug]);

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

    // Due date filter
    if (filters.dueDateFilter !== "all") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (filters.dueDateFilter === "nodate") {
        if (task.dueDate) return false;
      } else {
        if (!task.dueDate) return false;

        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        switch (filters.dueDateFilter) {
          case "overdue":
            if (diffDays >= 0) return false;
            break;
          case "today":
            if (diffDays !== 0) return false;
            break;
          case "tomorrow":
            if (diffDays !== 1) return false;
            break;
          case "week":
            if (diffDays < 0 || diffDays > 7) return false;
            break;
        }
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
          boardLabels={board.labels}
          onClose={() => setEditingTask(null)}
          onSave={handleUpdateTask}
        />
      )}

      {editingList && (
        <ListEditModal
          list={editingList}
          onClose={() => setEditingList(null)}
          onSave={handleUpdateList}
          onDeleteTasks={handleBulkDeleteTasks}
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

      {/* Modern Header */}
      <div style={{ padding: "16px 24px", background: "rgba(13, 14, 16, 0.8)", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center", backdropFilter: "blur(20px)", zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <button onClick={() => navigate("/boards")} className="btn btn-ghost hover:bg-white/5" style={{ padding: "8px 12px", display: "flex", alignItems: "center", gap: "8px", borderRadius: '12px', color: 'var(--text-muted)' }}>
            <ArrowLeft size={16} />
            <span style={{ fontWeight: '600', fontSize: '14px' }}>Panolar</span>
          </button>
          <div style={{ height: "24px", width: "1px", background: "rgba(255,255,255,0.1)" }}></div>
          <h2 style={{ margin: 0, fontSize: "18px", fontVariantNumeric: 'tabular-nums', fontWeight: "700", color: "white", letterSpacing: "-0.03em" }}>
            {board.name}
          </h2>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          {/* Labels Button */}
          <button
            onClick={() => setShowLabelManager(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              background: 'rgba(0, 0, 0, 0.4)',
              color: 'rgba(255,255,255,0.6)',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
              backdropFilter: 'blur(10px)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(77, 171, 247, 0.3)';
              e.currentTarget.style.color = 'var(--primary)';
              e.currentTarget.style.background = 'rgba(77, 171, 247, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.4)';
            }}
          >
            <Tag size={14} />
            Etiketler
            {board.labels && board.labels.length > 0 && (
              <span style={{
                background: 'var(--primary)',
                color: 'white',
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
            background: 'rgba(0, 0, 0, 0.4)',
            padding: '4px',
            borderRadius: '14px',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
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
                  background: sortBy === "name" ? 'rgba(77, 171, 247, 0.15)' : 'transparent',
                  color: sortBy === "name" ? 'var(--primary)' : 'rgba(255,255,255,0.4)',
                  boxShadow: sortBy === "name" ? '0 2px 8px rgba(77, 171, 247, 0.2)' : 'none',
                }}
                onMouseEnter={(e) => {
                  if (sortBy !== "name") {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                    e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (sortBy !== "name") {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'rgba(255,255,255,0.4)';
                  }
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
                  background: sortBy === "date" ? 'rgba(77, 171, 247, 0.15)' : 'transparent',
                  color: sortBy === "date" ? 'var(--primary)' : 'rgba(255,255,255,0.4)',
                  boxShadow: sortBy === "date" ? '0 2px 8px rgba(77, 171, 247, 0.2)' : 'none',
                }}
                onMouseEnter={(e) => {
                  if (sortBy !== "date") {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                    e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (sortBy !== "date") {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'rgba(255,255,255,0.4)';
                  }
                }}
              >
                Tarih
              </button>
            </div>

            {/* Divider */}
            <div style={{ 
              width: '1px', 
              height: '20px', 
              background: 'rgba(255,255,255,0.08)', 
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
                background: 'rgba(255,255,255,0.05)',
                color: 'var(--primary)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(77, 171, 247, 0.15)';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                e.currentTarget.style.transform = 'scale(1)';
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
      <StatsBar board={board} />

      {/* Filter Bar */}
      <FilterBar
        labels={board.labels || []}
        filters={filters}
        onFilterChange={setFilters}
      />

      {/* Board Content - Grid Layout (max 4 columns) */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
      <div className="board-grid" style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
        {sortedTaskLists.map((list) => (
          <div
            key={list.id}
            className="flex flex-col group/list"
            style={{
              flex: 1,
              minWidth: 0,
              background: list.isCompleted ? "rgba(81, 207, 102, 0.03)" : "rgba(20, 21, 24, 0.6)",
              borderRadius: "20px",
              padding: "14px",
              maxHeight: "calc(100vh - 160px)",
              border: list.isCompleted ? "1px solid rgba(81, 207, 102, 0.1)" : "1px solid rgba(255, 255, 255, 0.05)",
              boxShadow: "0 8px 32px -8px rgba(0,0,0,0.4)",
              transition: "all 0.3s ease",
              position: "relative",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* List Header */}
            <div 
              className="group/header"
              style={{ 
                display: "flex", 
                alignItems: "center",
                gap: "10px",
                marginBottom: "14px", 
                background: "rgba(0, 0, 0, 0.25)",
                padding: "12px 14px",
                borderRadius: "14px",
                border: "1px solid rgba(255, 255, 255, 0.03)"
              }}
            >
              {/* Action Menu */}
              <ActionMenu 
                triggerClassName="opacity-60 group-hover/header:opacity-100"
                dropdownPosition="left"
                onEdit={() => setEditingList(list)}
                onDelete={() => setDeleteListId(list.id)}
              />

              {/* List Name - Double-click disabled, edit only via menu */}
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    padding: '4px 10px',
                    borderRadius: '10px',
                    display: 'inline-block',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '100%',
                    color: 'var(--text-main)',
                  }}
                >
                  {list.name}
                </span>
              </div>

              {/* Add Task Button - In Header */}
              <button
                onClick={() => setActiveListId(list.id)}
                className="list-header-add-btn"
                title="Görev Ekle"
              >
                <Plus size={16} />
              </button>

              {/* Link Icon */}
              {list.link && (
                <a 
                  href={list.link} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  onClick={(e) => e.stopPropagation()}
                  style={{ 
                    color: "var(--primary)", 
                    opacity: 0.6,
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px',
                    borderRadius: '6px',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '1';
                    e.currentTarget.style.background = 'rgba(77, 171, 247, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '0.6';
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <ExternalLink size={14} />
                </a>
              )}

              {/* List Completion Checkbox */}
              <button 
                onClick={(e) => { e.stopPropagation(); handleListCompletionToggle(list); }}
                style={{ 
                  background: "none", 
                  border: "none", 
                  cursor: "pointer", 
                  display: 'flex',
                  padding: '4px',
                  borderRadius: '6px',
                  transition: 'all 0.2s',
                  color: list.isCompleted ? 'var(--success)' : 'rgba(255,255,255,0.3)',
                }}
                onMouseEnter={(e) => {
                  if (!list.isCompleted) e.currentTarget.style.color = 'var(--success)';
                }}
                onMouseLeave={(e) => {
                  if (!list.isCompleted) e.currentTarget.style.color = 'rgba(255,255,255,0.3)';
                }}
              >
                {list.isCompleted ? <CheckSquare size={18} /> : <Square size={18} />}
              </button>
            </div>

            {/* Tasks Container - Fixed height with scroll */}
            <SortableContext
              items={list.tasks.map(t => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <div
                className="list-tasks-container"
                style={{ position: "relative" }}
                onScroll={(e) => {
                  const target = e.currentTarget;
                  const indicator = target.querySelector('.list-scroll-indicator');
                  if (indicator) {
                    const isAtBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 10;
                    if (isAtBottom) {
                      indicator.classList.add('at-bottom');
                    } else {
                      indicator.classList.remove('at-bottom');
                    }
                  }
                }}
              >
                {/* Tasks already sorted by position in useMemo */}
                {list.tasks.map((task: Task, index: number) => (
                  <SortableTask
                    key={task.id}
                    task={task}
                    list={list}
                    index={index}
                    onEdit={setEditingTask}
                    onDelete={handleDeleteTask}
                    onToggleComplete={handleTaskCompletionToggle}
                  />
                ))}
                {/* Scroll indicator at the end */}
                {list.tasks.length > 3 && (
                  <div className="list-scroll-indicator">
                    <ChevronDown size={18} />
                  </div>
                )}
              </div>
            </SortableContext>

            {/* Add Task UI */}
            {activeListId === list.id ? (
              <div style={{ marginTop: "12px", padding: "14px", borderRadius: "14px", background: "rgba(0,0,0,0.25)", border: '1px solid rgba(255,255,255,0.05)' }}>
                <textarea
                  autoFocus
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Yeni görev başlığı..."
                  style={{ 
                    width: "100%", 
                    minHeight: "40px", 
                    marginBottom: "10px", 
                    background: "transparent", 
                    border: "none", 
                    padding: 0, 
                    fontSize: "13px", 
                    color: 'white', 
                    resize: 'none', 
                    outline: 'none', 
                    fontWeight: '500' 
                  }}
                  onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleCreateTask(list.id); } }}
                />
                
                {/* Link Input Toggle */}
                {showTaskLinkInput ? (
                  <div style={{ marginBottom: '10px' }}>
                    <input
                      value={newTaskLink}
                      onChange={(e) => setNewTaskLink(e.target.value)}
                      placeholder="https://..."
                      style={{ 
                        width: "100%", 
                        padding: '10px 12px',
                        borderRadius: '10px', 
                        background: 'rgba(255,255,255,0.03)', 
                        border: '1px solid rgba(255,255,255,0.08)',
                        fontSize: '12px',
                        color: 'white',
                      }}
                    />
                  </div>
                ) : null}

                {/* Due Date Input Toggle */}
                {showTaskDueDateInput ? (
                  <div style={{ marginBottom: '10px' }}>
                    <input
                      type="date"
                      value={newTaskDueDate}
                      onChange={(e) => setNewTaskDueDate(e.target.value)}
                      style={{
                        width: "100%",
                        padding: '10px 12px',
                        borderRadius: '10px',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        fontSize: '12px',
                        color: 'white',
                        colorScheme: 'dark'
                      }}
                    />
                  </div>
                ) : null}

                {/* Priority Input */}
                {showTaskPriorityInput ? (
                  <div style={{ marginBottom: '10px', display: 'flex', gap: '4px' }}>
                    {(['NONE', 'LOW', 'MEDIUM', 'HIGH'] as Priority[]).map(p => {
                      const colors: Record<Priority, string> = {
                        NONE: 'rgba(255,255,255,0.4)',
                        LOW: '#22c55e',
                        MEDIUM: '#f59e0b',
                        HIGH: '#ef4444'
                      };
                      const labels: Record<Priority, string> = {
                        NONE: 'Yok',
                        LOW: 'Düşük',
                        MEDIUM: 'Orta',
                        HIGH: 'Yüksek'
                      };
                      return (
                        <button
                          key={p}
                          onClick={() => setNewTaskPriority(p)}
                          style={{
                            flex: 1,
                            padding: '6px 8px',
                            borderRadius: '8px',
                            border: newTaskPriority === p
                              ? `1px solid ${colors[p]}`
                              : '1px solid rgba(255,255,255,0.08)',
                            background: newTaskPriority === p
                              ? `${colors[p]}20`
                              : 'rgba(255,255,255,0.03)',
                            color: newTaskPriority === p ? colors[p] : 'rgba(255,255,255,0.5)',
                            fontSize: '10px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '3px'
                          }}
                        >
                          {p !== 'NONE' && <Flag size={9} />}
                          {labels[p]}
                        </button>
                      );
                    })}
                  </div>
                ) : null}

                {/* Quick action buttons */}
                <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                  {!showTaskLinkInput && (
                    <button
                      onClick={() => setShowTaskLinkInput(true)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '6px 10px',
                        background: 'transparent',
                        border: '1px dashed rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        color: 'rgba(255,255,255,0.4)',
                        fontSize: '11px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(77, 171, 247, 0.3)';
                        e.currentTarget.style.color = 'var(--primary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                        e.currentTarget.style.color = 'rgba(255,255,255,0.4)';
                      }}
                    >
                      <LinkIcon size={11} /> Link
                    </button>
                  )}
                  {!showTaskDueDateInput && (
                    <button
                      onClick={() => setShowTaskDueDateInput(true)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '6px 10px',
                        background: 'transparent',
                        border: '1px dashed rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        color: 'rgba(255,255,255,0.4)',
                        fontSize: '11px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.3)';
                        e.currentTarget.style.color = '#f59e0b';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                        e.currentTarget.style.color = 'rgba(255,255,255,0.4)';
                      }}
                    >
                      <Calendar size={11} /> Tarih
                    </button>
                  )}
                  {!showTaskPriorityInput && (
                    <button
                      onClick={() => setShowTaskPriorityInput(true)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '6px 10px',
                        background: 'transparent',
                        border: '1px dashed rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        color: 'rgba(255,255,255,0.4)',
                        fontSize: '11px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                        e.currentTarget.style.color = '#ef4444';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                        e.currentTarget.style.color = 'rgba(255,255,255,0.4)';
                      }}
                    >
                      <Flag size={11} /> Öncelik
                    </button>
                  )}
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  <button 
                    onClick={() => handleCreateTask(list.id)} 
                    className="btn btn-primary" 
                    style={{ flex: 1, fontWeight: '600', borderRadius: '10px', height: '36px', fontSize: '12px' }}
                  >
                    Ekle
                  </button>
                  <button
                    onClick={() => {
                      setActiveListId(null);
                      setShowTaskLinkInput(false);
                      setShowTaskDueDateInput(false);
                      setShowTaskPriorityInput(false);
                      setNewTaskLink('');
                      setNewTaskDueDate('');
                      setNewTaskPriority('NONE');
                    }}
                    className="btn btn-ghost"
                    style={{ padding: "8px", borderRadius: '10px', height: '36px' }}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ))}

        {/* New List Column */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            background: "rgba(255,255,255,0.02)",
            borderRadius: "20px",
            padding: "14px",
            border: "1px dashed rgba(255,255,255,0.08)",
            transition: "all 0.3s ease",
          }}
        >
          {isAddingList ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div className="flex justify-between items-center">
                <span style={{ fontSize: "11px", fontWeight: "700", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: '0.08em' }}>Yeni Liste</span>
                <button onClick={() => { setIsAddingList(false); setShowListLinkInput(false); setNewListLink(''); }} className="text-gray-600 hover:text-white"><X size={16} /></button>
              </div>
              <input
                autoFocus
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="Liste adı..."
                style={{ 
                  width: "100%", 
                  borderRadius: '10px', 
                  background: 'rgba(255,255,255,0.04)', 
                  border: '1px solid rgba(255,255,255,0.06)', 
                  padding: '12px',
                  fontSize: '13px',
                }}
                onKeyDown={(e) => { if(e.key === 'Enter') handleCreateList(); }}
              />
              
              {/* Link Input Toggle */}
              {showListLinkInput ? (
                <input
                  value={newListLink}
                  onChange={(e) => setNewListLink(e.target.value)}
                  placeholder="https://..."
                  style={{ 
                    width: "100%", 
                    borderRadius: '10px', 
                    background: 'rgba(255,255,255,0.04)', 
                    border: '1px solid rgba(255,255,255,0.06)', 
                    padding: '12px',
                    fontSize: '13px',
                  }}
                />
              ) : (
                <button
                  onClick={() => setShowListLinkInput(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 12px',
                    background: 'transparent',
                    border: '1px dashed rgba(255,255,255,0.1)',
                    borderRadius: '10px',
                    color: 'rgba(255,255,255,0.4)',
                    fontSize: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(77, 171, 247, 0.3)';
                    e.currentTarget.style.color = 'var(--primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                    e.currentTarget.style.color = 'rgba(255,255,255,0.4)';
                  }}
                >
                  <LinkIcon size={14} /> Link Ekle
                </button>
              )}
              
              <button onClick={handleCreateList} className="btn btn-primary font-semibold" style={{ width: '100%', borderRadius: '10px', height: '42px' }}>Oluştur</button>
            </div>
          ) : (
            <button
              onClick={() => setIsAddingList(true)}
              className="btn btn-ghost hover:bg-white/5"
              style={{ width: "100%", justifyContent: "center", height: "48px", gap: "10px", color: "rgba(255,255,255,0.4)", fontWeight: "600", borderRadius: '12px', fontSize: '13px' }}
            >
              <Plus size={18} /> Yeni Liste
            </button>
          )}
        </div>
      </div>

      {/* Drag Overlay - Sürükleme sırasında görünen önizleme */}
      <DragOverlay>
        {activeTask ? (
          <div
            style={{
              background: "rgba(77, 171, 247, 0.2)",
              padding: "12px 14px",
              borderRadius: "14px",
              border: "1px solid rgba(77, 171, 247, 0.4)",
              boxShadow: "0 8px 32px rgba(77, 171, 247, 0.3)",
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              minWidth: '200px',
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: "13px",
                fontWeight: "500",
                color: "white"
              }}>
                {activeTask.title}
              </div>
            </div>
          </div>
        ) : null}
      </DragOverlay>
      </DndContext>
    </div>
  );
};
export default BoardDetailPage;
