import React, { useRef, useCallback, useEffect } from "react";
import type { Clip } from "../hooks/useOverlayState";
import { effectiveDuration } from "../hooks/useOverlayState";

export interface DraftTrim {
  clipId: string;
  trimStart: number;
  trimEnd: number;
}

interface ClipTimelineProps {
  clips: Clip[];
  fps: number;
  totalDurationInFrames: number;
  currentFrame: number;
  selectedClipId: string | null;
  draftTrim: DraftTrim | null;
  onSelectClip: (id: string | null) => void;
  onDraftTrimChange: (draft: DraftTrim) => void;
  onTrimCommit: () => void;
  onTrimDiscard: () => void;
  onTrimPreviewSeek: (frame: number) => void;
}

const COLORS = ["#FF5C2A", "#2A8FFF", "#2AFF5C", "#FF2A8F", "#FFD02A", "#8F2AFF"];
const HANDLE_WIDTH = 8;
const MIN_DURATION = 1; // minimum 1 second
const SNAP_PX = 8;

function clipDisplayName(filePath: string): string {
  const parts = filePath.split("/");
  const full = parts[parts.length - 1] || filePath;
  const maxLen = 18;
  if (full.length <= maxLen) return full;
  const dotIdx = full.lastIndexOf(".");
  if (dotIdx <= 0) return full.slice(0, maxLen - 3) + "...";
  const name = full.slice(0, dotIdx);
  const ext = full.slice(dotIdx);
  const available = maxLen - ext.length - 3;
  if (available <= 0) return full.slice(0, maxLen - 3) + "...";
  return name.slice(0, available) + "..." + ext;
}

export const ClipTimeline: React.FC<ClipTimelineProps> = ({
  clips,
  fps,
  totalDurationInFrames,
  currentFrame,
  selectedClipId,
  draftTrim,
  onSelectClip,
  onDraftTrimChange,
  onTrimCommit,
  onTrimDiscard,
  onTrimPreviewSeek,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Always use COMMITTED values for layout — other clips don't shift during draft
  const committedDurations = clips.map((clip, i) => {
    let eff = effectiveDuration(clip) * fps;
    if (i > 0) eff -= clip.crossfadeDuration * fps;
    return Math.max(0, eff);
  });
  const totalCommitted = committedDurations.reduce((a, b) => a + b, 0);

  // Committed total duration in seconds (for pixel-to-time conversion)
  const committedTotalSec = (() => {
    let total = 0;
    for (let i = 0; i < clips.length; i++) {
      total += effectiveDuration(clips[i]);
      if (i > 0) total -= clips[i].crossfadeDuration;
    }
    return Math.max(0, total);
  })();

  const playheadPct = totalDurationInFrames > 0 ? (currentFrame / totalDurationInFrames) * 100 : 0;

  const getSecsPerPx = useCallback(() => {
    if (!containerRef.current || committedTotalSec <= 0) return 0;
    return committedTotalSec / containerRef.current.clientWidth;
  }, [committedTotalSec]);

  const playheadTimeSec = totalDurationInFrames > 0 ? (currentFrame / totalDurationInFrames) * committedTotalSec : 0;

  // Clip start time using committed values (for snap)
  const getClipStartTime = useCallback(
    (clipIndex: number) => {
      let t = 0;
      for (let i = 0; i < clipIndex; i++) {
        t += effectiveDuration(clips[i]);
        if (i > 0) t -= clips[i].crossfadeDuration;
      }
      if (clipIndex > 0) t -= clips[clipIndex].crossfadeDuration;
      return t;
    },
    [clips]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, clipId: string, side: "start" | "end") => {
      e.stopPropagation();
      e.preventDefault();
      const target = e.currentTarget as HTMLElement;
      target.setPointerCapture(e.pointerId);

      const clip = clips.find((c) => c.id === clipId);
      if (!clip) return;

      const clipIndex = clips.findIndex((c) => c.id === clipId);
      const startX = e.clientX;
      const initialTrimStart = draftTrim && draftTrim.clipId === clipId ? draftTrim.trimStart : clip.trimStart;
      const initialTrimEnd = draftTrim && draftTrim.clipId === clipId ? draftTrim.trimEnd : clip.trimEnd;
      const secsPerPx = getSecsPerPx();
      const clipStartTime = getClipStartTime(clipIndex);

      const onMove = (ev: PointerEvent) => {
        const dx = ev.clientX - startX;
        const deltaSec = dx * secsPerPx;

        let newTrimStart = initialTrimStart;
        let newTrimEnd = initialTrimEnd;

        if (side === "start") {
          newTrimStart = Math.max(0, initialTrimStart + deltaSec);
          const maxTrimStart = clip.duration - newTrimEnd - MIN_DURATION;
          newTrimStart = Math.min(newTrimStart, Math.max(0, maxTrimStart));

          // Snap to playhead
          const handleTimeSec = clipStartTime + newTrimStart;
          const handlePx = secsPerPx > 0 ? handleTimeSec / secsPerPx : 0;
          const playheadPxLocal = secsPerPx > 0 ? playheadTimeSec / secsPerPx : 0;
          if (Math.abs(handlePx - playheadPxLocal) < SNAP_PX) {
            const snappedTrimStart = playheadTimeSec - clipStartTime;
            if (snappedTrimStart >= 0 && snappedTrimStart <= Math.max(0, clip.duration - newTrimEnd - MIN_DURATION)) {
              newTrimStart = snappedTrimStart;
            }
          }
        } else {
          newTrimEnd = Math.max(0, initialTrimEnd - deltaSec);
          const maxTrimEnd = clip.duration - newTrimStart - MIN_DURATION;
          newTrimEnd = Math.min(newTrimEnd, Math.max(0, maxTrimEnd));

          // Snap to playhead
          const handleTimeSec = clipStartTime + (clip.duration - newTrimStart - newTrimEnd);
          const handlePx = secsPerPx > 0 ? handleTimeSec / secsPerPx : 0;
          const playheadPxLocal = secsPerPx > 0 ? playheadTimeSec / secsPerPx : 0;
          if (Math.abs(handlePx - playheadPxLocal) < SNAP_PX) {
            const snappedEnd = clipStartTime + clip.duration - newTrimStart - playheadTimeSec;
            if (snappedEnd >= 0 && snappedEnd <= Math.max(0, clip.duration - newTrimStart - MIN_DURATION)) {
              newTrimEnd = snappedEnd;
            }
          }
        }

        onDraftTrimChange({ clipId, trimStart: newTrimStart, trimEnd: newTrimEnd });

        // Throttle preview seeks via rAF
        if (rafRef.current === null) {
          rafRef.current = requestAnimationFrame(() => {
            rafRef.current = null;
            const clipStartFrames = (() => {
              let f = 0;
              for (let i = 0; i < clipIndex; i++) {
                f += Math.round(effectiveDuration(clips[i]) * fps);
                if (i > 0) f -= Math.round(clips[i].crossfadeDuration * fps);
              }
              if (clipIndex > 0) f -= Math.round(clips[clipIndex].crossfadeDuration * fps);
              return f;
            })();
            const trimOffset = side === "start"
              ? Math.round((newTrimStart - clip.trimStart) * fps)
              : Math.round((clip.duration - newTrimStart - newTrimEnd) * fps);
            const absFrame = clipStartFrames + Math.max(0, trimOffset);
            onTrimPreviewSeek(absFrame);
          });
        }
      };

      const onUp = () => {
        target.removeEventListener("pointermove", onMove);
        target.removeEventListener("pointerup", onUp);
      };

      target.addEventListener("pointermove", onMove);
      target.addEventListener("pointerup", onUp);
    },
    [clips, draftTrim, fps, getSecsPerPx, getClipStartTime, playheadTimeSec, onDraftTrimChange, onTrimPreviewSeek]
  );

  if (clips.length === 0 || totalDurationInFrames <= 0) return null;

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        height: 40,
        background: "#1a1a1a",
        borderRadius: 4,
        overflow: "visible",
        display: "flex",
        marginTop: 8,
        marginBottom: 16,
      }}
    >
      {clips.map((clip, i) => {
        const widthPct = totalCommitted > 0 ? (committedDurations[i] / totalCommitted) * 100 : 0;
        const isSelected = clip.id === selectedClipId;
        const isDrafting = !!(isSelected && draftTrim && draftTrim.clipId === clip.id);

        // How much extra was trimmed (positive) or un-trimmed (negative)
        // relative to the committed values. All percentages are relative to
        // the committed effective duration (= the allocated container width).
        const committedEff = effectiveDuration(clip);

        const currentTrimStart = isDrafting ? draftTrim!.trimStart : clip.trimStart;
        const currentTrimEnd = isDrafting ? draftTrim!.trimEnd : clip.trimEnd;
        const startDelta = currentTrimStart - clip.trimStart; // >0 = trim more, <0 = un-trim
        const endDelta = currentTrimEnd - clip.trimEnd;

        // Dimmed regions (only when trimming more, eating into committed area)
        const leftDimmedPct = committedEff > 0 ? (Math.max(0, startDelta) / committedEff) * 100 : 0;
        const rightDimmedPct = committedEff > 0 ? (Math.max(0, endDelta) / committedEff) * 100 : 0;

        // Active region: ratio of draft effective to committed effective
        const draftEff = clip.duration - currentTrimStart - currentTrimEnd;
        const activePct = committedEff > 0 ? (draftEff / committedEff) * 100 : 100;

        // Left offset: shift right for inward trim, shift left (overflow) for un-trim
        const activeLeftPct = committedEff > 0 ? (startDelta / committedEff) * 100 : 0;

        return (
          <div
            key={clip.id}
            onClick={(e) => {
              e.stopPropagation();
              onSelectClip(clip.id);
            }}
            style={{
              width: `${widthPct}%`,
              height: "100%",
              position: "relative",
              cursor: "pointer",
              overflow: "visible",
            }}
          >
            {/* Dimmed left region (trimming inward from start) */}
            {isDrafting && leftDimmedPct > 0 && (
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: `${leftDimmedPct}%`,
                  background: COLORS[i % COLORS.length] + "15",
                  zIndex: 1,
                }}
              />
            )}

            {/* Dimmed right region (trimming inward from end) */}
            {isDrafting && rightDimmedPct > 0 && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: 0,
                  bottom: 0,
                  width: `${rightDimmedPct}%`,
                  background: COLORS[i % COLORS.length] + "15",
                  zIndex: 1,
                }}
              />
            )}

            {/* Active region — positioned absolutely so it can overflow for un-trimming */}
            <div
              style={{
                position: isDrafting ? "absolute" : "relative",
                left: isDrafting ? `${activeLeftPct}%` : undefined,
                top: 0,
                bottom: 0,
                width: isDrafting ? `${activePct}%` : "100%",
                height: "100%",
                background: COLORS[i % COLORS.length] + "33",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "visible",
                border: isSelected ? "2px solid #FF5C2A" : undefined,
                borderRadius: isSelected ? 3 : 0,
                boxSizing: "border-box",
                zIndex: 2,
              }}
            >
              {/* Clip label */}
              <span
                style={{
                  fontSize: 9,
                  color: "#aaa",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  padding: "0 12px",
                  maxWidth: "100%",
                }}
              >
                {clipDisplayName(clip.filePath)}
              </span>

              {/* Left trim handle */}
              {isSelected && (
                <div
                  onPointerDown={(e) => handlePointerDown(e, clip.id, "start")}
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: HANDLE_WIDTH,
                    cursor: "ew-resize",
                    background: "#FF5C2A",
                    opacity: 0.8,
                    zIndex: 3,
                    borderRadius: "3px 0 0 3px",
                  }}
                />
              )}

              {/* Right trim handle */}
              {isSelected && (
                <div
                  onPointerDown={(e) => handlePointerDown(e, clip.id, "end")}
                  style={{
                    position: "absolute",
                    right: 0,
                    top: 0,
                    bottom: 0,
                    width: HANDLE_WIDTH,
                    cursor: "ew-resize",
                    background: "#FF5C2A",
                    opacity: 0.8,
                    zIndex: 3,
                    borderRadius: "0 3px 3px 0",
                  }}
                />
              )}

              {/* Save/Discard buttons */}
              {isDrafting && (
                <div
                  style={{
                    position: "absolute",
                    top: -28,
                    left: "50%",
                    transform: "translateX(-50%)",
                    display: "flex",
                    gap: 4,
                    zIndex: 4,
                  }}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTrimCommit();
                    }}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 4,
                      border: "none",
                      background: "#FF5C2A",
                      color: "#fff",
                      cursor: "pointer",
                      fontSize: 14,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 0,
                    }}
                    title="Save trim"
                  >
                    &#x2713;
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTrimDiscard();
                    }}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 4,
                      border: "none",
                      background: "#666",
                      color: "#fff",
                      cursor: "pointer",
                      fontSize: 14,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 0,
                    }}
                    title="Discard trim"
                  >
                    &#x2715;
                  </button>
                </div>
              )}
            </div>

            {/* Separator for non-selected clips */}
            {!isSelected && i < clips.length - 1 && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: 0,
                  bottom: 0,
                  width: 1,
                  background: "#555",
                }}
              />
            )}
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
