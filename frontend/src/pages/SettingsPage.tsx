import { useState } from "react";
import {
  User,
  Shield,
  Settings,
  ChevronRight,
  Globe,
  Trash2,
} from "lucide-react";
import { typography, spacing, radius, colors, cssVars, animation } from '../styles/tokens';
import { useAuthStore } from '../stores/authStore';
import ProfileSection from '../components/settings/ProfileSection';
import PrivacySection from '../components/settings/PrivacySection';
import SecuritySection from '../components/settings/SecuritySection';
import AccountSection from '../components/settings/AccountSection';

type SettingsSection = 'profile' | 'security' | 'privacy' | 'account';

const SettingsPage = () => {
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile');

  const userId = useAuthStore((state) => state.userId);
  const login = useAuthStore((state) => state.login);
  const deletionScheduledAt = useAuthStore((state) => state.deletionScheduledAt);
  const setDeletionScheduledAt = useAuthStore((state) => state.setDeletionScheduledAt);

  const menuItems = [
    { id: 'profile' as const, label: 'Profil', icon: User, description: 'Profil bilgilerinizi düzenleyin' },
    { id: 'privacy' as const, label: 'Gizlilik', icon: Globe, description: 'Profil gizlilik ayarlari' },
    { id: 'security' as const, label: 'Güvenlik', icon: Shield, description: 'Şifre ve güvenlik ayarları' },
    { id: 'account' as const, label: 'Hesap', icon: Trash2, description: 'Hesap silme işlemleri' },
  ];

  if (!userId) {
    return null;
  }

  return (
    <div style={{
      maxWidth: "1000px",
      margin: "0 auto",
      padding: `${spacing[8]} ${spacing[6]}`,
    }}>
      {/* Page Header */}
      <div style={{
        marginBottom: spacing[8],
        paddingBottom: spacing[6],
        borderBottom: `1px solid ${cssVars.border}`,
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: spacing[3],
          marginBottom: spacing[2],
        }}>
          <div style={{
            width: "48px",
            height: "48px",
            borderRadius: radius.lg,
            background: colors.brand.primaryLight,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <Settings size={24} color={colors.brand.primary} />
          </div>
          <div>
            <h1 style={{
              fontSize: typography.fontSize["4xl"],
              fontWeight: typography.fontWeight.bold,
              color: cssVars.textMain,
              margin: 0,
            }}>
              Ayarlar
            </h1>
            <p style={{
              fontSize: typography.fontSize.lg,
              color: cssVars.textMuted,
              margin: 0,
            }}>
              Hesap ve uygulama ayarlarınızı yönetin
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "260px 1fr",
        gap: spacing[6],
      }}>
        {/* Sidebar Navigation */}
        <nav style={{
          display: "flex",
          flexDirection: "column",
          gap: spacing[1],
        }}>
          {menuItems.map((item) => {
            const isActive = activeSection === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: spacing[3],
                  padding: `${spacing[3]} ${spacing[4]}`,
                  background: isActive ? colors.brand.primaryLight : "transparent",
                  border: "none",
                  borderRadius: radius.lg,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: `all ${animation.duration.normal} ${animation.easing.smooth}`,
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = cssVars.bgHover;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                <div style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: radius.md,
                  background: isActive ? colors.brand.primary : cssVars.bgHover,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: `all ${animation.duration.normal} ${animation.easing.smooth}`,
                }}>
                  <Icon
                    size={20}
                    color={isActive ? cssVars.textInverse : cssVars.textMuted}
                    style={{ transition: `color ${animation.duration.normal}` }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: typography.fontSize.lg,
                    fontWeight: isActive ? typography.fontWeight.semibold : typography.fontWeight.medium,
                    color: isActive ? colors.brand.primary : cssVars.textMain,
                    marginBottom: spacing[0.5],
                  }}>
                    {item.label}
                  </div>
                  <div style={{
                    fontSize: typography.fontSize.sm,
                    color: cssVars.textMuted,
                  }}>
                    {item.description}
                  </div>
                </div>
                <ChevronRight
                  size={16}
                  color={isActive ? colors.brand.primary : cssVars.textMuted}
                  style={{
                    opacity: isActive ? 1 : 0.5,
                    transition: `opacity ${animation.duration.normal}`,
                  }}
                />
              </button>
            );
          })}
        </nav>

        {/* Content Area */}
        <div style={{
          background: cssVars.bgCard,
          borderRadius: radius.xl,
          border: `1px solid ${cssVars.border}`,
          overflow: "hidden",
        }}>
          {activeSection === 'profile' && (
            <ProfileSection
              userId={userId}
              onProfileUpdated={login}
            />
          )}

          {activeSection === 'privacy' && (
            <PrivacySection userId={userId} />
          )}

          {activeSection === 'security' && (
            <SecuritySection userId={userId} />
          )}

          {activeSection === 'account' && (
            <AccountSection
              userId={userId}
              deletionScheduledAt={deletionScheduledAt}
              onDeletionScheduled={setDeletionScheduledAt}
            />
          )}
        </div>
      </div>

      {/* Spin Animation */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default SettingsPage;
