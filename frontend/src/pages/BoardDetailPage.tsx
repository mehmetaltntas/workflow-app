import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AxiosError } from "axios";
import { boardService, taskService } from "../services/api";
import type { Board, Task, TaskList } from "../types";

import toast from "react-hot-toast";
import { ArrowLeft, Plus, X, ArrowUp, ArrowDown, CheckSquare, Square, Link as LinkIcon, MessageSquare, ExternalLink } from "lucide-react";
import { ActionMenu } from "../components/ActionMenu";
import { InlineEdit } from "../components/InlineEdit";
import { DeleteConfirmation } from "../components/DeleteConfirmation";
import { TaskEditModal } from "../components/TaskEditModal";

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
  const [showTaskLinkInput, setShowTaskLinkInput] = useState(false);
  const [deleteListId, setDeleteListId] = useState<number | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Sorting
  const [sortBy, setSortBy] = useState<"name" | "date">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

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

  const handleCreateList = async () => {
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
  };

  const handleDeleteList = async () => {
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
  };

  const handleUpdateListName = async (listId: number, newName: string) => {
    try {
      await taskService.updateTaskList(listId, { name: newName });
      loadBoardData(slug!);
      toast.success("Güncellendi");
    } catch (error) {
      console.error(error);
      toast.error("Güncellenemedi");
    }
  };

  const handleListCompletionToggle = async (list: TaskList) => {
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
  };

  const handleCreateTask = async (listId: number) => {
    if (!newTaskTitle) return;
    try {
      await taskService.createTask({
        title: newTaskTitle,
        description: "",
        link: newTaskLink || undefined,
        taskListId: listId,
      });
      setNewTaskTitle("");
      setNewTaskLink("");
      setShowTaskLinkInput(false);
      setActiveListId(null);
      loadBoardData(slug!);
      toast.success("Eklendi");
    } catch (error) {
      console.error(error);
      toast.error("Eklenemedi");
    }
  };

  const handleTaskCompletionToggle = async (task: Task, list: TaskList) => {
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
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      await taskService.deleteTask(taskId);
      loadBoardData(slug!);
      toast.success("Silindi");
    } catch (error) {
      console.error(error);
      toast.error("Silinemedi");
    }
  };

  const handleUpdateTask = async (taskId: number, updates: Partial<Task>) => {
    try {
      await taskService.updateTask(taskId, updates);
      loadBoardData(slug!);
      toast.success("Güncellendi");
    } catch (error) {
      console.error(error);
      toast.error("Hata oluştu");
    }
  };

  if (loading)
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-body)", color: "var(--text-muted)" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
          <h2>Yükleniyor...</h2>
        </div>
      </div>
    );

  if (!board)
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-body)", color: "var(--text-muted)" }}>
        <h2>Pano bulunamadı.</h2>
      </div>
    );

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-body)" }}>
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

      {/* Board Content */}
      <div style={{ flex: 1, overflowX: "auto", padding: "24px", display: "flex", alignItems: "flex-start", gap: "20px" }}>
        {[...board.taskLists].sort((a, b) => {
          if (sortBy === "name") {
            // asc: A to Z, desc: Z to A
            return sortOrder === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
          }
          // Date sorting: use createdAt if available, fallback to id
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : a.id;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : b.id;
          // asc: oldest to newest (small to big), desc: newest to oldest (big to small)
          return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
        }).map((list) => (
          <div
            key={list.id}
            className="flex flex-col group/list"
            style={{
              minWidth: "340px",
              maxWidth: "340px",
              background: list.isCompleted ? "rgba(81, 207, 102, 0.03)" : "rgba(20, 21, 24, 0.6)",
              borderRadius: "20px",
              padding: "14px",
              maxHeight: "calc(100vh - 160px)",
              border: list.isCompleted ? "1px solid rgba(81, 207, 102, 0.1)" : "1px solid rgba(255, 255, 255, 0.05)",
              boxShadow: "0 8px 32px -8px rgba(0,0,0,0.4)",
              transition: "all 0.3s ease",
              position: "relative",
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
                onEdit={() => {
                  const newName = window.prompt("Liste Adı:", list.name);
                  if (newName && newName !== list.name) handleUpdateListName(list.id, newName);
                }}
                onDelete={() => setDeleteListId(list.id)}
              />

              {/* List Name */}
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <InlineEdit
                  text={list.name}
                  onSave={(val) => handleUpdateListName(list.id, val)}
                  fontSize="14px"
                  fontWeight="600"
                />
              </div>

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

            {/* Tasks Container */}
            <div style={{ overflowY: "auto", overflowX: "visible", display: "flex", flexDirection: "column", gap: "10px", minHeight: "180px", padding: "2px", position: "relative" }}>
              {[...list.tasks].sort((a,b) => {
                if (a.createdAt && b.createdAt) return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                return a.position - b.position;
              }).map((task: Task, index: number) => (
                <div
                  key={task.id}
                  className="group/task"
                  style={{
                    background: task.isCompleted ? "rgba(81, 207, 102, 0.03)" : "rgba(255, 255, 255, 0.04)",
                    padding: "12px 14px",
                    borderRadius: "14px",
                    border: task.isCompleted ? "1px solid rgba(81, 207, 102, 0.08)" : "1px solid rgba(255, 255, 255, 0.06)",
                    transition: "all 0.2s ease",
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                  onMouseEnter={(e) => {
                    if (!task.isCompleted) {
                      e.currentTarget.style.background = "rgba(255, 255, 255, 0.07)";
                      e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = task.isCompleted ? "rgba(81, 207, 102, 0.03)" : "rgba(255, 255, 255, 0.04)";
                    e.currentTarget.style.borderColor = task.isCompleted ? "rgba(81, 207, 102, 0.08)" : "rgba(255, 255, 255, 0.06)";
                  }}
                >
                  {/* Action Menu - Left Side */}
                  <ActionMenu 
                    triggerClassName="opacity-0 group-hover/task:opacity-60 hover:!opacity-100"
                    dropdownPosition="left"
                    dropdownDirection={index < 2 ? "down" : "up"}
                    iconSize={14}
                    onEdit={() => setEditingTask(task)}
                    onDelete={() => handleDeleteTask(task.id)}
                  />

                  {/* Task Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ 
                      fontSize: "13px", 
                      fontWeight: "500", 
                      lineHeight: "1.5",
                      textDecoration: task.isCompleted ? "line-through" : "none",
                      color: task.isCompleted ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.9)"
                    }}>
                      {task.title}
                    </div>
                    {task.description && (
                      <div style={{ 
                        marginTop: "4px", 
                        fontSize: "11px",
                        color: "rgba(255,255,255,0.35)",
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <MessageSquare size={10} />
                        <span>Not var</span>
                      </div>
                    )}
                  </div>

                  {/* Link Icon */}
                  {task.link && (
                    <a 
                      href={task.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{ 
                        color: "var(--primary)", 
                        opacity: 0.5,
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
                        e.currentTarget.style.opacity = '0.5';
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <LinkIcon size={14} />
                    </a>
                  )}

                  {/* Task Completion Checkbox - Right Side */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleTaskCompletionToggle(task, list); }}
                    style={{ 
                      background: "none", 
                      border: "none", 
                      cursor: "pointer", 
                      display: 'flex',
                      padding: '4px',
                      borderRadius: '6px',
                      transition: 'all 0.2s',
                      color: task.isCompleted ? 'var(--success)' : 'rgba(255,255,255,0.3)',
                    }}
                    onMouseEnter={(e) => {
                      if (!task.isCompleted) e.currentTarget.style.color = 'var(--success)';
                    }}
                    onMouseLeave={(e) => {
                      if (!task.isCompleted) e.currentTarget.style.color = 'rgba(255,255,255,0.3)';
                    }}
                  >
                    {task.isCompleted ? <CheckSquare size={16} /> : <Square size={16} />}
                  </button>
                </div>
              ))}
            </div>

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
                ) : (
                  <button
                    onClick={() => setShowTaskLinkInput(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 10px',
                      marginBottom: '10px',
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
                    <LinkIcon size={12} /> Link Ekle
                  </button>
                )}

                <div style={{ display: "flex", gap: "8px" }}>
                  <button 
                    onClick={() => handleCreateTask(list.id)} 
                    className="btn btn-primary" 
                    style={{ flex: 1, fontWeight: '600', borderRadius: '10px', height: '36px', fontSize: '12px' }}
                  >
                    Ekle
                  </button>
                  <button 
                    onClick={() => { setActiveListId(null); setShowTaskLinkInput(false); setNewTaskLink(''); }} 
                    className="btn btn-ghost" 
                    style={{ padding: "8px", borderRadius: '10px', height: '36px' }}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setActiveListId(list.id)}
                className="btn btn-ghost group/add"
                style={{ 
                  marginTop: "12px", 
                  width: "100%", 
                  justifyContent: "center", 
                  borderRadius: "12px", 
                  border: "1px dashed rgba(255,255,255,0.08)", 
                  height: "40px", 
                  color: "rgba(255,255,255,0.4)", 
                  fontWeight: '500', 
                  fontSize: '12px',
                  gap: '8px',
                }}
              >
                <Plus size={14} /> Görev Ekle
              </button>
            )}
          </div>
        ))}

        {/* New List Column */}
        <div
          style={{
            minWidth: "340px",
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
    </div>
  );
};
export default BoardDetailPage;
