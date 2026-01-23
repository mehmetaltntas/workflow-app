import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { typography, spacing, radius, shadows, colors, cssVars } from '../styles/tokens';

const LandingPage = () => {
  const navigate = useNavigate();

  // Zaten giris yapmis kullanicilari yonlendir
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/home", { replace: true });
    }
  }, [navigate]);

  const features = [
    {
      icon: (
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      ),
      title: "Panolar",
      description:
        "Projelerinizi gorsel panolarla organize edin. Surukle-birak ile kolayca yonetin.",
    },
    {
      icon: (
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
        </svg>
      ),
      title: "Gorevler",
      description:
        "Gorevlerinizi listeleyin, onceliklendirin ve takip edin. Hic bir detayi kacirmayin.",
    },
    {
      icon: (
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
      title: "Takvim",
      description:
        "Son tarihlerinizi takvim gorunumunde takip edin. Planlamanizi kolaylastirin.",
    },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `linear-gradient(135deg, ${cssVars.bgBody} 0%, #16213e 50%, #0f3460 100%)`,
      }}
    >
      {/* Header */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: `${spacing[5]} ${spacing[10]}`,
          maxWidth: "1400px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: spacing[3],
          }}
        >
          <div
            style={{
              width: spacing[10],
              height: spacing[10],
              background: `linear-gradient(135deg, ${colors.brand.primary} 0%, #764ba2 100%)`,
              borderRadius: radius.md,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill={cssVars.textInverse}
            >
              <path d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
            </svg>
          </div>
          <span
            style={{
              fontSize: typography.fontSize["4xl"],
              fontWeight: typography.fontWeight.bold,
              color: cssVars.textMain,
              letterSpacing: typography.letterSpacing.tight,
            }}
          >
            WorkFlow
          </span>
        </div>

        <div style={{ display: "flex", gap: spacing[4] }}>
          <button
            onClick={() => navigate("/login")}
            style={{
              padding: `${spacing[2.5]} ${spacing[6]}`,
              borderRadius: radius.md,
              border: `1px solid ${cssVars.borderStrong}`,
              background: "transparent",
              color: cssVars.textMain,
              fontSize: typography.fontSize.xl,
              fontWeight: typography.fontWeight.medium,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = colors.dark.bg.hover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            Giris Yap
          </button>
          <button
            onClick={() => navigate("/register")}
            style={{
              padding: `${spacing[2.5]} ${spacing[6]}`,
              borderRadius: radius.md,
              border: "none",
              background: `linear-gradient(135deg, ${colors.brand.primary} 0%, #764ba2 100%)`,
              color: cssVars.textMain,
              fontSize: typography.fontSize.xl,
              fontWeight: typography.fontWeight.semibold,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = shadows.lg;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            Kayit Ol
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: `${spacing[20]} ${spacing[10]}`,
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: "clamp(36px, 5vw, 64px)",
            fontWeight: typography.fontWeight.extrabold,
            color: cssVars.textMain,
            lineHeight: typography.lineHeight.tight,
            marginBottom: spacing[6],
            letterSpacing: typography.letterSpacing.tighter,
          }}
        >
          Projelerinizi
          <br />
          <span
            style={{
              background: `linear-gradient(135deg, ${colors.brand.primary} 0%, #764ba2 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Kolayca Yonetin
          </span>
        </h1>

        <p
          style={{
            fontSize: "clamp(16px, 2vw, 20px)",
            color: colors.dark.text.secondary,
            maxWidth: "600px",
            margin: `0 auto ${spacing[12]}`,
            lineHeight: typography.lineHeight.relaxed,
          }}
        >
          WorkFlow ile gorevlerinizi organize edin, ekibinizle isbirligi yapin ve
          projelerinizi zamaninda tamamlayin.
        </p>

        <button
          onClick={() => navigate("/register")}
          style={{
            padding: `${spacing[4]} ${spacing[12]}`,
            borderRadius: radius.lg,
            border: "none",
            background: `linear-gradient(135deg, ${colors.brand.primary} 0%, #764ba2 100%)`,
            color: cssVars.textMain,
            fontSize: typography.fontSize["2xl"],
            fontWeight: typography.fontWeight.semibold,
            cursor: "pointer",
            transition: "all 0.3s",
            boxShadow: shadows.lg,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-3px)";
            e.currentTarget.style.boxShadow = shadows.xl;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = shadows.lg;
          }}
        >
          Ucretsiz Baslayiniz
        </button>

        {/* Features Section */}
        <section
          style={{
            marginTop: "120px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: spacing[8],
          }}
        >
          {features.map((feature, index) => (
            <div
              key={index}
              style={{
                background: colors.dark.bg.hover,
                backdropFilter: "blur(10px)",
                borderRadius: radius.xl,
                padding: `${spacing[10]} ${spacing[8]}`,
                border: `1px solid ${cssVars.border}`,
                transition: "all 0.3s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-8px)";
                e.currentTarget.style.background = colors.dark.bg.active;
                e.currentTarget.style.boxShadow = shadows.xl;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.background = colors.dark.bg.hover;
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div
                style={{
                  color: colors.brand.primary,
                  marginBottom: spacing[5],
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                {feature.icon}
              </div>
              <h3
                style={{
                  fontSize: typography.fontSize["3xl"],
                  fontWeight: typography.fontWeight.bold,
                  color: cssVars.textMain,
                  marginBottom: spacing[3],
                }}
              >
                {feature.title}
              </h3>
              <p
                style={{
                  fontSize: typography.fontSize.xl,
                  color: colors.dark.text.secondary,
                  lineHeight: typography.lineHeight.relaxed,
                }}
              >
                {feature.description}
              </p>
            </div>
          ))}
        </section>
      </main>

      {/* Footer */}
      <footer
        style={{
          padding: spacing[10],
          textAlign: "center",
          color: colors.dark.text.subtle,
          fontSize: typography.fontSize.lg,
        }}
      >
        &copy; 2025 WorkFlow. Tum haklari saklidir.
      </footer>
    </div>
  );
};

export default LandingPage;
