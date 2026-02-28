import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import type { CaptionSegment, CaptionPosition } from "../types";

interface CaptionClip {
  captions: CaptionSegment[];
  startFrame: number;
  durationInFrames: number;
}

interface CaptionLayerProps {
  clips: CaptionClip[];
  fontSize: number;
  color: string;
  position: CaptionPosition;
  maxWords: number;
}

const positionStyles: Record<CaptionPosition, React.CSSProperties> = {
  top: { top: "8%", bottom: "auto" },
  center: { top: "50%", transform: "translateY(-50%)" },
  bottom: { bottom: "8%", top: "auto" },
};

interface SplitChunk {
  start: number;
  end: number;
  text: string;
}

/**
 * Split a caption segment into chunks of at most `maxWords` words,
 * distributing the time evenly across chunks.
 */
function splitSegment(seg: CaptionSegment, maxWords: number): SplitChunk[] {
  const words = seg.text.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) {
    return [{ start: seg.start, end: seg.end, text: seg.text }];
  }

  const chunks: SplitChunk[] = [];
  const totalDuration = seg.end - seg.start;
  const numChunks = Math.ceil(words.length / maxWords);
  const chunkDuration = totalDuration / numChunks;

  for (let i = 0; i < numChunks; i++) {
    const chunkWords = words.slice(i * maxWords, (i + 1) * maxWords);
    chunks.push({
      start: seg.start + i * chunkDuration,
      end: seg.start + (i + 1) * chunkDuration,
      text: chunkWords.join(" "),
    });
  }

  return chunks;
}

export const CaptionLayer: React.FC<CaptionLayerProps> = ({
  clips,
  fontSize,
  color,
  position,
  maxWords,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Pre-split all segments by word limit
  const splitClips = useMemo(
    () =>
      clips.map((clip) => ({
        ...clip,
        chunks: clip.captions.flatMap((seg) => splitSegment(seg, maxWords)),
      })),
    [clips, maxWords]
  );

  // Find which clip is active at the current frame
  let activeText = "";
  for (const clip of splitClips) {
    const clipEnd = clip.startFrame + clip.durationInFrames;
    if (frame >= clip.startFrame && frame < clipEnd) {
      const localTime = (frame - clip.startFrame) / fps;
      for (const chunk of clip.chunks) {
        if (localTime >= chunk.start && localTime < chunk.end) {
          activeText = chunk.text;
          break;
        }
      }
      break;
    }
  }

  if (!activeText) return null;

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: "10%",
          right: "10%",
          textAlign: "center",
          fontSize,
          fontWeight: 700,
          color,
          textShadow: `
            -2px -2px 4px rgba(0,0,0,0.8),
             2px -2px 4px rgba(0,0,0,0.8),
            -2px  2px 4px rgba(0,0,0,0.8),
             2px  2px 4px rgba(0,0,0,0.8),
             0    0   8px rgba(0,0,0,0.6)
          `,
          fontFamily: "'Inter', -apple-system, sans-serif",
          lineHeight: 1.3,
          ...positionStyles[position],
        }}
      >
        {activeText}
      </div>
    </AbsoluteFill>
  );
};
