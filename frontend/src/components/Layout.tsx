import { useState, useRef, useEffect } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, Home, Settings, LogOut, ChevronDown, Sun, Moon, Calendar, User, Users, UserCheck, Bell, Github, Twitter, Mail, Heart, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import { authService, userService } from "../services/api";
import { useTheme } from "../contexts/ThemeContext";
import { sizes } from "../styles/tokens";
import { useAuthStore } from "../stores/authStore";
import UserSearchBar from "./UserSearchBar";
import NotificationBell from "./NotificationBell";
import "./Layout.css";

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(location.pathname);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sayfa degisince dropdown'i kapat (State adjustment during render)
  if (location.pathname !== prevPathname) {
    setPrevPathname(location.pathname);
    setIsDropdownOpen(false);
  }

  // authStore'dan kullanici bilgilerini al
  const { username: storedUsername, firstName, lastName, logout, deletionScheduledAt, userId, setDeletionScheduledAt } = useAuthStore();
  const username = storedUsername || "Kullanıcı";
  // Avatar icin bas harfler
  const initials = firstName && lastName
    ? `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
    : username.substring(0, 2).toUpperCase();

  // Board detay sayfasinda miyiz? (/boards/:slug formatinda)
  const isBoardDetailPage = /^\/boards\/(info\/)?[^/]+$/.test(location.pathname);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.warn("Logout API hatasi:", error);
    } finally {
      logout();
      toast.success("Çıkış yapıldı");
      navigate("/login");
    }
  };

  // Dropdown disina tiklaninca kapat
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

  const handleCancelDeletionFromBanner = async () => {
    if (!userId) return;
    try {
      await userService.cancelDeletion(userId);
      setDeletionScheduledAt(null);
      toast.success("Hesap silme işlemi iptal edildi");
    } catch {
      toast.error("İptal işlemi başarısız");
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="layout">
      {/* Modern Navbar */}
      <nav className="layout__navbar">
        {/* Sol Taraf: Logo ve Navigasyon */}
        <div className="layout__nav-left">
          {/* Logo */}
          <Link to="/" className="layout__logo-link">
            <div className="layout__logo-icon">W</div>
            <span>WorkFlow</span>
          </Link>

          {/* Divider */}
          <div className="layout__nav-divider" />

          {/* Navigation Pills */}
          <div className="layout__nav-pills">
            <Link to="/home" className={`nav-pill ${isActive("/home") ? "active" : ""}`}>
              <Home size={16} strokeWidth={2} />
              <span>Ana Sayfa</span>
            </Link>
            <Link to="/boards" className={`nav-pill ${isActive("/boards") ? "active" : ""}`}>
              <LayoutDashboard size={16} strokeWidth={2} />
              <span>Panolarım</span>
            </Link>
            <Link to="/calendar" className={`nav-pill ${isActive("/calendar") ? "active" : ""}`}>
              <Calendar size={16} strokeWidth={2} />
              <span>Takvim</span>
            </Link>
            <Link to="/profile" className={`nav-pill ${isActive("/profile") ? "active" : ""}`}>
              <User size={16} strokeWidth={2} />
              <span>Profil</span>
            </Link>
            <Link to="/connections" className={`nav-pill ${isActive("/connections") ? "active" : ""}`}>
              <Users size={16} strokeWidth={2} />
              <span>Ağım</span>
            </Link>
            <Link to="/team" className={`nav-pill ${isActive("/team") ? "active" : ""}`}>
              <UserCheck size={16} strokeWidth={2} />
              <span>Ekip</span>
            </Link>
            <Link to="/notifications" className={`nav-pill ${isActive("/notifications") ? "active" : ""}`}>
              <Bell size={16} strokeWidth={2} />
              <span>Bildirimler</span>
            </Link>
          </div>
        </div>

        {/* Sag Taraf: Arama, Bildirim, Theme Toggle ve Kullanici Profili */}
        <div className="layout__nav-right">
          {/* User Search Bar */}
          <UserSearchBar />

          {/* Notification Bell */}
          <NotificationBell />

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="layout__theme-toggle"
            title={theme === "dark" ? "Açık Tema" : "Koyu Tema"}
          >
            {theme === "dark" ? <Sun size={parseInt(sizes.iconMd)} /> : <Moon size={parseInt(sizes.iconMd)} />}
          </button>

          {/* User Profile Dropdown */}
          <div className="layout__profile-wrapper" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`layout__profile-btn ${isDropdownOpen ? "layout__profile-btn--open" : ""}`}
            >
              {/* Modern Avatar */}
              <div className="user-avatar">
                {initials}
              </div>
              <span className="layout__profile-username">
                Ben
              </span>
              <ChevronDown
                size={parseInt(sizes.iconSm)}
                className={`layout__profile-chevron ${isDropdownOpen ? "layout__profile-chevron--open" : ""}`}
              />
            </button>

            {/* Modern User Dropdown */}
            {isDropdownOpen && (
              <div className="menu-dropdown" style={{ right: 0, top: "120%", minWidth: "200px" }}>
                {/* User Info Header */}
                <div className="layout__dropdown-header">
                  <div className="layout__dropdown-username">{username}</div>
                  <div className="layout__dropdown-subtitle">Hesabınızı yönetin</div>
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
                  <span>Ayarlar ve Gizlilik</span>
                </Link>

                <div className="menu-divider" />

                <button onClick={handleLogout} className="menu-item menu-item--danger">
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

      {/* Deletion Banner */}
      {deletionScheduledAt && (() => {
        const scheduledDate = new Date(deletionScheduledAt);
        const deleteDate = new Date(scheduledDate);
        deleteDate.setDate(deleteDate.getDate() + 30);
        const now = new Date();
        const diffTime = deleteDate.getTime() - now.getTime();
        const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        return (
          <div className="layout__deletion-banner">
            <div className="layout__deletion-banner-content">
              <AlertTriangle size={16} />
              <span>
                Hesabınız {diffDays} gün içinde silinecek.
              </span>
              <button
                onClick={handleCancelDeletionFromBanner}
                className="layout__deletion-banner-cancel"
              >
                İptal Et
              </button>
            </div>
          </div>
        );
      })()}

      {/* Sayfa Icerigi */}
      <main className="layout__main">
        <div className="layout__content">
          <Outlet />
        </div>

        {/* Footer - Board detay sayfasi haric goster */}
        {!isBoardDetailPage && <Footer />}
      </main>
    </div>
  );
};

// Footer Component
const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="layout__footer">
      <div className="layout__footer-inner">
        {/* Ust Kisim */}
        <div className="layout__footer-grid">
          {/* Logo ve Aciklama */}
          <div className="layout__footer-brand">
            <Link to="/" className="layout__footer-logo">
              <div className="layout__footer-logo-icon">W</div>
              <span>WorkFlow</span>
            </Link>
            <p className="layout__footer-description">
              Projelerinizi ve görevlerinizi kolayca yönetin. Modern, hızlı ve kullanıcı dostu
              iş takip sistemi.
            </p>
          </div>

          {/* Hizli Linkler */}
          <div>
            <h4 className="layout__footer-section-title">Hızlı Erişim</h4>
            <div className="layout__footer-links">
              <Link to="/" className="layout__footer-link">Ana Sayfa</Link>
              <Link to="/boards" className="layout__footer-link">Panolarım</Link>
              <Link to="/calendar" className="layout__footer-link">Takvim</Link>
              <Link to="/profile" className="layout__footer-link">Profil</Link>
              <Link to="/connections" className="layout__footer-link">Ağım</Link>
              <Link to="/team" className="layout__footer-link">Ekip</Link>
              <Link to="/notifications" className="layout__footer-link">Bildirimler</Link>
            </div>
          </div>

          {/* Destek */}
          <div>
            <h4 className="layout__footer-section-title">Destek</h4>
            <div className="layout__footer-links">
              <Link to="/settings" className="layout__footer-link">Ayarlar</Link>
              <a href="mailto:destek@workflow.app" className="layout__footer-link">Bize Ulaşın</a>
              <a href="#" className="layout__footer-link">SSS</a>
              <a href="#" className="layout__footer-link">Gizlilik Politikası</a>
            </div>
          </div>

          {/* Sosyal Medya */}
          <div>
            <h4 className="layout__footer-section-title">Bizi Takip Edin</h4>
            <div className="layout__social-buttons">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="layout__social-btn">
                <Github size={parseInt(sizes.iconMd)} />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="layout__social-btn">
                <Twitter size={parseInt(sizes.iconMd)} />
              </a>
              <a href="mailto:info@workflow.app" className="layout__social-btn">
                <Mail size={parseInt(sizes.iconMd)} />
              </a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="layout__footer-divider" />

        {/* Alt Kisim - Copyright */}
        <div className="layout__footer-bottom">
          <p className="layout__footer-copyright">
            &copy; {currentYear} WorkFlow. Tüm haklar saklıdır.
          </p>
          <p className="layout__footer-copyright">
            <Heart size={12} className="layout__footer-heart" />
            ile yapıldı
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Layout;
