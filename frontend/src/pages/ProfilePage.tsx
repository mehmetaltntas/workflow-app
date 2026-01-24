import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const ProfilePage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Profil ayarları artık Ayarlar sayfasında
    // Kullanıcıyı otomatik olarak ayarlar sayfasına yönlendir
    navigate("/settings", { replace: true });
  }, [navigate]);

  return null;
};

export default ProfilePage;
