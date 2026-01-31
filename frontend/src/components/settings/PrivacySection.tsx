import { useState, useEffect } from "react";
import {
  EyeOff,
  Globe,
  Shield,
  Check,
  Save,
} from "lucide-react";
import { userService } from "../../services/api";
import toast from "react-hot-toast";
import { typography, spacing, radius, colors, cssVars, animation } from '../../styles/tokens';
import type { PrivacyMode, GranularPrivacySettings } from '../../types';

interface PrivacySectionProps {
  userId: number;
}

const PrivacySection = ({ userId }: PrivacySectionProps) => {
  const [privacyMode, setPrivacyMode] = useState<PrivacyMode>('HIDDEN');
  const [originalPrivacyMode, setOriginalPrivacyMode] = useState<PrivacyMode>('HIDDEN');
  const [granularSettings, setGranularSettings] = useState<GranularPrivacySettings>({
    showProfilePicture: true,
    showOverallProgress: true,
    showBoardStats: true,
    showListStats: true,
    showTaskStats: true,
    showSubtaskStats: true,
    showTeamBoardStats: true,
    showTopCategories: true,
    showConnectionCount: true,
  });
  const [originalGranularSettings, setOriginalGranularSettings] = useState<GranularPrivacySettings>({
    showProfilePicture: true,
    showOverallProgress: true,
    showBoardStats: true,
    showListStats: true,
    showTaskStats: true,
    showSubtaskStats: true,
    showTeamBoardStats: true,
    showTopCategories: true,
    showConnectionCount: true,
  });
  const [isSavingPrivacy, setIsSavingPrivacy] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch privacy settings
  useEffect(() => {
    const fetchPrivacy = async () => {
      try {
        const privacyData = await userService.getPrivacySettings(userId);
        setPrivacyMode(privacyData.privacyMode);
        setOriginalPrivacyMode(privacyData.privacyMode);
        if (privacyData.privacyMode === 'PRIVATE') {
          const gs: GranularPrivacySettings = {
            showProfilePicture: privacyData.showProfilePicture ?? true,
            showOverallProgress: privacyData.showOverallProgress ?? true,
            showBoardStats: privacyData.showBoardStats ?? true,
            showListStats: privacyData.showListStats ?? true,
            showTaskStats: privacyData.showTaskStats ?? true,
            showSubtaskStats: privacyData.showSubtaskStats ?? true,
            showTeamBoardStats: privacyData.showTeamBoardStats ?? true,
            showTopCategories: privacyData.showTopCategories ?? true,
            showConnectionCount: privacyData.showConnectionCount ?? true,
          };
          setGranularSettings(gs);
          setOriginalGranularSettings({ ...gs });
        }
      } catch {
        // Privacy data unavailable, use defaults
      } finally {
        setIsLoading(false);
      }
    };
    fetchPrivacy();
  }, [userId]);

  const hasPrivacyChanges = privacyMode !== originalPrivacyMode ||
    (privacyMode === 'PRIVATE' && JSON.stringify(granularSettings) !== JSON.stringify(originalGranularSettings));

  const handleSavePrivacy = async () => {
    setIsSavingPrivacy(true);
    try {
      const data: { privacyMode: PrivacyMode; granularSettings?: Partial<GranularPrivacySettings> } = {
        privacyMode,
      };
      if (privacyMode === 'PRIVATE') {
        data.granularSettings = granularSettings;
      }
      await userService.updatePrivacy(userId, data);
      setOriginalPrivacyMode(privacyMode);
      setOriginalGranularSettings({ ...granularSettings });

      const labels: Record<PrivacyMode, string> = {
        HIDDEN: 'Profil gizli yapıldı',
        PUBLIC: 'Profil herkese açık yapıldı',
        PRIVATE: 'Özel gizlilik ayarları kaydedildi',
      };
      toast.success(labels[privacyMode]);
    } catch {
      toast.error('Gizlilik ayarı güncellenemedi');
    } finally {
      setIsSavingPrivacy(false);
    }
  };

  const updateGranularSetting = (key: keyof GranularPrivacySettings) => {
    setGranularSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (isLoading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "300px",
      }}>
        <div style={{
          width: spacing[10],
          height: spacing[10],
          border: `3px solid ${colors.brand.primaryLight}`,
          borderTopColor: colors.brand.primary,
          borderRadius: radius.full,
          animation: "spin 1s linear infinite",
        }} />
      </div>
    );
  }

  return (
    <div style={{ padding: spacing[8] }}>
      {/* Section Header */}
      <div style={{
        marginBottom: spacing[8],
        paddingBottom: spacing[6],
        borderBottom: `1px solid ${cssVars.border}`,
      }}>
        <h2 style={{
          fontSize: typography.fontSize["2xl"],
          fontWeight: typography.fontWeight.semibold,
          color: cssVars.textMain,
          margin: 0,
          marginBottom: spacing[1],
        }}>
          Gizlilik Ayarları
        </h2>
        <p style={{
          fontSize: typography.fontSize.base,
          color: cssVars.textMuted,
          margin: 0,
        }}>
          Profilinizin görünürlüğünü yönetin
        </p>
      </div>

      {/* Privacy Mode Selector - 3 cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: spacing[3], marginBottom: spacing[6] }}>
        {([
          { mode: 'HIDDEN' as PrivacyMode, icon: EyeOff, label: 'Gizli', description: 'Profiliniz tamamen gizli. Sadece bağlantılarınız görebilir.' },
          { mode: 'PUBLIC' as PrivacyMode, icon: Globe, label: 'Herkese Açık', description: 'Profiliniz tüm kullanıcılar tarafından görülebilir.' },
          { mode: 'PRIVATE' as PrivacyMode, icon: Shield, label: 'Özel', description: 'Hangi bilgilerin görünür olacağını seçin.' },
        ]).map(({ mode, icon: Icon, label, description }) => {
          const isSelected = privacyMode === mode;
          return (
            <button
              key={mode}
              onClick={() => setPrivacyMode(mode)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: spacing[4],
                padding: spacing[5],
                background: isSelected ? colors.brand.primaryLight : cssVars.bgHover,
                border: `2px solid ${isSelected ? colors.brand.primary : "transparent"}`,
                borderRadius: radius.lg,
                cursor: "pointer",
                textAlign: "left",
                transition: `all ${animation.duration.normal} ${animation.easing.smooth}`,
              }}
              onMouseEnter={(e) => {
                if (!isSelected) e.currentTarget.style.borderColor = cssVars.border;
              }}
              onMouseLeave={(e) => {
                if (!isSelected) e.currentTarget.style.borderColor = "transparent";
              }}
            >
              <div style={{
                width: "44px",
                height: "44px",
                borderRadius: radius.lg,
                background: isSelected ? colors.brand.primary : cssVars.bgBody,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: `all ${animation.duration.normal} ${animation.easing.smooth}`,
              }}>
                <Icon size={20} color={isSelected ? cssVars.textInverse : cssVars.textMuted} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: typography.fontSize.lg,
                  fontWeight: typography.fontWeight.semibold,
                  color: isSelected ? colors.brand.primary : cssVars.textMain,
                  marginBottom: spacing[0.5],
                }}>
                  {label}
                </div>
                <div style={{
                  fontSize: typography.fontSize.base,
                  color: cssVars.textMuted,
                }}>
                  {description}
                </div>
              </div>
              {/* Radio indicator */}
              <div style={{
                width: "22px",
                height: "22px",
                borderRadius: radius.full,
                border: `2px solid ${isSelected ? colors.brand.primary : cssVars.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: `all ${animation.duration.normal} ${animation.easing.smooth}`,
              }}>
                {isSelected && (
                  <div style={{
                    width: "12px",
                    height: "12px",
                    borderRadius: radius.full,
                    background: colors.brand.primary,
                  }} />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Granular Settings (shown only when PRIVATE) */}
      {privacyMode === 'PRIVATE' && (
        <div style={{
          background: cssVars.bgHover,
          borderRadius: radius.lg,
          padding: spacing[5],
          display: "flex",
          flexDirection: "column",
          gap: spacing[3],
          marginBottom: spacing[6],
        }}>
          <h3 style={{
            fontSize: typography.fontSize.lg,
            fontWeight: typography.fontWeight.semibold,
            color: cssVars.textMain,
            margin: 0,
            marginBottom: spacing[2],
          }}>
            Detaylı Ayarlar
          </h3>
          <p style={{
            fontSize: typography.fontSize.base,
            color: cssVars.textMuted,
            margin: 0,
            marginBottom: spacing[2],
          }}>
            Profilinizde hangi bilgilerin görüneceğini seçin
          </p>

          {([
            { key: 'showProfilePicture' as keyof GranularPrivacySettings, label: 'Profil Resmi', description: 'Profil resminiz diğer kullanıcılara gösterilsin' },
            { key: 'showConnectionCount' as keyof GranularPrivacySettings, label: 'Bağlantı Sayısı', description: 'Bağlantı sayınız profilde görünsün' },
            { key: 'showOverallProgress' as keyof GranularPrivacySettings, label: 'Genel İlerleme', description: 'Genel ilerleme yüzdesi ve çubuğu gösterilsin' },
            { key: 'showBoardStats' as keyof GranularPrivacySettings, label: 'Pano İstatistikleri', description: 'Toplam pano sayısı ve durum dağılımı gösterilsin' },
            { key: 'showListStats' as keyof GranularPrivacySettings, label: 'Liste İstatistikleri', description: 'Toplam ve tamamlanan liste sayısı gösterilsin' },
            { key: 'showTaskStats' as keyof GranularPrivacySettings, label: 'Görev İstatistikleri', description: 'Toplam ve tamamlanan görev sayısı gösterilsin' },
            { key: 'showSubtaskStats' as keyof GranularPrivacySettings, label: 'Alt Görev İstatistikleri', description: 'Toplam ve tamamlanan alt görev sayısı gösterilsin' },
            { key: 'showTeamBoardStats' as keyof GranularPrivacySettings, label: 'Ekip Panosu İstatistikleri', description: 'Ekip ve bireysel pano sayıları gösterilsin' },
            { key: 'showTopCategories' as keyof GranularPrivacySettings, label: 'Popüler Kategoriler', description: 'En çok kullanılan pano kategorileri gösterilsin' },
          ]).map(({ key, label, description }) => {
            const isOn = granularSettings[key];
            return (
              <div
                key={key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: `${spacing[3]} ${spacing[4]}`,
                  background: cssVars.bgCard,
                  borderRadius: radius.md,
                  border: `1px solid ${cssVars.border}`,
                }}
              >
                <div style={{ flex: 1, marginRight: spacing[4] }}>
                  <div style={{
                    fontSize: typography.fontSize.base,
                    fontWeight: typography.fontWeight.semibold,
                    color: cssVars.textMain,
                    marginBottom: spacing[0.5],
                  }}>
                    {label}
                  </div>
                  <div style={{
                    fontSize: typography.fontSize.sm,
                    color: cssVars.textMuted,
                  }}>
                    {description}
                  </div>
                </div>
                <button
                  onClick={() => updateGranularSetting(key)}
                  style={{
                    width: "44px",
                    height: "24px",
                    borderRadius: "12px",
                    border: "none",
                    background: isOn ? colors.brand.primary : cssVars.bgBody,
                    cursor: "pointer",
                    position: "relative",
                    transition: `background ${animation.duration.normal} ${animation.easing.smooth}`,
                    boxShadow: isOn ? "none" : `inset 0 0 0 1px ${cssVars.border}`,
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: "18px",
                      height: "18px",
                      borderRadius: "50%",
                      background: "white",
                      position: "absolute",
                      top: "3px",
                      left: isOn ? "23px" : "3px",
                      transition: `left ${animation.duration.normal} ${animation.easing.smooth}`,
                      boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                    }}
                  />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Save Button */}
      <div style={{
        paddingTop: spacing[6],
        borderTop: `1px solid ${cssVars.border}`,
        display: "flex",
        justifyContent: "flex-end",
      }}>
        <button
          onClick={handleSavePrivacy}
          disabled={isSavingPrivacy || !hasPrivacyChanges}
          className="btn btn-primary"
          style={{
            padding: `${spacing[3]} ${spacing[6]}`,
            fontSize: typography.fontSize.lg,
            fontWeight: typography.fontWeight.semibold,
            opacity: !hasPrivacyChanges ? 0.5 : 1,
            cursor: !hasPrivacyChanges ? "not-allowed" : "pointer",
            minWidth: "180px",
          }}
        >
          {isSavingPrivacy ? (
            <>
              <div style={{
                width: "16px",
                height: "16px",
                border: `2px solid ${cssVars.borderSubtle}`,
                borderTopColor: cssVars.textInverse,
                borderRadius: radius.full,
                animation: "spin 1s linear infinite",
              }} />
              Kaydediliyor...
            </>
          ) : hasPrivacyChanges ? (
            <>
              <Save size={16} />
              Kaydet
            </>
          ) : (
            <>
              <Check size={16} />
              Kaydedildi
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default PrivacySection;
