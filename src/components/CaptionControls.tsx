import React from "react";
import type { Clip, OverlayAction } from "../hooks/useOverlayState";
import { effectiveDuration } from "../hooks/useOverlayState";
import type { CaptionPosition } from "../types";
import { TranscriptViewer } from "./TranscriptViewer";

interface CaptionControlsProps {
  captionsEnabled: boolean;
  captionFontSize: number;
  captionColor: string;
  captionPosition: CaptionPosition;
  captionMaxWords: number;
  clips: Clip[];
  dispatch: React.Dispatch<OverlayAction>;
  currentFrame: number;
  fps: number;
  onSeek: (frame: number) => void;
  clipStartFrames: number[];
}

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: "#999",
  textTransform: "uppercase",
  letterSpacing: 1,
};

const positionOptions: { value: CaptionPosition; label: string }[] = [
  { value: "top", label: "Top" },
  { value: "center", label: "Center" },
  { value: "bottom", label: "Bottom" },
];

export const CaptionControls: React.FC<CaptionControlsProps> = ({
  captionsEnabled,
  captionFontSize,
  captionColor,
  captionPosition,
  captionMaxWords,
  clips,
  dispatch,
  currentFrame,
  fps,
  onSeek,
  clipStartFrames,
}) => {
  const clipsWithCaptions = clips.filter(
    (c) => c.captionStatus === "done" || c.captionStatus === "transcribing"
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <label style={labelStyle}>Captions</label>

      {/* Enable toggle */}
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          cursor: "pointer",
          fontSize: 13,
        }}
      >
        <input
          type="checkbox"
          checked={captionsEnabled}
          onChange={(e) =>
            dispatch({ type: "SET_CAPTIONS_ENABLED", enabled: e.target.checked })
          }
          style={{ accentColor: "#FF5C2A" }}
        />
        Enable Captions
      </label>

      {captionsEnabled && (
        <>
          {/* Font size */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 11, color: "#888" }}>
              Font Size: {captionFontSize}px
            </label>
            <input
              type="range"
              min={24}
              max={72}
              step={2}
              value={captionFontSize}
              onChange={(e) =>
                dispatch({
                  type: "SET_CAPTION_FONT_SIZE",
                  fontSize: Number(e.target.value),
                })
              }
              style={{ accentColor: "#FF5C2A" }}
            />
          </div>

          {/* Max words per caption */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 11, color: "#888" }}>
              Max Words: {captionMaxWords}
            </label>
            <input
              type="range"
              min={3}
              max={25}
              step={1}
              value={captionMaxWords}
              onChange={(e) =>
                dispatch({
                  type: "SET_CAPTION_MAX_WORDS",
                  maxWords: Number(e.target.value),
                })
              }
              style={{ accentColor: "#FF5C2A" }}
            />
          </div>

          {/* Color */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <label style={{ fontSize: 11, color: "#888" }}>Color:</label>
            <input
              type="color"
              value={captionColor}
              onChange={(e) =>
                dispatch({ type: "SET_CAPTION_COLOR", color: e.target.value })
              }
              style={{
                width: 28,
                height: 28,
                border: "1px solid #444",
                borderRadius: 4,
                background: "none",
                cursor: "pointer",
                padding: 0,
              }}
            />
            <span style={{ fontSize: 11, color: "#888" }}>{captionColor}</span>
          </div>

          {/* Position */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 11, color: "#888" }}>Position</label>
            <div style={{ display: "flex", gap: 4 }}>
              {positionOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() =>
                    dispatch({
                      type: "SET_CAPTION_POSITION",
                      position: opt.value,
                    })
                  }
                  style={{
                    flex: 1,
                    padding: "6px 0",
                    border: "1px solid",
                    borderColor:
                      captionPosition === opt.value ? "#FF5C2A" : "#444",
                    borderRadius: 4,
                    background:
                      captionPosition === opt.value
                        ? "rgba(255,92,42,0.15)"
                        : "#222",
                    color:
                      captionPosition === opt.value ? "#FF5C2A" : "#aaa",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Per-clip transcripts */}
          {clipsWithCaptions.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ ...labelStyle, marginTop: 8 }}>Transcripts</label>
              {clips.map((clip, i) => {
                if (
                  clip.captionStatus !== "done" &&
                  clip.captionStatus !== "transcribing" &&
                  clip.captionStatus !== "error"
                )
                  return null;

                return (
                  <TranscriptViewer
                    key={clip.id}
                    clip={clip}
                    clipIndex={i}
                    clipStartFrame={clipStartFrames[i] ?? 0}
                    clipDurationInFrames={Math.max(1, Math.round(effectiveDuration(clip) * fps))}
                    fps={fps}
                    currentFrame={currentFrame}
                    maxWords={captionMaxWords}
                    onSeek={onSeek}
                    dispatch={dispatch}
                  />
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};
