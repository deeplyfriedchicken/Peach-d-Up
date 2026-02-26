import React from "react";

interface FileSelectorProps {
  videoFilePath: string | null;
  overlayFilePath: string | null;
  onVideoSelect: () => void;
  onOverlaySelect: () => void;
}

export const FileSelector: React.FC<FileSelectorProps> = ({
  videoFilePath,
  overlayFilePath,
  onVideoSelect,
  onOverlaySelect,
}) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: "#999", textTransform: "uppercase", letterSpacing: 1 }}>
        Files
      </label>

      <button onClick={onVideoSelect} style={buttonStyle}>
        {videoFilePath ? truncatePath(videoFilePath) : "Choose Video..."}
      </button>

      <button onClick={onOverlaySelect} style={buttonStyle}>
        {overlayFilePath ? truncatePath(overlayFilePath) : "Choose PNG Overlay..."}
      </button>
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
