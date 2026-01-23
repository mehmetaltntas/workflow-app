import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useBoards } from "../hooks/useBoards";
import { Plus, Layout } from "lucide-react";
import type { Board } from "../types";
import BoardCard from "../components/BoardCard";
import CreateBoardModal from "../components/CreateBoardModal";
import { ConfirmationModal } from "../components/ConfirmationModal";
import { typography, spacing, radius, cssVars } from '../styles/tokens';

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

  const handleSaveBoard = async (name: string, status: string, link?: string, description?: string) => {
    if (editingBoard) {
      const success = await updateBoard(editingBoard.id, { name, status, link, description });
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
          color: cssVars.textMuted,
        }}
      >
        <h2>Yükleniyor...</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: spacing[10], maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ marginBottom: spacing[10] }}>
        <h1 style={{ fontSize: typography.fontSize["5xl"], color: cssVars.textMain, marginBottom: spacing[2.5] }}>
          Hoş Geldin!
        </h1>
        <p style={{ color: cssVars.textMuted, fontSize: typography.fontSize["2xl"] }}>
          İşte üzerinde çalıştığın aktif projeler.
        </p>
      </header>

      {activeBoards.length > 0 ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: spacing[6],
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
                background: cssVars.bgCard,
                borderRadius: radius["2xl"],
                padding: "60px",
                textAlign: "center",
                border: `1px dashed ${cssVars.border}`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: spacing[5]
            }}
        >
            <div
                style={{
                    width: spacing[20],
                    height: spacing[20],
                    borderRadius: radius.full,
                    background: cssVars.bgBody,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: spacing[2.5]
                }}
            >
                <Layout size={40} color={cssVars.textMuted} />
            </div>
            <h3 style={{ fontSize: typography.fontSize["4xl"], color: cssVars.textMain }}>
                Şu an aktif bir projen yok
            </h3>
            <p style={{ color: cssVars.textMuted, maxWidth: "400px", lineHeight: typography.lineHeight.relaxed }}>
                Görünüşe göre şu anda "Devam Ediyor" statüsünde bir panon bulunmuyor.
                Yeni bir işe başlamak için panolarım sayfasına göz atabilirsin.
            </p>
            <button
                onClick={() => navigate("/boards")}
                className="btn btn-primary"
                style={{
                    padding: `${spacing[3]} ${spacing[6]}`,
                    fontSize: typography.fontSize.xl,
                    display: "flex",
                    alignItems: "center",
                    gap: spacing[2.5],
                    marginTop: spacing[2.5]
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
            link: editingBoard.link,
            description: editingBoard.description
          } : undefined}
        />
      )}
    </div>
  );
};

export default HomePage;
