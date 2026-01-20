import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Toaster } from "react-hot-toast"; // EKLENDİ
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import BoardsPage from "./pages/BoardsPage";
import BoardDetailPage from "./pages/BoardDetailPage";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";

// Kimlik doğrulama ve yönlendirme kontrolcüsü
const AuthCheck = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const path = location.pathname;

    if (token) {
      // Eğer kullanıcı giriş yapmışsa ve Login sayfasına gidiyorsa -> Ana sayfaya at
      if (path === "/login") {
        navigate("/", { replace: true });
      }
    } else {
      // Token yoksa ve Root'a gidiyorsa -> Login'e at
      if (path === "/") {
        navigate("/login", { replace: true });
      }
      // Not: Diğer korumalı rotalar (boards/*) api.ts interceptor'ı veya 
      // sayfa içi kontrollerle (BoardsPage'deki useEffect gibi) yönetiliyor.
    }
  }, [navigate, location]);

  return null;
};

function App() {
  return (
    <BrowserRouter>
      <AuthCheck />
      
      {/* Bildirimlerin çıkacağı yer */}
      <Toaster
        position="top-center"
        toastOptions={{
          style: { background: "#333", color: "#fff" },
        }}
      />

      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Layout ile sarmalanmış rotalar */}
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/boards" element={<BoardsPage />} />
          <Route path="/boards/:slug" element={<BoardDetailPage />} />
          <Route path="/profile" element={<div style={{padding: "40px"}}><h2>Profil (Yapım Aşamasında)</h2></div>} />
          <Route path="/settings" element={<div style={{padding: "40px"}}><h2>Ayarlar (Yapım Aşamasında)</h2></div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
