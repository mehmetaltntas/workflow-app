import React from "react";
import { AlertTriangle, X } from "lucide-react";

interface Props {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
}

export const ConfirmationModal: React.FC<Props> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Evet, Sil",
  cancelText = "İptal",
  variant = "danger"
}) => {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return {
          icon: <AlertTriangle className="text-red-400" size={24} />,
          buttonClass: "bg-red-500 hover:bg-red-600 text-white",
          iconBg: "rgba(239, 68, 68, 0.08)"
        };
      case "warning":
        return {
          icon: <AlertTriangle className="text-amber-400" size={24} />,
          buttonClass: "bg-amber-500 hover:bg-amber-600 text-white",
          iconBg: "rgba(245, 158, 11, 0.08)"
        };
      default:
        return {
          icon: <AlertTriangle className="text-blue-400" size={24} />,
          buttonClass: "bg-blue-500 hover:bg-blue-600 text-white",
          iconBg: "rgba(59, 130, 246, 0.08)"
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-[1000] p-4"
      style={{ animation: 'fadeIn 0.2s ease-out' }}
    >
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-[8px]" 
        onClick={onCancel} 
      />
      
      <div
        className="relative w-full max-w-[400px] rounded-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
        style={{ 
          background: "#161618",
          animation: 'modalEntrance 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onCancel} 
          className="absolute top-5 right-5 p-2 rounded-xl text-gray-500 hover:bg-white/5 hover:text-white transition-all"
        >
          <X size={18} />
        </button>

        <div className="p-10">
          <div className="flex flex-col items-center text-center">
            <div 
              className="p-5 rounded-2xl mb-6"
              style={{ backgroundColor: styles.iconBg }}
            >
              {styles.icon}
            </div>
            
            <h3 className="text-[22px] font-bold text-white mb-3 tracking-tight">
              {title}
            </h3>
            
            <p className="text-gray-400 text-sm leading-relaxed mb-8 px-2">
              {message}
            </p>

            <div className="flex gap-3 w-full">
              <button
                onClick={onCancel}
                className="flex-1 py-3.5 px-4 rounded-2xl font-bold text-gray-400 bg-white/5 hover:bg-white/10 hover:text-white transition-all border border-white/5 text-sm"
              >
                {cancelText}
              </button>
              <button 
                onClick={onConfirm} 
                className={`flex-1 py-3.5 px-4 rounded-2xl font-bold transition-all shadow-lg text-sm ${styles.buttonClass}`}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalEntrance {
          from { opacity: 0; transform: translateY(10px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
};


