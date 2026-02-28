import React from "react";

interface TrimConfirmModalProps {
  onSave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
}

export const TrimConfirmModal: React.FC<TrimConfirmModalProps> = ({ onSave, onDiscard, onCancel }) => {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#222",
          border: "1px solid #444",
          borderRadius: 12,
          padding: "24px 28px",
          maxWidth: 340,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <p style={{ margin: 0, fontSize: 14, color: "#eee" }}>
          You have unsaved trim changes
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
            style={{
              background: "none",
              border: "none",
              color: "#aaa",
              cursor: "pointer",
              fontSize: 13,
              padding: "6px 12px",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onDiscard}
            style={{
              background: "#666",
              border: "none",
              borderRadius: 6,
              color: "#fff",
              cursor: "pointer",
              fontSize: 13,
              padding: "6px 16px",
            }}
          >
            Discard
          </button>
          <button
            onClick={onSave}
            style={{
              background: "#FF5C2A",
              border: "none",
              borderRadius: 6,
              color: "#fff",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              padding: "6px 16px",
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};
