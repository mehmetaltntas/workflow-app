import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useBoards } from "../hooks/useBoards";
import { Plus, Layout } from "lucide-react";
import type { Board } from "../types";
import BoardCard from "../components/BoardCard";
import CreateBoardModal from "../components/CreateBoardModal";
import { ConfirmationModal } from "../components/ConfirmationModal";

const HomePage = () => {
  const navigate = useNavigate();
  const { boards, loading, updateBoardStatus, updateBoard, deleteBoard } = useBoards();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBoard, setEditingBoard] = useState<Board | null>(null);
  const [deleteBoardId, setDeleteBoardId] = useState<number | null>(null);

  // Sadece "DEVAM_EDIYOR" statüsündeki panoları filtrele
  const activeBoards = boards.filter((b) => b.status === "DEVAM_EDIYOR");

  const handleStatusChange = async (board: Board, newStatus: string) => {
    await updateBoardStatus(board.id, newStatus);
  };

  const handleEdit = (board: Board) => {
    setEditingBoard(board);
    setIsModalOpen(true);
  };

  const handleDelete = (boardId: number) => {
    setDeleteBoardId(boardId);
  };

  const handleSaveBoard = async (name: string, status: string, link?: string) => {
    if (editingBoard) {
      const success = await updateBoard(editingBoard.id, { name, status, link });
      if (success) {
        setIsModalOpen(false);
        setEditingBoard(null);
      }
    }
  };

  const confirmDelete = async () => {
    if (deleteBoardId) {
      await deleteBoard(deleteBoardId);
      setDeleteBoardId(null);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          height: "calc(100vh - 64px)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: "var(--text-muted)",
        }}
      >
        <h2>Yükleniyor...</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ marginBottom: "40px" }}>
        <h1 style={{ fontSize: "32px", color: "var(--text-main)", marginBottom: "10px" }}>
          Hoş Geldin! 👋
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "18px" }}>
          İşte üzerinde çalıştığın aktif projeler.
        </p>
      </header>

      {activeBoards.length > 0 ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "24px",
          }}
        >
          {activeBoards.map((board) => (
            <BoardCard
              key={board.id}
              board={board}
              onClick={() => navigate(`/boards/${board.slug}`)}
              onStatusChange={handleStatusChange}
              onEdit={() => handleEdit(board)}
              onDelete={() => handleDelete(board.id)}
            />
          ))}
        </div>
      ) : (
        <div
            style={{
                background: "var(--bg-card)",
                borderRadius: "24px",
                padding: "60px",
                textAlign: "center",
                border: "1px dashed var(--border)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "20px"
            }}
        >
            <div 
                style={{ 
                    width: "80px", 
                    height: "80px", 
                    borderRadius: "50%", 
                    background: "var(--bg-body)", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    marginBottom: "10px"
                }}
            >
                <Layout size={40} color="var(--text-muted)" />
            </div>
            <h3 style={{ fontSize: "24px", color: "var(--text-main)" }}>
                Şu an aktif bir projen yok
            </h3>
            <p style={{ color: "var(--text-muted)", maxWidth: "400px", lineHeight: "1.6" }}>
                Görünüşe göre şu anda "Devam Ediyor" statüsünde bir panon bulunmuyor. 
                Yeni bir işe başlamak için panolarım sayfasına göz atabilirsin.
            </p>
            <button
                onClick={() => navigate("/boards")}
                className="btn btn-primary"
                style={{ 
                    padding: "12px 24px", 
                    fontSize: "16px", 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "10px",
                    marginTop: "10px" 
                }}
            >
                <Plus size={20} /> Panolarım'a Git
            </button>
        </div>
      )}

      <ConfirmationModal 
        isOpen={!!deleteBoardId}
        title="Panoyu Sil?"
        message="Bu panoyu ve içindeki tüm listeleri/görevleri silmek istediğine emin misin? Bu işlem geri alınamaz."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteBoardId(null)}
        confirmText="Evet, Sil"
        variant="danger"
      />

      {isModalOpen && (
        <CreateBoardModal 
          isOpen={isModalOpen} 
          onClose={() => {
            setIsModalOpen(false);
            setEditingBoard(null);
          }} 
          onCreate={handleSaveBoard}
          initialData={editingBoard ? {
            name: editingBoard.name,
            status: editingBoard.status || "PLANLANDI",
            link: editingBoard.link
          } : undefined}
        />
      )}
    </div>
  );
};

export default HomePage;
