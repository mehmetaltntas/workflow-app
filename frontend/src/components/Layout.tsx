import { useState, useRef, useEffect } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, Home, Settings, LogOut, ChevronDown, Sun, Moon, Calendar, User, Github, Twitter, Mail, Heart } from "lucide-react";
import toast from "react-hot-toast";
import { authService } from "../services/api";
import { useTheme } from "../contexts/ThemeContext";
import { typography, spacing, radius, sizes, zIndex, animation, cssVars, colors } from "../styles/tokens";
import { useAuthStore } from "../stores/authStore";

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(location.pathname);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sayfa değişince dropdown'ı kapat (State adjustment during render)
  if (location.pathname !== prevPathname) {
    setPrevPathname(location.pathname);
    setIsDropdownOpen(false);
  }

  // authStore'dan kullanıcı bilgilerini al
  const { username: storedUsername, logout } = useAuthStore();
  const username = storedUsername || "Kullanıcı";
  // Avatar için baş harfler
  const initials = username.substring(0, 2).toUpperCase();

  // Board detay sayfasında mıyız? (/boards/:slug formatında)
  const isBoardDetailPage = /^\/boards\/[^/]+$/.test(location.pathname);

  const handleLogout = async () => {
    try {
      // Backend'de refresh token'ı geçersiz kıl
      await authService.logout();
    } catch (error) {
      // Logout API hatası olsa bile devam et
      console.warn("Logout API hatası:", error);
    } finally {
      // Her durumda authStore'u temizle ve yönlendir
      logout();
      toast.success("Çıkış yapıldı");
      navigate("/login");
    }
  };

  // Dropdown dışına tıklanınca kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const isActive = (path: string) => location.pathname === path;

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Modern Navbar */}
      <nav
        style={{
          height: sizes.navbarHeight,
          background: cssVars.bgBody,
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: `1px solid ${cssVars.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: `0 ${spacing[6]}`,
          position: "sticky",
          top: 0,
          zIndex: zIndex.dropdown,
        }}
      >
        {/* Sol Taraf: Logo ve Navigasyon */}
        <div style={{ display: "flex", alignItems: "center", gap: spacing[8] }}>
          {/* Logo */}
          <Link
            to="/"
            style={{
              fontSize: typography.fontSize["3xl"],
              fontWeight: typography.fontWeight.bold,
              color: cssVars.textMain,
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: spacing[2.5],
              letterSpacing: typography.letterSpacing.tighter,
            }}
          >
            <div style={{
              width: spacing[8],
              height: spacing[8],
              borderRadius: radius.lg,
              background: `linear-gradient(135deg, ${cssVars.primary}, ${colors.brand.primaryDark})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: typography.fontSize["4xl"],
              fontWeight: typography.fontWeight.extrabold,
              color: cssVars.textInverse,
            }}>
              W
            </div>
            <span>WorkFlow</span>
          </Link>

          {/* Divider */}
          <div style={{
            height: spacing[6],
            width: "1px",
            background: cssVars.border
          }} />

          {/* Navigation Pills */}
          <div style={{ display: "flex", gap: spacing[2] }}>
            <Link
              to="/"
              className={`nav-pill ${isActive("/") ? "active" : ""}`}
            >
              <Home size={16} strokeWidth={2} />
              <span>Ana Sayfa</span>
            </Link>
            <Link
              to="/boards"
              className={`nav-pill ${isActive("/boards") ? "active" : ""}`}
            >
              <LayoutDashboard size={16} strokeWidth={2} />
              <span>Panolarım</span>
            </Link>
            <Link
              to="/calendar"
              className={`nav-pill ${isActive("/calendar") ? "active" : ""}`}
            >
              <Calendar size={16} strokeWidth={2} />
              <span>Takvim</span>
            </Link>
            <Link
              to="/profile"
              className={`nav-pill ${isActive("/profile") ? "active" : ""}`}
            >
              <User size={16} strokeWidth={2} />
              <span>Profil</span>
            </Link>
          </div>
        </div>

        {/* Sağ Taraf: Theme Toggle ve Kullanıcı Profili */}
        <div style={{ display: "flex", alignItems: "center", gap: spacing[3], marginLeft: "auto" }}>
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: sizes.inputMd,
              height: sizes.inputMd,
              borderRadius: radius.lg,
              border: `1px solid ${cssVars.border}`,
              background: cssVars.bgCard,
              color: cssVars.textMuted,
              cursor: "pointer",
              transition: `all ${animation.duration.normal} ${animation.easing.ease}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = cssVars.primary;
              e.currentTarget.style.color = cssVars.primary;
              e.currentTarget.style.background = cssVars.bgSecondary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = cssVars.border;
              e.currentTarget.style.color = cssVars.textMuted;
              e.currentTarget.style.background = cssVars.bgCard;
            }}
            title={theme === "dark" ? "Açık Tema" : "Koyu Tema"}
          >
            {theme === "dark" ? <Sun size={parseInt(sizes.iconMd)} /> : <Moon size={parseInt(sizes.iconMd)} />}
          </button>

          {/* User Profile Dropdown */}
          <div style={{ position: "relative" }} ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: spacing[3],
              cursor: "pointer",
              padding: `${spacing[1.5]} ${spacing[3]}`,
              borderRadius: radius.lg,
              background: isDropdownOpen ? cssVars.bgSecondary : "transparent",
              border: "1px solid",
              borderColor: isDropdownOpen ? cssVars.border : "transparent",
              transition: `all ${animation.duration.normal} ${animation.easing.ease}`,
            }}
          >
            {/* Modern Avatar */}
            <div className="user-avatar">
              {initials}
            </div>
            <span style={{
              color: cssVars.textMain,
              fontWeight: typography.fontWeight.medium,
              fontSize: typography.fontSize.lg,
            }}>
              {username}
            </span>
            <ChevronDown
              size={parseInt(sizes.iconSm)}
              style={{
                color: cssVars.textMuted,
                transform: isDropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                transition: `transform ${animation.duration.normal} ${animation.easing.ease}`,
              }}
            />
          </button>

          {/* Modern User Dropdown */}
          {isDropdownOpen && (
            <div className="menu-dropdown" style={{
              right: 0,
              top: "120%",
              minWidth: "200px",
            }}>
              {/* User Info Header */}
              <div style={{
                padding: spacing[3],
                borderBottom: `1px solid ${cssVars.border}`,
                marginBottom: spacing[1.5],
              }}>
                <div style={{
                  fontSize: typography.fontSize.lg,
                  fontWeight: typography.fontWeight.semibold,
                  color: cssVars.textMain,
                  marginBottom: spacing[0.5],
                }}>
                  {username}
                </div>
                <div style={{
                  fontSize: typography.fontSize.md,
                  color: cssVars.textMuted
                }}>
                  Hesabınızı yönetin
                </div>
              </div>

              <Link to="/profile" className="menu-item">
                <span className="menu-item-icon">
                  <User size={parseInt(sizes.iconSm)} strokeWidth={2} />
                </span>
                <span>Profil</span>
              </Link>

              <Link to="/settings" className="menu-item">
                <span className="menu-item-icon">
                  <Settings size={parseInt(sizes.iconSm)} strokeWidth={2} />
                </span>
                <span>Ayarlar</span>
              </Link>

              <div className="menu-divider" />

              <button
                onClick={handleLogout}
                className="menu-item menu-item--danger"
              >
                <span className="menu-item-icon">
                  <LogOut size={parseInt(sizes.iconSm)} strokeWidth={2} />
                </span>
                <span>Çıkış Yap</span>
              </button>
            </div>
          )}
          </div>
        </div>
      </nav>

      {/* Sayfa İçeriği */}
      <main style={{ flex: 1, overflowY: "auto", overflowX: "hidden", position: "relative" }}>
        <Outlet />

        {/* Footer - Board detay sayfası hariç göster */}
        {!isBoardDetailPage && <Footer />}
      </main>
    </div>
  );
};

// Footer Component
const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinkStyle: React.CSSProperties = {
    color: cssVars.textMuted,
    textDecoration: "none",
    fontSize: typography.fontSize.md,
    transition: `color ${animation.duration.normal} ${animation.easing.ease}`,
    display: "inline-block",
  };

  const footerLinkHoverHandler = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.color = cssVars.primary;
  };

  const footerLinkLeaveHandler = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.color = cssVars.textMuted;
  };

  const socialButtonStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: spacing[9],
    height: spacing[9],
    borderRadius: radius.lg,
    background: cssVars.bgCard,
    border: `1px solid ${cssVars.border}`,
    color: cssVars.textMuted,
    cursor: "pointer",
    transition: `all ${animation.duration.normal} ${animation.easing.ease}`,
  };

  return (
    <footer
      style={{
        background: cssVars.bgBody,
        borderTop: `1px solid ${cssVars.border}`,
        padding: `${spacing[12]} ${spacing[6]} ${spacing[8]}`,
        marginTop: spacing[16],
      }}
    >
      <div
        style={{
          maxWidth: sizes.maxContentWidth,
          margin: "0 auto",
        }}
      >
        {/* Ust Kisim */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: spacing[10],
            marginBottom: spacing[10],
          }}
        >
          {/* Logo ve Aciklama */}
          <div style={{ maxWidth: "320px" }}>
            <Link
              to="/"
              style={{
                fontSize: typography.fontSize["2xl"],
                fontWeight: typography.fontWeight.bold,
                color: cssVars.textMain,
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: spacing[2],
                marginBottom: spacing[4],
              }}
            >
              <div
                style={{
                  width: spacing[7],
                  height: spacing[7],
                  borderRadius: radius.md,
                  background: `linear-gradient(135deg, ${cssVars.primary}, ${colors.brand.primaryDark})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: typography.fontSize["xl"],
                  fontWeight: typography.fontWeight.extrabold,
                  color: cssVars.textInverse,
                }}
              >
                W
              </div>
              <span>WorkFlow</span>
            </Link>
            <p
              style={{
                color: cssVars.textMuted,
                fontSize: typography.fontSize.base,
                lineHeight: typography.lineHeight.relaxed,
                margin: 0,
              }}
            >
              Projelerinizi ve gorevlerinizi kolayca yonetin. Modern, hizli ve kullanici dostu
              is takip sistemi.
            </p>
          </div>

          {/* Hizli Linkler */}
          <div>
            <h4
              style={{
                color: cssVars.textMain,
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.semibold,
                marginBottom: spacing[4],
                marginTop: 0,
              }}
            >
              Hizli Erisim
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: spacing[2.5] }}>
              <Link
                to="/"
                style={footerLinkStyle}
                onMouseEnter={footerLinkHoverHandler}
                onMouseLeave={footerLinkLeaveHandler}
              >
                Ana Sayfa
              </Link>
              <Link
                to="/boards"
                style={footerLinkStyle}
                onMouseEnter={footerLinkHoverHandler}
                onMouseLeave={footerLinkLeaveHandler}
              >
                Panolarim
              </Link>
              <Link
                to="/calendar"
                style={footerLinkStyle}
                onMouseEnter={footerLinkHoverHandler}
                onMouseLeave={footerLinkLeaveHandler}
              >
                Takvim
              </Link>
              <Link
                to="/profile"
                style={footerLinkStyle}
                onMouseEnter={footerLinkHoverHandler}
                onMouseLeave={footerLinkLeaveHandler}
              >
                Profil
              </Link>
            </div>
          </div>

          {/* Destek */}
          <div>
            <h4
              style={{
                color: cssVars.textMain,
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.semibold,
                marginBottom: spacing[4],
                marginTop: 0,
              }}
            >
              Destek
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: spacing[2.5] }}>
              <Link
                to="/settings"
                style={footerLinkStyle}
                onMouseEnter={footerLinkHoverHandler}
                onMouseLeave={footerLinkLeaveHandler}
              >
                Ayarlar
              </Link>
              <a
                href="mailto:destek@workflow.app"
                style={footerLinkStyle}
                onMouseEnter={footerLinkHoverHandler}
                onMouseLeave={footerLinkLeaveHandler}
              >
                Bize Ulasin
              </a>
              <a
                href="#"
                style={footerLinkStyle}
                onMouseEnter={footerLinkHoverHandler}
                onMouseLeave={footerLinkLeaveHandler}
              >
                SSS
              </a>
              <a
                href="#"
                style={footerLinkStyle}
                onMouseEnter={footerLinkHoverHandler}
                onMouseLeave={footerLinkLeaveHandler}
              >
                Gizlilik Politikasi
              </a>
            </div>
          </div>

          {/* Sosyal Medya */}
          <div>
            <h4
              style={{
                color: cssVars.textMain,
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.semibold,
                marginBottom: spacing[4],
                marginTop: 0,
              }}
            >
              Bizi Takip Edin
            </h4>
            <div style={{ display: "flex", gap: spacing[2] }}>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                style={socialButtonStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = cssVars.primary;
                  e.currentTarget.style.color = cssVars.primary;
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = cssVars.border;
                  e.currentTarget.style.color = cssVars.textMuted;
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <Github size={parseInt(sizes.iconMd)} />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                style={socialButtonStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = cssVars.primary;
                  e.currentTarget.style.color = cssVars.primary;
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = cssVars.border;
                  e.currentTarget.style.color = cssVars.textMuted;
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <Twitter size={parseInt(sizes.iconMd)} />
              </a>
              <a
                href="mailto:info@workflow.app"
                style={socialButtonStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = cssVars.primary;
                  e.currentTarget.style.color = cssVars.primary;
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = cssVars.border;
                  e.currentTarget.style.color = cssVars.textMuted;
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <Mail size={parseInt(sizes.iconMd)} />
              </a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            height: "1px",
            background: cssVars.border,
            marginBottom: spacing[6],
          }}
        />

        {/* Alt Kisim - Copyright */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: spacing[4],
          }}
        >
          <p
            style={{
              color: cssVars.textMuted,
              fontSize: typography.fontSize.md,
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: spacing[1],
            }}
          >
            © {currentYear} WorkFlow. Tum haklar saklidir.
          </p>
          <p
            style={{
              color: cssVars.textMuted,
              fontSize: typography.fontSize.md,
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: spacing[1],
            }}
          >
            <Heart size={12} style={{ color: colors.semantic.danger }} />
            ile yapildi
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Layout;
