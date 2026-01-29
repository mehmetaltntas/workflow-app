import React, { useState } from "react";
import {
  Users,
  UserPlus,
  X,
  Target,
  ListChecks,
  CheckSquare,
  Layers,
} from "lucide-react";
import type { Board, BoardMember } from "../types";
import { useAuthStore } from "../stores/authStore";
import { useTheme } from "../contexts/ThemeContext";
import { getThemeColors } from "../utils/themeColors";
import { typography, spacing, radius, colors, cssVars, animation } from "../styles/tokens";
import {
  useAddBoardMember,
  useRemoveBoardMember,
  useCreateAssignment,
  useCreateBulkAssignment,
  useRemoveAssignment,
} from "../hooks/queries/useBoardMembers";
import AddBoardMemberModal from "./AddBoardMemberModal";
import AssignMemberModal from "./AssignMemberModal";
import { ConfirmationModal } from "./ConfirmationModal";

interface BoardMembersSectionProps {
  board: Board;
}

const TARGET_TYPE_ICONS: Record<string, React.ReactNode> = {
  LIST: <ListChecks size={12} />,
  TASK: <CheckSquare size={12} />,
  SUBTASK: <Layers size={12} />,
};

const BoardMembersSection: React.FC<BoardMembersSectionProps> = ({ board }) => {
  const { theme } = useTheme();
  const themeColors = getThemeColors(theme);
  const isLight = theme === "light";
  const currentUsername = useAuthStore((s) => s.username);
  const isOwner = board.ownerName === currentUsername;

  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<BoardMember | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<BoardMember | null>(null);

  const addMemberMutation = useAddBoardMember(board.id, board.slug);
  const removeMemberMutation = useRemoveBoardMember(board.id, board.slug);
  const createAssignmentMutation = useCreateAssignment(board.id, board.slug);
  const createBulkAssignmentMutation = useCreateBulkAssignment(board.id, board.slug);
  const removeAssignmentMutation = useRemoveAssignment(board.id, board.slug);

  const members = board.members || [];

  const handleAddMember = async (userId: number) => {
    await addMemberMutation.mutateAsync(userId);
  };

  const handleRemoveMember = (member: BoardMember) => {
    setMemberToRemove(member);
  };

  const handleConfirmRemove = () => {
    if (memberToRemove) {
      removeMemberMutation.mutate(memberToRemove.id);
      setMemberToRemove(null);
    }
  };

  const handleOpenAssign = (member: BoardMember) => {
    setSelectedMember(member);
    setShowAssignModal(true);
  };

  const handleCreateAssignment = (memberId: number, targetType: string, targetId: number) => {
    createAssignmentMutation.mutate({ memberId, targetType, targetId });
  };

  const handleRemoveAssignment = (memberId: number, assignmentId: number) => {
    removeAssignmentMutation.mutate({ memberId, assignmentId });
  };

  const handleCreateBulkAssignment = (memberId: number, assignments: { targetType: string; targetId: number }[]) => {
    createBulkAssignmentMutation.mutate({ memberId, assignments });
  };

  const sectionLabelStyle: React.CSSProperties = {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: cssVars.textMuted,
    textTransform: "uppercase",
    letterSpacing: typography.letterSpacing.wide,
  };

  const cardStyle: React.CSSProperties = {
    padding: spacing[4],
    borderRadius: radius.lg,
    background: isLight ? colors.light.bg.card : colors.dark.glass.bg,
    border: `1px solid ${themeColors.borderDefault}`,
  };

  return (
    <>
      <div style={cardStyle}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: spacing[3],
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: spacing[2] }}>
            <Users size={16} color={colors.brand.primary} />
            <span style={sectionLabelStyle}>Üyeler</span>
            {members.length > 0 && (
              <span
                style={{
                  fontSize: typography.fontSize.xs,
                  fontWeight: typography.fontWeight.bold,
                  color: colors.brand.primary,
                  background: colors.brand.primaryLight,
                  padding: `${spacing[0.5]} ${spacing[2]}`,
                  borderRadius: radius.full,
                }}
              >
                {members.length}
              </span>
            )}
          </div>
          {isOwner && (
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: spacing[1.5],
                padding: `${spacing[1.5]} ${spacing[3]}`,
                borderRadius: radius.lg,
                border: "none",
                background: colors.brand.primary,
                color: "#fff",
                cursor: "pointer",
                fontWeight: typography.fontWeight.semibold,
                fontSize: typography.fontSize.xs,
                transition: `background ${animation.duration.fast}`,
              }}
            >
              <UserPlus size={14} />
              Ekle
            </button>
          )}
        </div>

        {/* Board Creator Card (TEAM only) */}
        {board.boardType === 'TEAM' && (
          <div style={{
            display: "flex", alignItems: "center", gap: spacing[2.5],
            padding: spacing[3], borderRadius: radius.md,
            border: `1px solid ${colors.brand.primary}30`,
            background: `${colors.brand.primary}08`,
            marginBottom: spacing[2],
          }}>
            <div style={{
              width: spacing[8], height: spacing[8], borderRadius: radius.full,
              background: `linear-gradient(135deg, ${colors.brand.primary}, #7950f2)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontWeight: typography.fontWeight.bold, fontSize: typography.fontSize.xs,
              flexShrink: 0,
            }}>
              {board.ownerFirstName && board.ownerLastName
                ? `${board.ownerFirstName.charAt(0)}${board.ownerLastName.charAt(0)}`.toUpperCase()
                : board.ownerName.substring(0, 2).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, color: cssVars.textMain, display: "block" }}>
                {board.ownerFirstName && board.ownerLastName ? `${board.ownerFirstName} ${board.ownerLastName}` : board.ownerName}
              </span>
              <span style={{ fontSize: typography.fontSize.xs, color: cssVars.textMuted }}>
                @{board.ownerName}
              </span>
            </div>
            <span style={{
              fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold,
              color: colors.brand.primary, background: colors.brand.primaryLight,
              padding: `${spacing[0.5]} ${spacing[2.5]}`, borderRadius: radius.full,
            }}>
              Kurucu
            </span>
          </div>
        )}

        {/* Member List */}
        {members.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: `${spacing[4]} ${spacing[3]}`,
              color: cssVars.textMuted,
            }}
          >
            <Users size={24} style={{ opacity: 0.3, marginBottom: spacing[2] }} />
            <p
              style={{
                fontSize: typography.fontSize.sm,
                margin: 0,
              }}
            >
              Henüz üye eklenmemiş
            </p>
            {isOwner && (
              <p
                style={{
                  fontSize: typography.fontSize.xs,
                  marginTop: spacing[1],
                  opacity: 0.7,
                }}
              >
                Bağlantılarınızdan üye ekleyin
              </p>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: spacing[2] }}>
            {members.map((member) => (
              <div
                key={member.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: spacing[1.5],
                  padding: spacing[3],
                  borderRadius: radius.md,
                  border: `1px solid ${themeColors.borderDefault}`,
                  background: isLight ? "transparent" : "rgba(255,255,255,0.02)",
                }}
              >
                {/* Member row */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: spacing[2.5],
                    }}
                  >
                    {member.profilePicture ? (
                      <img
                        src={member.profilePicture}
                        alt={member.username}
                        style={{
                          width: spacing[8],
                          height: spacing[8],
                          borderRadius: radius.full,
                          objectFit: "cover",
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: spacing[8],
                          height: spacing[8],
                          borderRadius: radius.full,
                          background: colors.brand.primaryLight,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: colors.brand.primary,
                          fontWeight: typography.fontWeight.bold,
                          fontSize: typography.fontSize.xs,
                          flexShrink: 0,
                        }}
                      >
                        {member.firstName && member.lastName
                          ? `${member.firstName.charAt(0)}${member.lastName.charAt(0)}`.toUpperCase()
                          : member.username.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <span
                        style={{
                          fontSize: typography.fontSize.base,
                          fontWeight: typography.fontWeight.semibold,
                          color: cssVars.textMain,
                          display: "block",
                        }}
                      >
                        {board.boardType === 'TEAM' && member.firstName && member.lastName
                          ? `${member.firstName} ${member.lastName}`
                          : member.username}
                      </span>
                      {board.boardType === 'TEAM' && member.firstName && member.lastName && (
                        <span
                          style={{
                            fontSize: typography.fontSize.xs,
                            color: cssVars.textMuted,
                          }}
                        >
                          @{member.username}
                        </span>
                      )}
                      {member.assignments && member.assignments.length > 0 && (
                        <span
                          style={{
                            fontSize: typography.fontSize.xs,
                            color: cssVars.textMuted,
                            marginLeft: board.boardType === 'TEAM' ? spacing[2] : undefined,
                          }}
                        >
                          {board.boardType === 'TEAM' ? `· ${member.assignments.length} atama` : `${member.assignments.length} atama`}
                        </span>
                      )}
                    </div>
                  </div>

                  {isOwner && (
                    <div style={{ display: "flex", alignItems: "center", gap: spacing[2] }}>
                      <button
                        onClick={() => handleOpenAssign(member)}
                        title="Atama yap"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: spacing[7],
                          height: spacing[7],
                          borderRadius: radius.md,
                          border: `1px solid ${themeColors.borderDefault}`,
                          background: "transparent",
                          color: colors.brand.primary,
                          cursor: "pointer",
                          transition: `all ${animation.duration.fast}`,
                        }}
                      >
                        <Target size={14} />
                      </button>
                      <button
                        onClick={() => handleRemoveMember(member)}
                        title="Üyeyi kaldir"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: spacing[7],
                          height: spacing[7],
                          borderRadius: radius.md,
                          border: `1px solid ${colors.semantic.danger}30`,
                          background: "transparent",
                          color: colors.semantic.danger,
                          cursor: "pointer",
                          transition: `all ${animation.duration.fast}`,
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Assignments badges */}
                {member.assignments && member.assignments.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: spacing[1],
                      paddingTop: spacing[0.5],
                    }}
                  >
                    {member.assignments.map((a) => (
                      <span
                        key={a.id}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: spacing[1],
                          fontSize: typography.fontSize.xs,
                          fontWeight: typography.fontWeight.medium,
                          color: colors.brand.primary,
                          background: colors.brand.primaryLight,
                          padding: `${spacing[0.5]} ${spacing[2]}`,
                          borderRadius: radius.full,
                        }}
                      >
                        {TARGET_TYPE_ICONS[a.targetType]}
                        {a.targetName || `#${a.targetId}`}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <AddBoardMemberModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAddMember={handleAddMember}
        existingMembers={members}
        pendingMembers={board.pendingMembers || []}
      />

      <AssignMemberModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        member={selectedMember}
        board={board}
        onCreateAssignment={handleCreateAssignment}
        onRemoveAssignment={handleRemoveAssignment}
        onCreateBulkAssignment={handleCreateBulkAssignment}
      />

      <ConfirmationModal
        isOpen={!!memberToRemove}
        title="Üyeyi Kaldır"
        message={
          memberToRemove
            ? `"${memberToRemove.firstName && memberToRemove.lastName ? `${memberToRemove.firstName} ${memberToRemove.lastName}` : memberToRemove.username}" adlı üyeyi bu panodan kaldırmak istediğinize emin misiniz?`
            : ""
        }
        confirmText="Evet, Kaldır"
        cancelText="İptal"
        variant="danger"
        onConfirm={handleConfirmRemove}
        onCancel={() => setMemberToRemove(null)}
      />
    </>
  );
};

export default BoardMembersSection;
