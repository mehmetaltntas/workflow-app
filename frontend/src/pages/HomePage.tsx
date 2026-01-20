import { useNavigate } from "react-router-dom";
import { useBoards } from "../hooks/useBoards";
import { Plus, Layout, ArrowRight } from "lucide-react";
import type { Board } from "../types";

const HomePage = () => {
  const navigate = useNavigate();
  const { boards, loading, updateBoardStatus } = useBoards();

  // Sadece "DEVAM_EDIYOR" statüsündeki panoları filtrele
  const activeBoards = boards.filter((b) => b.status === "DEVAM_EDIYOR");

  const STATUS_LABELS: Record<string, string> = {
    PLANLANDI: "Planlandı",
    DEVAM_EDIYOR: "Devam Ediyor",
    TAMAMLANDI: "Tamamlandı",
    DURDURULDU: "Durduruldu",
    BIRAKILDI: "Bırakıldı",
  };

  const handleStatusChange = async (e: React.SyntheticEvent, board: Board, newStatus: string) => {
    e.preventDefault();
    e.stopPropagation();
    await updateBoardStatus(board.id, newStatus);
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
            <div
              key={board.id}
              onClick={() => navigate(`/boards/${board.slug}`)}
              style={{
                background: "var(--bg-card)",
                borderRadius: "16px",
                padding: "24px",
                border: "1px solid var(--border)",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                cursor: "pointer",
                transition: "transform 0.2s, box-shadow 0.2s",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)";
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                <div style={{ 
                    width: "48px", 
                    height: "48px", 
                    borderRadius: "12px", 
                    background: "rgba(245, 158, 11, 0.1)", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    color: "#f59e0b"
                }}>
                    <Layout size={24} />
                </div>
                <select
                    value={board.status || "DEVAM_EDIYOR"}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => handleStatusChange(e, board, e.target.value)}
                    style={{
                        padding: "6px 12px",
                        borderRadius: "20px",
                        border: "1px solid var(--border)",
                        background: "var(--bg-body)",
                        color: "var(--text-main)",
                        fontSize: "12px",
                        cursor: "pointer",
                        outline: "none"
                    }}
                >
                    {Object.keys(STATUS_LABELS).map((key) => (
                        <option key={key} value={key}>{STATUS_LABELS[key]}</option>
                    ))}
                </select>
              </div>

              <div>
                <h3 style={{ fontSize: "20px", fontWeight: "600", color: "var(--text-main)", marginBottom: "8px" }}>
                  {board.name}
                </h3>
                <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
                  Aktif proje
                </p>
              </div>

              <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: "8px", color: "var(--primary)", fontWeight: "500", fontSize: "14px" }}>
                Panoya Git <ArrowRight size={16} />
              </div>
            </div>
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
    </div>
  );
};

export default HomePage;
