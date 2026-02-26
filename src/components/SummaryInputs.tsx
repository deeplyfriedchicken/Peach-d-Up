import React from "react";
import type { SummaryItem } from "../hooks/useOverlayState";

interface SummaryInputsProps {
  items: SummaryItem[];
  summaryDuration: number;
  onAddItem: () => void;
  onRemoveItem: (id: string) => void;
  onUpdateItem: (id: string, emoji?: string, text?: string) => void;
  onDurationChange: (duration: number) => void;
}

const inputStyle: React.CSSProperties = {
  background: "#2a2a2a",
  border: "1px solid #3a3a3a",
  borderRadius: 6,
  color: "#eee",
  padding: "8px 10px",
  fontSize: 14,
};

export const SummaryInputs: React.FC<SummaryInputsProps> = ({
  items,
  summaryDuration,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
  onDurationChange,
}) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: "#999", textTransform: "uppercase", letterSpacing: 1 }}>
        Summary Items
      </label>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((item) => (
          <div key={item.id} style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input
              type="text"
              value={item.emoji}
              onChange={(e) => onUpdateItem(item.id, e.target.value, undefined)}
              placeholder="😀"
              style={{ ...inputStyle, width: 44, textAlign: "center", flexShrink: 0 }}
            />
            <input
              type="text"
              value={item.text}
              onChange={(e) => onUpdateItem(item.id, undefined, e.target.value)}
              placeholder="Item text"
              style={{ ...inputStyle, flex: 1 }}
            />
            <button
              onClick={() => onRemoveItem(item.id)}
              style={{
                background: "none",
                border: "none",
                color: "#666",
                cursor: "pointer",
                fontSize: 16,
                padding: "4px 8px",
                flexShrink: 0,
              }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={onAddItem}
        style={{
          padding: "8px 12px",
          background: "#2a2a2a",
          border: "1px solid #3a3a3a",
          borderRadius: 8,
          color: "#ccc",
          cursor: "pointer",
          fontSize: 13,
          fontWeight: 500,
        }}
      >
        + Add Item
      </button>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: "#999", textTransform: "uppercase", letterSpacing: 1 }}>
          Duration: {summaryDuration}s
        </label>
        <input
          type="range"
          min={2}
          max={30}
          step={0.5}
          value={summaryDuration}
          onChange={(e) => onDurationChange(parseFloat(e.target.value))}
          style={{ accentColor: "#FF5C2A" }}
        />
      </div>
    </div>
  );
};
