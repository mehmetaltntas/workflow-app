import { useState, useRef, useEffect } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, Home, User, Settings, LogOut, ChevronDown, Sun, Moon } from "lucide-react";
import toast from "react-hot-toast";
import { authService } from "../services/api";
import { useTheme } from "../contexts/ThemeContext";

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
          height: "64px",
          background: "var(--navbar-bg)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        {/* Sol Taraf: Logo ve Navigasyon */}
        <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
          {/* Logo */}
          <Link
            to="/"
            style={{
              fontSize: "20px",
              fontWeight: "700",
              color: "var(--text-main)",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              letterSpacing: "-0.02em",
            }}
          >
            <div style={{
              width: "32px",
              height: "32px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, var(--primary), #7950f2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "16px",
              fontWeight: "800",
              color: "white",
            }}>
              W
            </div>
            <span>WorkFlow</span>
          </Link>

          {/* Divider */}
          <div style={{
            height: "24px",
            width: "1px",
            background: "var(--border)"
          }} />

          {/* Navigation Pills */}
          <div style={{ display: "flex", gap: "8px" }}>
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
          </div>
        </div>

        {/* Sağ Taraf: Theme Toggle ve Kullanıcı Profili */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginLeft: "auto" }}>
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "40px",
              height: "40px",
              borderRadius: "12px",
              border: "1px solid var(--border)",
              background: "var(--card-bg)",
              color: "var(--text-muted)",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--primary)";
              e.currentTarget.style.color = "var(--primary)";
              e.currentTarget.style.background = "var(--menu-active)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.color = "var(--text-muted)";
              e.currentTarget.style.background = "var(--card-bg)";
            }}
            title={theme === "dark" ? "Açık Tema" : "Koyu Tema"}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* User Profile Dropdown */}
          <div style={{ position: "relative" }} ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              cursor: "pointer",
              padding: "6px 12px",
              borderRadius: "12px",
              background: isDropdownOpen ? "var(--menu-hover)" : "transparent",
              border: "1px solid",
              borderColor: isDropdownOpen ? "var(--border)" : "transparent",
              transition: "all 0.2s ease",
            }}
          >
            {/* Modern Avatar */}
            <div className="user-avatar">
              {initials}
            </div>
            <span style={{ 
              color: "var(--text-main)", 
              fontWeight: "500",
              fontSize: "14px",
            }}>
              {username}
            </span>
            <ChevronDown 
              size={14} 
              style={{ 
                color: "var(--text-muted)",
                transform: isDropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s ease",
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
                padding: "12px",
                borderBottom: "1px solid var(--border)",
                marginBottom: "6px",
              }}>
                <div style={{ 
                  fontSize: "14px", 
                  fontWeight: "600", 
                  color: "var(--text-main)",
                  marginBottom: "2px",
                }}>
                  {username}
                </div>
                <div style={{ 
                  fontSize: "12px", 
                  color: "var(--text-muted)" 
                }}>
                  Hesabınızı yönetin
                </div>
              </div>

              <Link to="/profile" className="menu-item">
                <span className="menu-item-icon">
                  <User size={14} strokeWidth={2} />
                </span>
                <span>Profil</span>
              </Link>
              
              <Link to="/settings" className="menu-item">
                <span className="menu-item-icon">
                  <Settings size={14} strokeWidth={2} />
                </span>
                <span>Ayarlar</span>
              </Link>

              <div className="menu-divider" />

              <button
                onClick={handleLogout}
                className="menu-item menu-item--danger"
              >
                <span className="menu-item-icon">
                  <LogOut size={14} strokeWidth={2} />
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
