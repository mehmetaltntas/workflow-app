import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AxiosError } from "axios";
import { boardService, taskService } from "../services/api";
import type { Board, Task } from "../types";

import toast from "react-hot-toast";
import { ArrowLeft, Plus, X, ArrowUp, ArrowDown, CheckSquare, Square, Link as LinkIcon, MessageSquare, ExternalLink } from "lucide-react";
import { ActionMenu } from "../components/ActionMenu";
import { InlineEdit } from "../components/InlineEdit";
import { ConfirmationModal } from "../components/ConfirmationModal";
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
  const [activeListId, setActiveListId] = useState<number | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskLink, setNewTaskLink] = useState("");
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
        link: newListLink,
        boardId: board!.id,
      });
      setNewListName("");
      setNewListLink("");
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
      await taskService.updateTaskList(listId, newName);
      loadBoardData(slug!);
      toast.success("Güncellendi");
    } catch (error) {
      console.error(error);
      toast.error("Güncellenemedi");
    }
  };

  const handleCreateTask = async (listId: number) => {
    if (!newTaskTitle) return;
    try {
      await taskService.createTask({
        title: newTaskTitle,
        description: "",
        link: newTaskLink,
        taskListId: listId,
      });
      setNewTaskTitle("");
      setNewTaskLink("");
      setActiveListId(null);
      loadBoardData(slug!);
      toast.success("Eklendi");
    } catch (error) {
      console.error(error);
      toast.error("Eklenemedi");
    }
  };

  const handleTaskCompletionToggle = async (task: Task) => {
    try {
      await taskService.updateTask(task.id, {
        isCompleted: !task.isCompleted
      });
      loadBoardData(slug!);
      toast.success(task.isCompleted ? "Devam ediyor" : "Tamamlandı", {
        icon: task.isCompleted ? "⏳" : "✅",
        duration: 2000
      });
    } catch (error) {
      console.error(error);
      toast.error("Hata oluştu");
    }
  }

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
      <ConfirmationModal
        isOpen={!!deleteListId}
        title="Listeyi Sil?"
        message="Bu listeyi ve içindeki TÜM görevleri silmek istiyor musun? Bu işlem geri alınamaz."
        onConfirm={handleDeleteList}
        onCancel={() => setDeleteListId(null)}
        confirmText="Listeyi Sil"
        variant="danger"
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
          <div style={{ display: 'flex', background: 'rgba(0, 0, 0, 0.3)', padding: '4px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.03)' }}>
            <button 
              onClick={() => { setSortBy("name"); setSortOrder(sortBy === "name" && sortOrder === "asc" ? "desc" : "asc"); }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${sortBy === "name" ? 'bg-primary/20 text-primary shadow-lg' : 'text-gray-500 hover:text-gray-400'}`}
            >
              ALFABETİK {sortBy === "name" && (sortOrder === "asc" ? <ArrowDown size={12} /> : <ArrowUp size={12} />)}
            </button>
          </div>
        </div>

      </div>

      {/* Board Content */}
      <div style={{ flex: 1, overflowX: "auto", padding: "32px", display: "flex", alignItems: "flex-start", gap: "24px" }}>
        {[...board.taskLists].sort((a, b) => {
          if (sortBy === "name") return sortOrder === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
          return sortOrder === "asc" ? a.id - b.id : b.id - a.id;
        }).map((list) => (
          <div
            key={list.id}
            className="flex flex-col group/list"
            style={{
              minWidth: "320px",
              maxWidth: "320px",
              background: "rgba(18, 18, 20, 0.4)",
              borderRadius: "24px",
              padding: "12px",
              maxHeight: "100%",
              border: "1px solid rgba(255, 255, 255, 0.04)",
              boxShadow: "0 10px 30px -10px rgba(0,0,0,0.5)"
            }}
          >
            {/* List Header Bar */}
            <div 
              className="group/header"
              style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              marginBottom: "12px", 
              alignItems: "center",
              background: "rgba(0, 0, 0, 0.2)",
              padding: "10px 14px",
              borderRadius: "16px",
              border: "1px solid rgba(255, 255, 255, 0.02)"
            }}>
              <div style={{ marginRight: "12px" }}>
                <ActionMenu 
                  triggerClassName="group-hover/header:opacity-100"
                  onEdit={() => {
                     const newName = window.prompt("Liste Adı:", list.name);
                     if (newName && newName !== list.name) handleUpdateListName(list.id, newName);
                  }}
                  onDelete={() => setDeleteListId(list.id)}
                />
              </div>

              <div style={{ fontWeight: "700", color: "white", flex: 1, display: "flex", alignItems: "center", gap: "8px", overflow: 'hidden' }}>
                <InlineEdit
                  text={list.name}
                  onSave={(val) => handleUpdateListName(list.id, val)}
                  fontSize="14px"
                  fontWeight="700"
                />
                {list.link && (
                  <a href={list.link} target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary)", opacity: 0.4 }} className="hover:opacity-100 transition-opacity">
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </div>



            {/* Tasks Container */}
            <div style={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px", minHeight: "20px", padding: "4px" }}>
              {[...list.tasks].sort((a,b) => {
                if (a.createdAt && b.createdAt) return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                return a.position - b.position;
              }).map((task: Task) => (
                <div
                  key={task.id}
                  className="task-card group/task relative"
                  style={{
                    background: task.isCompleted ? "rgba(255, 255, 255, 0.01)" : "rgba(255, 255, 255, 0.03)",
                    padding: "16px",
                    borderRadius: "18px",
                    border: task.isCompleted ? "1px solid rgba(81, 207, 102, 0.05)" : "1px solid rgba(255, 255, 255, 0.05)",
                    transition: "all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)",
                    cursor: 'pointer',
                    overflow: 'visible'
                  }}
                  onClick={() => setEditingTask(task)}
                  onMouseEnter={(e) => {
                    if (!task.isCompleted) {
                      e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.06)";
                      e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.12)";
                      e.currentTarget.style.transform = "translateX(4px)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = task.isCompleted ? "rgba(255, 255, 255, 0.01)" : "rgba(255, 255, 255, 0.03)";
                    e.currentTarget.style.borderColor = task.isCompleted ? "rgba(81, 207, 102, 0.05)" : "rgba(255, 255, 255, 0.05)";
                    e.currentTarget.style.transform = "translateX(0)";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "start", gap: "10px", paddingLeft: "32px", position: "relative" }}>
                    
                    {/* Action Menu - Left */}
                    <div className="absolute left-0 top-0 z-20">
                      <ActionMenu
                        triggerClassName="group-hover/task:opacity-100"
                        onEdit={() => setEditingTask(task)}
                        onDelete={() => handleDeleteTask(task.id)}
                        onComplete={() => handleTaskCompletionToggle(task)}
                      />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ 
                        fontSize: "14px", 
                        fontWeight: "500", 
                        lineHeight: "1.5",
                        textDecoration: task.isCompleted ? "line-through" : "none",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        color: task.isCompleted ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.9)"
                      }}>
                        {task.title}
                      </div>
                      {(task.link || task.description) && (
                        <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "10px", opacity: 0.3 }}>
                          {task.description && <MessageSquare size={12} />}
                          {task.link && <LinkIcon size={12} />}
                        </div>
                      )}
                    </div>

                    {/* Checkbox - Right */}
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleTaskCompletionToggle(task); }}
                      className={`mt-0.5 transition-all duration-300 ${task.isCompleted ? 'text-emerald-500' : 'text-gray-600 hover:text-emerald-400'}`}
                      style={{ background: "none", border: "none", cursor: "pointer", display: 'flex', marginLeft: "auto" }}
                    >
                      {task.isCompleted ? <CheckSquare size={18} /> : <Square size={18} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Task UI */}
            {activeListId === list.id ? (
              <div style={{ marginTop: "12px", padding: "16px", borderRadius: "18px", background: "rgba(0,0,0,0.2)", border: '1px solid rgba(255,255,255,0.05)' }}>
                <textarea
                  autoFocus
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Yeni görev..."
                  style={{ width: "100%", minHeight: "40px", marginBottom: "12px", background: "transparent", border: "none", padding: 0, fontSize: "14px", color: 'white', resize: 'none', outline: 'none', fontWeight: '500' }}
                  onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleCreateTask(list.id); } }}
                />
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => handleCreateTask(list.id)} className="btn btn-primary" style={{ flex: 1, fontWeight: '700', borderRadius: '12px', height: '36px', fontSize: '12px' }}>Ekle</button>
                  <button onClick={() => setActiveListId(null)} className="btn btn-ghost" style={{ padding: "8px", borderRadius: '12px', height: '36px' }}><X size={18} /></button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setActiveListId(list.id)}
                className="btn btn-ghost group/add"
                style={{ marginTop: "12px", width: "100%", justifyContent: "center", borderRadius: "16px", border: "1px dashed rgba(255,255,255,0.1)", height: "44px", color: "var(--text-muted)", fontWeight: '600', fontSize: '13px' }}
              >
                <Plus size={16} className="group-hover/add:scale-110 transition-transform" /> Görev Ekle
              </button>
            )}
          </div>
        ))}

        {/* New List Column */}
        <div
          style={{
            minWidth: "320px",
            background: "rgba(255,255,255,0.02)",
            borderRadius: "24px",
            padding: "16px",
            border: "1px dashed rgba(255,255,255,0.1)",
            transition: "all 0.3s ease",
          }}
        >
          {isAddingList ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="flex justify-between items-center">
                <span style={{ fontSize: "11px", fontWeight: "800", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: '0.1em' }}>Yeni Liste</span>
                <button onClick={() => setIsAddingList(false)} className="text-gray-600 hover:text-white"><X size={16} /></button>
              </div>
              <input
                autoFocus
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="Liste adı..."
                style={{ width: "100%", borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '12px' }}
                onKeyDown={(e) => { if(e.key === 'Enter') handleCreateList(); }}
              />
              <button onClick={handleCreateList} className="btn btn-primary font-bold" style={{ width: '100%', borderRadius: '12px', height: '44px' }}>Oluştur</button>
            </div>
          ) : (
            <button
              onClick={() => setIsAddingList(true)}
              className="btn btn-ghost hover:bg-white/5"
              style={{ width: "100%", justifyContent: "center", height: "52px", gap: "12px", color: "rgba(255,255,255,0.4)", fontWeight: "700", borderRadius: '16px' }}
            >
              <Plus size={20} /> Yeni Liste
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
export default BoardDetailPage;


