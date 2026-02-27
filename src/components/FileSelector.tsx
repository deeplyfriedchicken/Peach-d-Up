import React from "react";

interface FileSelectorProps {
  overlayFilePath: string | null;
  onOverlaySelect: () => void;
  onOverlayClear: () => void;
}

export const FileSelector: React.FC<FileSelectorProps> = ({
  overlayFilePath,
  onOverlaySelect,
  onOverlayClear,
}) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: "#999", textTransform: "uppercase", letterSpacing: 1 }}>
        Overlay
      </label>

      <div style={{ display: "flex", gap: 6 }}>
        <button onClick={onOverlaySelect} style={{ ...buttonStyle, flex: 1 }}>
          {overlayFilePath ? truncatePath(overlayFilePath) : "Choose PNG Overlay..."}
        </button>
        {overlayFilePath && (
          <button onClick={onOverlayClear} style={clearButtonStyle} title="Clear overlay">
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

function truncatePath(p: string): string {
  const parts = p.split("/");
  return parts.length > 2 ? `.../${parts.slice(-2).join("/")}` : p;
}

const buttonStyle: React.CSSProperties = {
  padding: "10px 16px",
  background: "#2a2a2a",
  border: "1px solid #444",
  borderRadius: 8,
  color: "#eee",
  cursor: "pointer",
  fontSize: 13,
  textAlign: "left",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const clearButtonStyle: React.CSSProperties = {
  padding: "0 10px",
  background: "#2a2a2a",
  border: "1px solid #444",
  borderRadius: 8,
  color: "#666",
  cursor: "pointer",
  fontSize: 14,
  lineHeight: 1,
  flexShrink: 0,
};
