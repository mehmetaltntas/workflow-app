import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronRight,
  Settings,
  Tag,
  LayoutGrid,
  Loader2,
  Home,
} from 'lucide-react';
import { boardService, subtaskService } from '../services/api';
import { MillerColumn, type MillerColumnItem } from '../components/MillerColumn';
import { MillerPreviewPanel } from '../components/MillerPreviewPanel';
import type { Board, TaskList, Task, Subtask } from '../types';
import toast from 'react-hot-toast';

// Navigation State Type
interface NavigationState {
  selectedListId: number | null;
  selectedTaskId: number | null;
}

// Cache Types
interface DataCache {
  subtasks: Map<number, Subtask[]>;
}

const BoardMillerView: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Board Data
  const [board, setBoard] = useState<Board | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSubtasks, setIsLoadingSubtasks] = useState(false);

  // Navigation State - URL'den oku
  const [navState, setNavState] = useState<NavigationState>({
    selectedListId: null,
    selectedTaskId: null,
  });

  // Hover State (Önizleme için)
  const [hoveredList, setHoveredList] = useState<TaskList | null>(null);
  const [hoveredTask, setHoveredTask] = useState<Task | null>(null);

  // Data Cache
  const [cache, setCache] = useState<DataCache>({
    subtasks: new Map(),
  });

  // URL'den state'i sync et
  useEffect(() => {
    const listId = searchParams.get('list');
    const taskId = searchParams.get('task');

    setNavState({
      selectedListId: listId ? parseInt(listId) : null,
      selectedTaskId: taskId ? parseInt(taskId) : null,
    });
  }, [searchParams]);

  // Board verisini yükle
  const loadBoardData = useCallback(async () => {
    if (!slug) return;

    try {
      setIsLoading(true);
      const response = await boardService.getBoardDetails(slug);
      setBoard(response.data);
    } catch (error) {
      console.error('Board yüklenemedi:', error);
      toast.error('Pano yüklenirken bir hata oluştu');
      navigate('/boards');
    } finally {
      setIsLoading(false);
    }
  }, [slug, navigate]);

  useEffect(() => {
    loadBoardData();
  }, [loadBoardData]);

  // Subtasks'ı lazy load et
  const loadSubtasks = useCallback(async (taskId: number) => {
    if (cache.subtasks.has(taskId)) return;

    try {
      setIsLoadingSubtasks(true);
      const response = await subtaskService.getSubtasksByTask(taskId);
      setCache(prev => ({
        ...prev,
        subtasks: new Map(prev.subtasks).set(taskId, response.data),
      }));
    } catch (error) {
      console.error('Alt görevler yüklenemedi:', error);
    } finally {
      setIsLoadingSubtasks(false);
    }
  }, [cache.subtasks]);

  // Liste seçimi
  const handleListSelect = useCallback((item: MillerColumnItem) => {
    const newParams = new URLSearchParams();
    newParams.set('list', item.id.toString());
    setSearchParams(newParams);
    setHoveredTask(null);
  }, [setSearchParams]);

  // Task seçimi
  const handleTaskSelect = useCallback((item: MillerColumnItem) => {
    const currentListId = navState.selectedListId;
    if (!currentListId) return;

    const newParams = new URLSearchParams();
    newParams.set('list', currentListId.toString());
    newParams.set('task', item.id.toString());
    setSearchParams(newParams);

    // Subtasks'ı yükle
    loadSubtasks(item.id);
  }, [navState.selectedListId, setSearchParams, loadSubtasks]);

  // Hover handlers
  const handleListHover = useCallback((item: MillerColumnItem | null) => {
    if (item) {
      const list = board?.taskLists.find(l => l.id === item.id);
      setHoveredList(list || null);
    } else {
      setHoveredList(null);
    }
  }, [board]);

  const handleTaskHover = useCallback((item: MillerColumnItem | null) => {
    if (item && navState.selectedListId) {
      const list = board?.taskLists.find(l => l.id === navState.selectedListId);
      const task = list?.tasks.find(t => t.id === item.id);
      setHoveredTask(task || null);
    } else {
      setHoveredTask(null);
    }
  }, [board, navState.selectedListId]);

  // Breadcrumb navigation
  const handleBreadcrumbClick = useCallback((level: 'board' | 'list' | 'task') => {
    switch (level) {
      case 'board':
        setSearchParams(new URLSearchParams());
        break;
      case 'list':
        if (navState.selectedListId) {
          const newParams = new URLSearchParams();
          newParams.set('list', navState.selectedListId.toString());
          setSearchParams(newParams);
        }
        break;
      default:
        break;
    }
  }, [navState.selectedListId, setSearchParams]);

  // Memoized data transformations
  const listItems: MillerColumnItem[] = useMemo(() => {
    if (!board) return [];

    return board.taskLists.map(list => ({
      id: list.id,
      title: list.name,
      icon: 'folder' as const,
      isCompleted: list.isCompleted,
      hasChildren: true,
      metadata: {
        count: list.tasks.length,
      },
    }));
  }, [board]);

  const selectedList = useMemo(() => {
    if (!board || !navState.selectedListId) return null;
    return board.taskLists.find(l => l.id === navState.selectedListId) || null;
  }, [board, navState.selectedListId]);

  const taskItems: MillerColumnItem[] = useMemo(() => {
    if (!selectedList) return [];

    return selectedList.tasks
      .sort((a, b) => a.position - b.position)
      .map(task => ({
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
    if (!selectedList || !navState.selectedTaskId) return null;
    return selectedList.tasks.find(t => t.id === navState.selectedTaskId) || null;
  }, [selectedList, navState.selectedTaskId]);

  const subtaskItems: MillerColumnItem[] = useMemo(() => {
    if (!selectedTask) return [];

    const subtasks = cache.subtasks.get(selectedTask.id) || selectedTask.subtasks || [];
    return subtasks
      .sort((a, b) => a.position - b.position)
      .map(subtask => ({
        id: subtask.id,
        title: subtask.title,
        icon: 'task' as const,
        isCompleted: subtask.isCompleted,
        hasChildren: false,
      }));
  }, [selectedTask, cache.subtasks]);

  // Preview state
  const previewType = useMemo(() => {
    if (hoveredTask || selectedTask) return 'task';
    if (hoveredList || selectedList) return 'list';
    return null;
  }, [hoveredTask, selectedTask, hoveredList, selectedList]);

  const previewData = useMemo(() => {
    if (hoveredTask) return hoveredTask;
    if (selectedTask) return selectedTask;
    if (hoveredList) return hoveredList;
    if (selectedList) return selectedList;
    return null;
  }, [hoveredTask, selectedTask, hoveredList, selectedList]);

  const previewTasks = useMemo(() => {
    if (hoveredList) return hoveredList.tasks;
    if (selectedList && !selectedTask && !hoveredTask) return selectedList.tasks;
    return undefined;
  }, [hoveredList, selectedList, selectedTask, hoveredTask]);

  const previewSubtasks = useMemo(() => {
    const task = hoveredTask || selectedTask;
    if (!task) return undefined;
    return cache.subtasks.get(task.id) || task.subtasks;
  }, [hoveredTask, selectedTask, cache.subtasks]);

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: 'var(--bg-body)',
        }}
      >
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: '16px' }} />
          <p style={{ fontSize: '14px' }}>Pano yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!board) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: 'var(--bg-body)',
        }}
      >
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: '16px', marginBottom: '16px' }}>Pano bulunamadı</p>
          <button
            onClick={() => navigate('/boards')}
            className="btn btn-primary"
          >
            Panolara Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 60px)',
        background: 'var(--bg-body)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 24px',
          borderBottom: '1px solid var(--border)',
          background: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(12px)',
          flexShrink: 0,
        }}
      >
        {/* Left: Back + Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => navigate('/boards')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            title="Panolara Dön"
          >
            <ArrowLeft size={18} />
          </button>

          {/* Breadcrumb */}
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
                background: !navState.selectedListId ? 'var(--primary)' : 'transparent',
                color: !navState.selectedListId ? 'white' : 'var(--text-main)',
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
                    background: selectedList && !navState.selectedTaskId ? 'var(--primary)' : 'transparent',
                    color: selectedList && !navState.selectedTaskId ? 'white' : 'var(--text-main)',
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
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    background: 'var(--primary)',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 500,
                    maxWidth: '200px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {selectedTask.title}
                </span>
              </>
            )}
          </nav>
        </div>

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => navigate(`/boards/${slug}`)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 14px',
              borderRadius: '10px',
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
              transition: 'all 0.2s ease',
            }}
            title="Grid Görünümüne Geç"
          >
            <LayoutGrid size={16} />
            Grid
          </button>

          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            title="Etiketler"
          >
            <Tag size={16} />
          </button>

          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            title="Ayarlar"
          >
            <Settings size={16} />
          </button>
        </div>
      </header>

      {/* Main Content: Miller Columns + Preview */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden',
        }}
      >
        {/* Miller Columns Container */}
        <div
          style={{
            display: 'flex',
            flex: 1,
            overflowX: 'auto',
            overflowY: 'hidden',
          }}
        >
          {/* Column 1: Listeler */}
          <MillerColumn
            title="Listeler"
            items={listItems}
            selectedId={navState.selectedListId}
            hoveredId={hoveredList?.id ?? null}
            onSelect={handleListSelect}
            onHover={handleListHover}
            columnIndex={0}
            emptyMessage="Bu panoda liste yok"
          />

          {/* Column 2: Görevler (Liste seçiliyse) */}
          {navState.selectedListId && selectedList && (
            <MillerColumn
              title={`${selectedList.name} - Görevler`}
              items={taskItems}
              selectedId={navState.selectedTaskId}
              hoveredId={hoveredTask?.id ?? null}
              onSelect={handleTaskSelect}
              onHover={handleTaskHover}
              columnIndex={1}
              emptyMessage="Bu listede görev yok"
            />
          )}

          {/* Column 3: Alt Görevler (Task seçiliyse ve subtask varsa) */}
          {navState.selectedTaskId && selectedTask && subtaskItems.length > 0 && (
            <MillerColumn
              title={`${selectedTask.title} - Alt Görevler`}
              items={subtaskItems}
              selectedId={null}
              hoveredId={null}
              onSelect={() => {}}
              onHover={() => {}}
              columnIndex={2}
              isLoading={isLoadingSubtasks}
              emptyMessage="Alt görev yok"
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
          />
        </div>
      </div>

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

export default BoardMillerView;
