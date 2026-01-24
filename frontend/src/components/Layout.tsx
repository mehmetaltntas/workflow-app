import { useState, useRef, useEffect } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, Home, Settings, LogOut, ChevronDown, Sun, Moon, Calendar } from "lucide-react";
import toast from "react-hot-toast";
import { authService } from "../services/api";
import { useTheme } from "../contexts/ThemeContext";
import { typography, spacing, radius, sizes, zIndex, animation, cssVars, colors } from "../styles/tokens";

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

  const username = localStorage.getItem("username") || "Kullanıcı";
  // Avatar için baş harfler
  const initials = username.substring(0, 2).toUpperCase();

  const handleLogout = async () => {
    try {
      // Backend'de refresh token'ı geçersiz kıl
      await authService.logout();
    } catch (error) {
      // Logout API hatası olsa bile devam et
      console.warn("Logout API hatası:", error);
    } finally {
      // Her durumda localStorage'ı temizle ve yönlendir
      localStorage.clear();
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
      </main>
    </div>
  );
};

export default Layout;
