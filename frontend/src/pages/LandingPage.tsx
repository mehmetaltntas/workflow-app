import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { typography, spacing, radius, colors, animation } from '../styles/tokens';
import { useAuthStore } from '../stores/authStore';

const LandingPage = () => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/home", { replace: true });
    }
  }, [isAuthenticated, navigate]);

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
        "Projelerinizi görsel panolarla organize edin. Sürükle-bırak ile kolayca yönetin.",
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
      title: "Görevler",
      description:
        "Görevlerinizi listeleyin, önceliklendirin ve takip edin. Hiçbir detayı kaçırmayın.",
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
        "Son tarihlerinizi takvim görünümünde takip edin. Planlamanızı kolaylaştırın.",
    },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: colors.dark.bg.body,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Animated Background Gradients */}
      <div
        style={{
          position: "absolute",
          top: "-50%",
          left: "-20%",
          width: "70%",
          height: "100%",
          background: `radial-gradient(ellipse, ${colors.brand.primary}15 0%, transparent 60%)`,
          filter: "blur(80px)",
          pointerEvents: "none",
          animation: "pulse 8s ease-in-out infinite",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-30%",
          right: "-10%",
          width: "60%",
          height: "80%",
          background: `radial-gradient(ellipse, rgba(139, 92, 246, 0.12) 0%, transparent 60%)`,
          filter: "blur(80px)",
          pointerEvents: "none",
          animation: "pulse 10s ease-in-out infinite reverse",
        }}
      />

      {/* Header */}
      <header
        style={{
          position: "relative",
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
              background: `linear-gradient(135deg, ${colors.brand.primary} 0%, #8b5cf6 100%)`,
              borderRadius: radius.md,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `0 4px 24px ${colors.brand.primary}40`,
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill={colors.dark.text.inverse}
            >
              <path d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
            </svg>
          </div>
          <span
            style={{
              fontSize: typography.fontSize["4xl"],
              fontWeight: typography.fontWeight.bold,
              color: colors.dark.text.primary,
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
              border: `1px solid ${colors.dark.border.strong}`,
              background: "transparent",
              color: colors.dark.text.primary,
              fontSize: typography.fontSize.xl,
              fontWeight: typography.fontWeight.medium,
              cursor: "pointer",
              transition: `all ${animation.duration.normal} ${animation.easing.smooth}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = colors.dark.bg.hover;
              e.currentTarget.style.borderColor = colors.dark.text.tertiary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.borderColor = colors.dark.border.strong;
            }}
          >
            Giriş Yap
          </button>
          <button
            onClick={() => navigate("/register")}
            style={{
              padding: `${spacing[2.5]} ${spacing[6]}`,
              borderRadius: radius.md,
              border: "none",
              background: `linear-gradient(135deg, ${colors.brand.primary} 0%, #8b5cf6 100%)`,
              color: colors.dark.text.primary,
              fontSize: typography.fontSize.xl,
              fontWeight: typography.fontWeight.semibold,
              cursor: "pointer",
              transition: `all ${animation.duration.normal} ${animation.easing.smooth}`,
              boxShadow: `0 4px 16px ${colors.brand.primary}30`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = `0 8px 24px ${colors.brand.primary}40`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = `0 4px 16px ${colors.brand.primary}30`;
            }}
          >
            Kayıt Ol
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main
        style={{
          position: "relative",
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
            color: colors.dark.text.primary,
            lineHeight: typography.lineHeight.tight,
            marginBottom: spacing[6],
            letterSpacing: typography.letterSpacing.tighter,
          }}
        >
          Projelerinizi
          <br />
          <span
            style={{
              background: `linear-gradient(135deg, ${colors.brand.primary} 0%, #8b5cf6 50%, #ec4899 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundSize: "200% 200%",
              animation: "gradientShift 5s ease infinite",
            }}
          >
            Kolayca Yönetin
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
          WorkFlow ile görevlerinizi organize edin, ekibinizle iş birliği yapın ve
          projelerinizi zamanında tamamlayın.
        </p>

        <button
          onClick={() => navigate("/register")}
          style={{
            padding: `${spacing[4]} ${spacing[12]}`,
            borderRadius: radius.lg,
            border: "none",
            background: `linear-gradient(135deg, ${colors.brand.primary} 0%, #8b5cf6 100%)`,
            color: colors.dark.text.primary,
            fontSize: typography.fontSize["2xl"],
            fontWeight: typography.fontWeight.semibold,
            cursor: "pointer",
            transition: `all ${animation.duration.slow} ${animation.easing.smooth}`,
            boxShadow: `0 8px 32px ${colors.brand.primary}35`,
            position: "relative",
            overflow: "hidden",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-3px) scale(1.02)";
            e.currentTarget.style.boxShadow = `0 12px 40px ${colors.brand.primary}50`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0) scale(1)";
            e.currentTarget.style.boxShadow = `0 8px 32px ${colors.brand.primary}35`;
          }}
        >
          Ücretsiz Başlayın
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
                background: colors.dark.glass.bg,
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                borderRadius: radius.xl,
                padding: `${spacing[10]} ${spacing[8]}`,
                border: `1px solid ${colors.dark.border.default}`,
                transition: `all ${animation.duration.slow} ${animation.easing.smooth}`,
                position: "relative",
                overflow: "hidden",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-8px)";
                e.currentTarget.style.background = colors.dark.bg.hover;
                e.currentTarget.style.borderColor = colors.dark.border.strong;
                e.currentTarget.style.boxShadow = `0 20px 40px rgba(0,0,0,0.4), 0 0 0 1px ${colors.dark.border.subtle}`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.background = colors.dark.glass.bg;
                e.currentTarget.style.borderColor = colors.dark.border.default;
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {/* Card Glow Effect */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "80%",
                  height: "1px",
                  background: `linear-gradient(90deg, transparent, ${colors.brand.primary}40, transparent)`,
                }}
              />
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
                  color: colors.dark.text.primary,
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
          position: "relative",
          padding: spacing[10],
          textAlign: "center",
          color: colors.dark.text.subtle,
          fontSize: typography.fontSize.lg,
          borderTop: `1px solid ${colors.dark.border.subtle}`,
          marginTop: spacing[20],
        }}
      >
        &copy; 2025 WorkFlow. Tüm hakları saklıdır.
      </footer>

      {/* Animations */}
      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 0.5; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.05); }
          }
          @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `}
      </style>
    </div>
  );
};

export default LandingPage;
