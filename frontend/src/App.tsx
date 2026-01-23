import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate, useParams } from "react-router-dom";
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "./contexts/ThemeContext";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import BoardsPage from "./pages/BoardsPage";
import BoardDetailPage from "./pages/BoardDetailPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";

// Miller route redirect helper
const MillerRedirect = () => {
  const { slug } = useParams();
  return <Navigate to={`/boards/${slug}`} replace />;
};

// Kimlik doğrulama ve yönlendirme kontrolcüsü
const AuthCheck = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const path = location.pathname;

    // Public sayfalar - giris gerektirmeyen
    const publicPaths = ["/", "/login", "/register", "/forgot-password"];

    if (token) {
      // Eger kullanici giris yapmissa ve public sayfaya gidiyorsa -> home'a yonlendir
      if (publicPaths.includes(path)) {
        navigate("/home", { replace: true });
      }
    }
    // Token yoksa ve korunmali sayfalara erismeye calisiyorsa
    // api.ts interceptor'i veya sayfa ici kontroller yonetecek
  }, [navigate, location]);

  return null;
};

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthCheck />

        {/* Bildirimlerin çıkacağı yer */}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "var(--bg-card)",
              color: "var(--text-main)",
              border: "1px solid var(--border)",
            },
          }}
        />

        <Routes>
        {/* Public rotalar */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* Layout ile sarmalanmis korunmali rotalar */}
        <Route element={<Layout />}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/boards" element={<BoardsPage />} />
          <Route path="/boards/:slug" element={<BoardDetailPage />} />
          {/* Redirect old Miller route to main board page */}
          <Route path="/boards/:slug/miller" element={<MillerRedirect />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
