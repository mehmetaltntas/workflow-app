import React from "react";
import type { Board } from "../types";
import { STATUS_COLORS, STATUS_LABELS } from "../constants";
import { ExternalLink, Calendar, User } from "lucide-react";
import { ActionMenu } from "./ActionMenu";

interface BoardCardProps {
  board: Board;
  onClick: () => void;
  onStatusChange: (board: Board, newStatus: string) => void;
  onEdit: () => void;
  onDelete: () => void;
}

const BoardCard: React.FC<BoardCardProps> = ({ board, onClick, onStatusChange, onEdit, onDelete }) => {
  const statusColor = STATUS_COLORS[board.status || "PLANLANDI"] || "var(--border)";

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();
    onStatusChange(board, e.target.value);
  };


  return (
    <div
      onClick={onClick}
      className="group relative"
      style={{
        background: "rgba(12, 12, 14, 0.4)",
        height: "180px",
        borderRadius: "24px",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        border: "1px solid rgba(255, 255, 255, 0.03)",
        cursor: "pointer",
        transition: "all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)",
        overflow: "hidden"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.backgroundColor = "rgba(18, 18, 20, 0.6)";
        e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
        e.currentTarget.style.boxShadow = "0 20px 40px rgba(0, 0, 0, 0.4)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.backgroundColor = "rgba(12, 12, 14, 0.4)";
        e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.03)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Accent Line */}
      <div style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        right: 0, 
        height: '3px', 
        background: statusColor,
        opacity: 0.4
      }} />

      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: '12px' }}>
          <h3
            style={{
              fontSize: "19px",
              fontWeight: "700",
              color: "white",
              margin: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "80%",
              letterSpacing: '-0.03em'
            }}
          >
            {board.name}
          </h3>
          
          {/* Action Menu (Ghost Trigger) */}
          <div style={{ position: "absolute", top: "16px", right: "16px", zIndex: 20 }}>
             <ActionMenu 
                onEdit={onEdit}
                onDelete={onDelete}
             />
          </div>
        </div>



        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '13px', fontWeight: '500' }}>
          <User size={14} style={{ opacity: 0.5 }} />
          <span>{board.ownerName}</span>
        </div>

        <div style={{marginTop: "20px", display: "flex", gap: "10px", flexWrap: "wrap"}}>
            {board.link && (
                <a href={board.link} target="_blank" rel="noopener noreferrer" 
                   onClick={(e) => e.stopPropagation()}
                   style={{
                     display: "flex", 
                     alignItems: "center", 
                     gap: "6px", 
                     fontSize: "11px", 
                     color: "#4dabf7",
                     backgroundColor: 'rgba(77, 171, 247, 0.08)',
                     padding: '5px 12px',
                     borderRadius: '10px',
                     textDecoration: 'none',
                     fontWeight: '700',
                     border: '1px solid rgba(77, 171, 247, 0.15)',
                     transition: 'all 0.2s'
                   }}
                   onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(77, 171, 247, 0.15)'}
                   onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(77, 171, 247, 0.08)'}
                >
                    <ExternalLink size={12} /> Link
                </a>
            )}
            {board.deadline && (
                 <span style={{
                   display: "flex", 
                   alignItems: "center", 
                   gap: "6px", 
                   fontSize: "11px", 
                   color: "rgba(255, 255, 255, 0.5)",
                   backgroundColor: 'rgba(255, 255, 255, 0.03)',
                   padding: '5px 12px',
                   borderRadius: '10px',
                   border: '1px solid rgba(255, 255, 255, 0.05)',
                   fontWeight: '600'
                 }}>
                    <Calendar size={12} /> {new Date(board.deadline).toLocaleDateString()}
                </span>
            )}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <div onClick={(e) => e.stopPropagation()}>
             <select
                value={board.status || "PLANLANDI"}
                onChange={handleStatusChange}
                style={{
                    fontSize: "10px",
                    padding: "6px 14px",
                    borderRadius: "12px",
                    border: `1px solid ${statusColor}33`,
                    background: `${statusColor}08`,
                    color: statusColor,
                    fontWeight: "800",
                    cursor: "pointer",
                    outline: "none",
                    transition: 'all 0.2s',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `${statusColor}15`;
                  e.currentTarget.style.borderColor = statusColor;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = `${statusColor}08`;
                  e.currentTarget.style.borderColor = `${statusColor}33`;
                }}
             >
                {Object.keys(STATUS_LABELS).map((key) => (
                    <option key={key} value={key} style={{color: "black"}}>{STATUS_LABELS[key]}</option>
                ))}
            </select>
        </div>
      </div>
    </div>
  );
};

export default BoardCard;


