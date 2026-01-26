import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useBoardDetailQuery } from "../hooks/queries/useBoards";
import { BoardInfoPanel } from "../components/BoardInfoPanel";
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
  const isLight = theme === "light";

  const { data: board = null, isLoading, error } = useBoardDetailQuery(slug);

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
          background: isLight ? colors.light.bg.elevated : colors.dark.bg.elevated,
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
        <div>
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
          <p
            style={{
              fontSize: typography.fontSize.sm,
              color: cssVars.textMuted,
              margin: 0,
            }}
          >
            {board.name}
          </p>
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          display: "flex",
          justifyContent: "center",
          padding: `${spacing[8]} ${spacing[6]}`,
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
          />
        </div>
      </div>
    </div>
  );
};

export default BoardInfoPage;
