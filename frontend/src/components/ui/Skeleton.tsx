import React from "react";
import { cssVars, radius, animation } from "../../styles/tokens";

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = "100%",
  height = "20px",
  borderRadius = radius.md,
  className,
  style,
}) => {
  return (
    <div
      className={className}
      style={{
        width,
        height,
        borderRadius,
        background: `linear-gradient(90deg, ${cssVars.bgSecondary} 25%, var(--bg-hover, rgba(255,255,255,0.1)) 50%, ${cssVars.bgSecondary} 75%)`,
        backgroundSize: "200% 100%",
        animation: `shimmer 1.5s ${animation.easing.easeInOut} infinite`,
        ...style,
      }}
    />
  );
};

export const SkeletonCard: React.FC<{ style?: React.CSSProperties }> = ({ style }) => {
  return (
    <div
      style={{
        background: cssVars.bgCard,
        borderRadius: radius["2xl"],
        padding: "24px",
        height: "190px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        border: `1px solid ${cssVars.border}`,
        ...style,
      }}
    >
      {/* Top - Action menu placeholder */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Skeleton width={32} height={32} borderRadius={radius.md} />
      </div>

      {/* Middle - Title and description */}
      <div style={{ marginTop: "12px" }}>
        <Skeleton width="70%" height={24} style={{ marginBottom: "8px" }} />
        <Skeleton width="90%" height={14} style={{ marginBottom: "4px" }} />
        <Skeleton width="60%" height={14} />
        <div style={{ marginTop: "10px" }}>
          <Skeleton width={120} height={20} borderRadius={radius.full} />
        </div>
      </div>

      {/* Bottom - Deadline and status */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Skeleton width={100} height={28} borderRadius={radius.md} />
        <Skeleton width={90} height={32} borderRadius={radius.lg} />
      </div>
    </div>
  );
};

export const BoardsPageSkeleton: React.FC = () => {
  return (
    <div>
      {/* Status group skeleton */}
      {[1, 2].map((group) => (
        <div key={group} style={{ marginBottom: "40px" }}>
          {/* Group header */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
            <Skeleton width={12} height={12} borderRadius={radius.full} />
            <Skeleton width={150} height={28} />
            <Skeleton width={40} height={20} />
          </div>

          {/* Cards grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "20px",
            }}
          >
            {[1, 2, 3].map((i) => (
              <SkeletonCard
                key={i}
                style={{
                  opacity: 1 - (i - 1) * 0.15,
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Shimmer animation keyframes injected via style tag */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
};

export default Skeleton;
