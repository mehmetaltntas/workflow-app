
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Board } from "../types";
import toast from "react-hot-toast";
import { Layout } from "lucide-react";

import { useBoards } from "../hooks/useBoards";
import { typography, spacing, radius, shadows, colors, cssVars } from '../styles/tokens';
// onEdit and onDelete should be optional in BoardCard props but here we pass them.
import BoardCard from "../components/BoardCard";
import CreateBoardModal from "../components/CreateBoardModal";
import { DeleteConfirmation } from "../components/DeleteConfirmation";
import { STATUS_COLORS, STATUS_LABELS } from "../constants";

const BoardsPage = () => {
  const navigate = useNavigate();
  const { boards, loading, createBoard, updateBoard, deleteBoard, updateBoardStatus, userId } = useBoards();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBoard, setEditingBoard] = useState<Board | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [deleteBoardId, setDeleteBoardId] = useState<number | null>(null);

  useEffect(() => {
    if (!userId) {
      toast.error("Oturum süresi dolmuş");
      navigate("/login");
    }
  }, [userId, navigate]);

  // Hem Ekleme Hem Güncelleme için ortak fonksiyon
  const handleSaveBoard = async (name: string, status: string, link?: string, description?: string, deadline?: string) => {
    // Backend LocalDateTime formatı bekliyor (2024-12-31T23:59:59)
    const formattedDeadline = deadline ? `${deadline}T23:59:59` : undefined;

    if (editingBoard) {
        // Güncelleme
        const success = await updateBoard(editingBoard.id, {
            name,
            status,
            link,
            description,
            deadline: formattedDeadline
        });
        if (success) {
            setIsModalOpen(false);
            setEditingBoard(null);
        }
    } else {
        // Yeni Ekleme
        const success = await createBoard(name, status, link, description, formattedDeadline);
        if (success) {
            setIsModalOpen(false);
        }
    }
  };

  const handleDeleteBoard = async () => {
      if (deleteBoardId) {
          await deleteBoard(deleteBoardId);
          setDeleteBoardId(null);
      }
  }

  const openCreateModal = () => {
      setEditingBoard(null);
      setIsModalOpen(true);
  }

  const openEditModal = (board: Board) => {
      setEditingBoard(board);
      setIsModalOpen(true);
  }

  const handleStatusChange = async (board: Board, newStatus: string) => {
    await updateBoardStatus(board.id, newStatus);
  };

  const filteredBoards = boards.filter(b => statusFilter === "ALL" || (b.status || "PLANLANDI") === statusFilter);

  // Logout fonksiyonu kaldırıldı (Navbar'da var)

  if (loading) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: cssVars.textMuted,
        }}
      >
        <h2>Panolar Yükleniyor...</h2>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: cssVars.bgBody,
        padding: spacing[10],
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: spacing[10],
        }}
      >
        <h1
          style={{
            fontSize: typography.fontSize["4xl"],
            color: cssVars.textMain,
            display: "flex",
            alignItems: "center",
            gap: spacing[2.5],
          }}
        >
          <Layout color={colors.brand.primary} /> Tüm Panolar
        </h1>
        <div style={{ display: "flex", gap: spacing[2.5], alignItems: "center" }}>
             <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                    padding: spacing[2],
                    borderRadius: radius.sm,
                    border: `1px solid ${cssVars.border}`,
                    background: cssVars.bgInput,
                    color: cssVars.textMain,
                    cursor: "pointer"
                }}
             >
                <option value="ALL">Tüm Panolar</option>
                {Object.keys(STATUS_LABELS).map((key) => (
                    <option key={key} value={key}>{STATUS_LABELS[key]}</option>
                ))}
             </select>
        </div>
      </div>

      {/* Status Gruplu Liste */}
      <div style={{ display: "flex", flexDirection: "column", gap: spacing[10] }}>

        {/* Filtre 'ALL' ise grupla, değilse tek baslik */}
        {(statusFilter === "ALL" ? Object.keys(STATUS_LABELS) : [statusFilter]).map((statusKey) => {
           const boardsInStatus = filteredBoards.filter(b => (b.status || "PLANLANDI") === statusKey);

           if (boardsInStatus.length === 0 && statusFilter === "ALL") return null;

           return (
             <div key={statusKey}>
                <h2 style={{
                    fontSize: typography.fontSize["3xl"],
                    fontWeight: typography.fontWeight.semibold,
                    color: STATUS_COLORS[statusKey] || cssVars.textMain,
                    marginBottom: spacing[5],
                    display: "flex",
                    alignItems: "center",
                    gap: spacing[2.5]
                }}>
                    <div style={{width: spacing[3], height: spacing[3], borderRadius: radius.full, background: STATUS_COLORS[statusKey]}}></div>
                    {STATUS_LABELS[statusKey]}
                    <span style={{fontSize: typography.fontSize.lg, color: cssVars.textMuted, fontWeight: typography.fontWeight.normal}}>({boardsInStatus.length})</span>
                </h2>

                <div
                    style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                    gap: spacing[5],
                    }}
                >
                    {boardsInStatus.map(board => (
                        <BoardCard 
                            key={board.id} 
                            board={board} 
                            onClick={() => navigate(`/boards/${board.slug}`)} 
                            onStatusChange={handleStatusChange}
                            onEdit={() => openEditModal(board)}
                            onDelete={() => setDeleteBoardId(board.id)}
                        />
                    ))}
                </div>
             </div>
           )
        })}
      </div>

      <DeleteConfirmation 
        isOpen={!!deleteBoardId}
        title="Panoyu silmek istiyor musun?"
        message="Bu pano ve içindeki tüm listeler/görevler kalıcı olarak silinecek."
        onConfirm={handleDeleteBoard}
        onCancel={() => setDeleteBoardId(null)}
        confirmText="Evet, Sil"
        variant="danger"
        autoCloseDelay={6000}
      />

      {/* Yeni Pano Ekleme Butonu (Floating Action Button stilinde sağ alt) */}
      <button
        onClick={openCreateModal}
        style={{
            position: "fixed",
            bottom: spacing[10],
            right: spacing[10],
            background: colors.brand.primary,
            color: cssVars.textInverse,
            border: "none",
            borderRadius: radius.full,
            width: "60px",
            height: "60px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: typography.fontSize["5xl"],
            boxShadow: shadows.md,
            cursor: "pointer",
            transition: "transform 0.2s"
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.1)"}
        onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
      >
        +
      </button>

      {isModalOpen && (
        <CreateBoardModal 
            key={editingBoard ? `edit-${editingBoard.id}` : 'create-new'}
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            onCreate={handleSaveBoard}
            initialData={editingBoard ? {
                name: editingBoard.name,
                status: editingBoard.status || "PLANLANDI",
                link: editingBoard.link,
                description: editingBoard.description,
                deadline: editingBoard.deadline ? editingBoard.deadline.split('T')[0] : undefined
            } : undefined}
        />
      )}
    </div>
  );
};

export default BoardsPage;
