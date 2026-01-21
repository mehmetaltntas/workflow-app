
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Board } from "../types";
import toast from "react-hot-toast";
import { Layout } from "lucide-react";

import { useBoards } from "../hooks/useBoards";
// onEdit and onDelete should be optional in BoardCard props but here we pass them.
import BoardCard from "../components/BoardCard";
import CreateBoardModal from "../components/CreateBoardModal";
import { ConfirmationModal } from "../components/ConfirmationModal";
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
  const handleSaveBoard = async (name: string, status: string, link?: string, description?: string) => {
    if (editingBoard) {
        // Güncelleme
        const success = await updateBoard(editingBoard.id, {
            name,
            status,
            link,
            description
        });
        if (success) {
            setIsModalOpen(false);
            setEditingBoard(null);
        }
    } else {
        // Yeni Ekleme
        const success = await createBoard(name, status, link, description);
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
          color: "var(--text-muted)",
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
        background: "var(--bg-body)",
        padding: "40px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "40px",
        }}
      >
        <h1
          style={{
            fontSize: "28px",
            color: "var(--text-main)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <Layout color="var(--primary)" /> Tüm Panolar
        </h1>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
             <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                    padding: "8px",
                    borderRadius: "6px",
                    border: "1px solid var(--border)",
                    background: "var(--bg-input)",
                    color: "var(--text-main)",
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
      <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
        
        {/* Filtre 'ALL' ise grupla, değilse tek baslik */}
        {(statusFilter === "ALL" ? Object.keys(STATUS_LABELS) : [statusFilter]).map((statusKey) => {
           const boardsInStatus = filteredBoards.filter(b => (b.status || "PLANLANDI") === statusKey);
           
           if (boardsInStatus.length === 0 && statusFilter === "ALL") return null;

           return (
             <div key={statusKey}>
                <h2 style={{ 
                    fontSize: "20px", 
                    fontWeight: "600", 
                    color: STATUS_COLORS[statusKey] || "var(--text-main)",
                    marginBottom: "20px",
                    display: "flex", 
                    alignItems: "center",
                    gap: "10px"
                }}>
                    <div style={{width: "12px", height: "12px", borderRadius: "50%", background: STATUS_COLORS[statusKey]}}></div>
                    {STATUS_LABELS[statusKey]} 
                    <span style={{fontSize: "14px", color: "var(--text-muted)", fontWeight: "normal"}}>({boardsInStatus.length})</span>
                </h2>

                <div
                    style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                    gap: "20px",
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

      <ConfirmationModal 
        isOpen={!!deleteBoardId}
        title="Panoyu Sil?"
        message="Bu panoyu ve içindeki tüm listeleri/görevleri silmek istediğine emin misin? Bu işlem geri alınamaz."
        onConfirm={handleDeleteBoard}
        onCancel={() => setDeleteBoardId(null)}
        confirmText="Evet, Sil"
        variant="danger"
      />

      {/* Yeni Pano Ekleme Butonu (Floating Action Button stilinde sağ alt) */}
      <button
        onClick={openCreateModal}
        style={{
            position: "fixed",
            bottom: "40px",
            right: "40px",
            background: "var(--primary)",
            color: "white",
            border: "none",
            borderRadius: "50%",
            width: "60px",
            height: "60px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "32px",
            boxShadow: "0 4px 12px rgba(var(--primary-rgb), 0.4)",
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
                description: editingBoard.description
            } : undefined}
        />
      )}
    </div>
  );
};

export default BoardsPage;
