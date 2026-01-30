import { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useBoardDetailQuery } from "../hooks/queries/useBoards";
import { useUpdateBoard, useDeleteBoard } from "../hooks/queries/useBoardMutations";
import { BoardInfoPanel } from "../components/BoardInfoPanel";
import BoardEditModal from "../components/BoardEditModal";
import { useTheme } from "../contexts/ThemeContext";
import { getThemeColors } from "../utils/themeColors";
import { ArrowLeft } from "lucide-react";
import { typography, spacing, radius, colors, cssVars, animation } from "../styles/tokens";

const BoardInfoPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const themeColors = getThemeColors(theme);
  const { data: board = null, isLoading, error } = useBoardDetailQuery(slug);
  const updateBoardMutation = useUpdateBoard();
  const deleteBoardMutation = useDeleteBoard();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleEditBoard = async (data: {
    name: string;
    link?: string;
    description?: string;
    deadline?: string;
    status?: string;
    category?: string;
    boardType?: 'INDIVIDUAL' | 'TEAM';
  }) => {
    if (!board) return;
    const formattedDeadline = data.deadline ? `${data.deadline}T23:59:59` : undefined;
    await updateBoardMutation.mutateAsync({
      boardId: board.id,
      data: {
        name: data.name,
        status: data.status || board.status || "PLANLANDI",
        link: data.link,
        description: data.description,
        deadline: formattedDeadline,
        category: data.category,
        boardType: data.boardType,
      },
    });
    setIsEditModalOpen(false);
  };

  const handleDeleteBoard = () => {
    if (!board) return;
    deleteBoardMutation.mutate(board.id);
    navigate("/boards");
  };

  const handleGoBack = () => {
    const from = (location.state as { from?: string })?.from;
    navigate(from || "/boards");
  };

  if (isLoading) {
    return (
      <div
        style={{
          height: "100%",
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

  if (error || !board) {
    return (
      <div
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          color: cssVars.textMuted,
          gap: spacing[4],
        }}
      >
        <h2>Pano bulunamadı</h2>
        <button
          onClick={handleGoBack}
          style={{
            display: "flex",
            alignItems: "center",
            gap: spacing[2],
            padding: `${spacing[2.5]} ${spacing[4]}`,
            borderRadius: radius.lg,
            border: "none",
            background: colors.brand.primary,
            color: "#fff",
            cursor: "pointer",
            fontWeight: typography.fontWeight.semibold,
            fontSize: typography.fontSize.sm,
          }}
        >
          <ArrowLeft size={16} />
          Geri Dön
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: cssVars.bgBody,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: spacing[3],
          padding: `${spacing[4]} ${spacing[6]}`,
          borderBottom: `1px solid ${themeColors.borderDefault}`,
          background: cssVars.bgElevated,
        }}
      >
        <button
          onClick={handleGoBack}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: spacing[10],
            height: spacing[10],
            borderRadius: radius.lg,
            border: `1px solid ${themeColors.borderDefault}`,
            background: themeColors.bgHover,
            color: cssVars.textMuted,
            cursor: "pointer",
            transition: `all ${animation.duration.normal}`,
          }}
          title="Geri Dön"
        >
          <ArrowLeft size={20} />
        </button>
        <div style={{ flex: 1 }}>
          <h1
            style={{
              fontSize: typography.fontSize["2xl"],
              fontWeight: typography.fontWeight.bold,
              color: cssVars.textMain,
              margin: 0,
            }}
          >
            Pano Bilgileri
          </h1>
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          display: "flex",
          justifyContent: "center",
          padding: `${spacing[6]} ${spacing[6]}`,
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "960px",
          }}
        >
          <BoardInfoPanel
            board={board}
            onClose={handleGoBack}
            onEdit={() => setIsEditModalOpen(true)}
          />
        </div>
      </div>

      {isEditModalOpen && board && (
        <BoardEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleEditBoard}
          onDelete={handleDeleteBoard}
          initialData={{
            name: board.name,
            link: board.link,
            description: board.description,
            deadline: board.deadline ? board.deadline.split('T')[0] : undefined,
            status: board.status as "PLANLANDI" | "DEVAM_EDIYOR" | "TAMAMLANDI" | "DURDURULDU" | "BIRAKILDI",
            category: board.category,
            boardType: board.boardType as "INDIVIDUAL" | "TEAM" | undefined,
          }}
        />
      )}
    </div>
  );
};

export default BoardInfoPage;
