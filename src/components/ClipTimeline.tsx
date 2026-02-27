import React from "react";
import type { Clip } from "../hooks/useOverlayState";

interface ClipTimelineProps {
  clips: Clip[];
  fps: number;
  totalDurationInFrames: number;
  currentFrame: number;
}

const COLORS = ["#FF5C2A", "#2A8FFF", "#2AFF5C", "#FF2A8F", "#FFD02A", "#8F2AFF"];

export const ClipTimeline: React.FC<ClipTimelineProps> = ({
  clips,
  fps,
  totalDurationInFrames,
  currentFrame,
}) => {
  if (clips.length === 0 || totalDurationInFrames <= 0) return null;

  // Calculate effective durations (after crossfade subtraction)
  const effectiveDurations = clips.map((clip, i) => {
    let eff = clip.duration * fps;
    if (i > 0) eff -= clip.crossfadeDuration * fps;
    return Math.max(0, eff);
  });
  const totalEffective = effectiveDurations.reduce((a, b) => a + b, 0);

  const playheadPct = totalDurationInFrames > 0 ? (currentFrame / totalDurationInFrames) * 100 : 0;

  return (
    <div
      style={{
        position: "relative",
        height: 24,
        background: "#1a1a1a",
        borderRadius: 4,
        overflow: "hidden",
        display: "flex",
        marginTop: 8,
      }}
    >
      {clips.map((clip, i) => {
        const widthPct = totalEffective > 0 ? (effectiveDurations[i] / totalEffective) * 100 : 0;
        return (
          <div
            key={clip.id}
            style={{
              width: `${widthPct}%`,
              height: "100%",
              background: COLORS[i % COLORS.length] + "33",
              borderRight: i < clips.length - 1 ? "1px solid #555" : "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            <span
              style={{
                fontSize: 9,
                color: "#aaa",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                padding: "0 4px",
              }}
            >
              Clip {i + 1}
            </span>
          </div>
        );
      })}

      {/* Playhead */}
      <div
        style={{
          position: "absolute",
          left: `${playheadPct}%`,
          top: 0,
          bottom: 0,
          width: 2,
          background: "#fff",
          pointerEvents: "none",
          transition: "left 0.05s linear",
        }}
      />
    </div>
  );
};
