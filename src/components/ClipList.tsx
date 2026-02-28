import React, { useState } from "react";
import type { Clip } from "../hooks/useOverlayState";
import { effectiveDuration } from "../hooks/useOverlayState";

interface ClipListProps {
  clips: Clip[];
  onAddClips: () => void;
  onRemoveClip: (id: string) => void;
  onReorderClips: (fromIndex: number, toIndex: number) => void;
  onCrossfadeChange: (id: string, duration: number) => void;
}

function truncatePath(p: string): string {
  const parts = p.split("/");
  return parts.length > 2 ? `.../${parts.slice(-2).join("/")}` : p;
}

function formatDuration(seconds: number): string {
  if (seconds <= 0) return "...";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return m > 0 ? `${m}:${s.toString().padStart(2, "0")}` : `${s}s`;
}

export const ClipList: React.FC<ClipListProps> = ({
  clips,
  onAddClips,
  onRemoveClip,
  onReorderClips,
  onCrossfadeChange,
}) => {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  const hasMismatch =
    clips.length > 1 &&
    clips.some(
      (c) => c.width > 0 && c.height > 0 && (c.width !== clips[0].width || c.height !== clips[0].height)
    );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <label
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: "#999",
          textTransform: "uppercase",
          letterSpacing: 1,
        }}
      >
        Clips
      </label>

      <button onClick={onAddClips} style={addButtonStyle}>
        + Add Clip(s)
      </button>

      {hasMismatch && (
        <div
          style={{
            padding: "8px 12px",
            background: "#3d3520",
            border: "1px solid #665c30",
            borderRadius: 6,
            fontSize: 11,
            color: "#edc55e",
          }}
        >
          Resolution mismatch: some clips have different dimensions than the first clip.
        </div>
      )}

      {clips.map((clip, i) => (
        <React.Fragment key={clip.id}>
          <div
            draggable
            onDragStart={() => setDragIndex(i)}
            onDragOver={(e) => {
              e.preventDefault();
              setDropIndex(i);
            }}
            onDragEnd={() => {
              if (dragIndex !== null && dropIndex !== null && dragIndex !== dropIndex) {
                onReorderClips(dragIndex, dropIndex);
              }
              setDragIndex(null);
              setDropIndex(null);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 10px",
              background: dropIndex === i ? "#333" : "#2a2a2a",
              border: "1px solid #444",
              borderRadius: 8,
              cursor: "grab",
              opacity: dragIndex === i ? 0.5 : 1,
            }}
          >
            <span style={{ color: "#666", fontSize: 14, userSelect: "none" }}>⠿</span>
            <span
              style={{
                flex: 1,
                fontSize: 12,
                color: "#ccc",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {truncatePath(clip.filePath)}
            </span>
            <span
              style={{
                fontSize: 10,
                color: "#888",
                background: "#1a1a1a",
                padding: "2px 6px",
                borderRadius: 4,
                flexShrink: 0,
              }}
            >
              {formatDuration(effectiveDuration(clip))}
            </span>
            <button
              onClick={() => onRemoveClip(clip.id)}
              style={{
                background: "none",
                border: "none",
                color: "#666",
                cursor: "pointer",
                fontSize: 14,
                padding: "0 2px",
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>

          {/* Crossfade slider between adjacent clips */}
          {i < clips.length - 1 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "0 10px",
                fontSize: 11,
                color: "#777",
              }}
            >
              <span style={{ flexShrink: 0 }}>Crossfade</span>
              <input
                type="range"
                min={0}
                max={2}
                step={0.1}
                value={clips[i + 1].crossfadeDuration}
                onChange={(e) => onCrossfadeChange(clips[i + 1].id, parseFloat(e.target.value))}
                style={{ flex: 1, accentColor: "#FF5C2A" }}
              />
              <span style={{ flexShrink: 0, width: 28, textAlign: "right" }}>
                {clips[i + 1].crossfadeDuration.toFixed(1)}s
              </span>
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

const addButtonStyle: React.CSSProperties = {
  padding: "10px 16px",
  background: "#2a2a2a",
  border: "1px dashed #555",
  borderRadius: 8,
  color: "#aaa",
  cursor: "pointer",
  fontSize: 13,
  textAlign: "center",
};
