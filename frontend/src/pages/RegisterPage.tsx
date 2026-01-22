import { useState } from "react";
import { authService } from "../services/api";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const RegisterPage = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // Yükleniyor bildirimi
    const loadingToast = toast.loading("Hesap oluşturuluyor...");

    try {
      const response = await authService.register({
        username,
        email,
        password,
      });

      // Token ve bilgileri kaydet
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("refreshToken", response.data.refreshToken);
      localStorage.setItem("userId", response.data.id);
      localStorage.setItem("username", response.data.username);

      // Başarılı bildirimi
      toast.success("Kayıt Başarılı! Yönlendiriliyorsunuz...", {
        id: loadingToast,
      });

      // Panolara git
      navigate("/boards");
    } catch (err) {
      console.error(err);
      toast.error("Kayıt başarısız! Kullanıcı adı alınmış olabilir.", {
        id: loadingToast,
      });
    }
  };

  return (
    <div
      style={{ display: "flex", justifyContent: "center", marginTop: "100px" }}
    >
      <div
        style={{
          background: "var(--bg-card)",
          padding: "40px",
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
          width: "400px",
          border: "1px solid var(--border)",
        }}
      >
        <h2
          style={{
            marginBottom: "30px",
            textAlign: "center",
            color: "var(--text-main)",
          }}
        >
          WorkFlow Kayıt Ol
        </h2>

        <form
          onSubmit={handleRegister}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          <input
            type="text"
            placeholder="Kullanıcı Adı"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ width: "100%" }} // Global stiller geçerli
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%" }}
          />
          <input
            type="password"
            placeholder="Şifre"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%" }}
          />

          <button
            type="submit"
            className="btn btn-primary"
            style={{ justifyContent: "center", padding: "12px" }}
          >
            KAYIT OL
          </button>
        </form>

        <p
          style={{
            marginTop: "20px",
            textAlign: "center",
            fontSize: "14px",
            color: "var(--text-muted)",
          }}
        >
          Zaten hesabın var mı?{" "}
          <span
            onClick={() => navigate("/login")}
            style={{
              color: "var(--primary)",
              cursor: "pointer",
              fontWeight: "600",
              textDecoration: "none",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.textDecoration = "underline")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.textDecoration = "none")
            }
          >
            Giriş Yap
          </span>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
