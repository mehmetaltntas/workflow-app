import { useState, useEffect, useRef } from "react";
import { colors, cssVars } from "../styles/tokens";

interface Props {
  text: string;
  onSave: (newText: string) => void;
  fontSize?: string;
  fontWeight?: string;
}

export const InlineEdit = ({
  text,
  onSave,
  fontSize = "16px",
  fontWeight = "normal",
}: Props) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(text);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    if (value.trim() && value !== text) {
      onSave(value);
    }
    setIsEditing(false);
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSave();
          if (e.key === "Escape") {
            setValue(text);
            setIsEditing(false);
          }
        }}
        style={{
          background: cssVars.bgBody,
          color: cssVars.textMain,
          border: `1px solid ${colors.brand.primary}`,
          padding: "4px 10px",
          borderRadius: "10px",
          fontSize: fontSize,
          fontWeight: fontWeight,
          width: "100%",
          outline: "none"
        }}
      />
    );
  }

  return (
    <span
      onDoubleClick={() => setIsEditing(true)}
      style={{
        cursor: "pointer",
        fontSize: fontSize,
        fontWeight: fontWeight,
        padding: "4px 10px",
        borderRadius: "10px",
        border: "1px solid transparent",
        display: "inline-block",
        transition: "all 0.2s",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        maxWidth: "100%"
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.background = colors.dark.bg.hover)
      }
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      title="Çift tıklayarak düzenle"
    >
      {text}
    </span>
  );
};


