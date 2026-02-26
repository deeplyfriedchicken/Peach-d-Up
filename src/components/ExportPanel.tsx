import React, { useState, useEffect } from "react";
import type { OverlayState } from "../hooks/useOverlayState";

interface ExportPanelProps {
  state: OverlayState;
  disabled: boolean;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({ state, disabled }) => {
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!window.electronAPI) return;
    const unsub = window.electronAPI.onExportProgress((p) => setProgress(p));
    return unsub;
  }, []);

  const handleExport = async () => {
    if (!window.electronAPI) return;
    setError(null);

    const outputPath = await window.electronAPI.selectSavePath();
    if (!outputPath) return;

    setExporting(true);
    setProgress(0);

    const result = await window.electronAPI.exportVideo({
      videoSrc: state.videoSrc!,
      overlaySrc: state.overlaySrc || "",
      overlayX: state.overlayX,
      overlayY: state.overlayY,
      overlayWidth: state.overlayWidth,
      overlayHeight: state.overlayHeight,
      overlayDuration: state.overlayDuration,
      fadeDuration: state.fadeDuration,
      videoWidth: state.videoWidth,
      videoHeight: state.videoHeight,
      videoDuration: state.videoDuration,
      fps: state.fps,
      outputPath,
    });

    setExporting(false);
    if (!result.success) {
      setError(result.error || "Export failed");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: "#999", textTransform: "uppercase", letterSpacing: 1 }}>
        Export
      </label>

      <button
        onClick={handleExport}
        disabled={disabled || exporting}
        style={{
          padding: "12px 16px",
          background: disabled || exporting ? "#333" : "#FF5C2A",
          border: "none",
          borderRadius: 8,
          color: disabled || exporting ? "#666" : "#fff",
          cursor: disabled || exporting ? "not-allowed" : "pointer",
          fontSize: 14,
          fontWeight: 600,
        }}
      >
        {exporting ? "Exporting..." : "Export MP4"}
      </button>

      {exporting && (
        <div style={{ background: "#222", borderRadius: 4, overflow: "hidden", height: 6 }}>
          <div
            style={{
              width: `${Math.round(progress * 100)}%`,
              height: "100%",
              background: "#FF5C2A",
              transition: "width 0.3s ease",
            }}
          />
        </div>
      )}

      {error && <p style={{ color: "#f44", fontSize: 12, margin: 0 }}>{error}</p>}
    </div>
  );
};
