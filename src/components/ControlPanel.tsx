import React from "react";

interface ControlPanelProps {
  overlayDuration: number;
  fadeDuration: number;
  videoDuration: number;
  onOverlayDurationChange: (d: number) => void;
  onFadeDurationChange: (d: number) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  overlayDuration,
  fadeDuration,
  videoDuration,
  onOverlayDurationChange,
  onFadeDurationChange,
}) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: "#999", textTransform: "uppercase", letterSpacing: 1 }}>
        Overlay Timing
      </label>

      <div>
        <div style={labelRow}>
          <span>Duration</span>
          <span>{overlayDuration.toFixed(1)}s</span>
        </div>
        <input
          type="range"
          min={0.5}
          max={videoDuration}
          step={0.1}
          value={overlayDuration}
          onChange={(e) => onOverlayDurationChange(parseFloat(e.target.value))}
          style={sliderStyle}
        />
      </div>

      <div>
        <div style={labelRow}>
          <span>Fade Out</span>
          <span>{fadeDuration.toFixed(1)}s</span>
        </div>
        <input
          type="range"
          min={0}
          max={Math.min(overlayDuration, 5)}
          step={0.1}
          value={fadeDuration}
          onChange={(e) => onFadeDurationChange(parseFloat(e.target.value))}
          style={sliderStyle}
        />
      </div>
    </div>
  );
};

const labelRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  fontSize: 13,
  color: "#ccc",
  marginBottom: 4,
};

const sliderStyle: React.CSSProperties = {
  width: "100%",
  accentColor: "#FF5C2A",
};
