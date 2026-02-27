import React from "react";
import {
  AbsoluteFill,
  Img,
  Sequence,
  Series,
  Video,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { SummarySlide, type SummarySlideProps } from "../components/SummarySlide";

interface ClipEntry {
  src: string;
  durationInFrames: number;
  crossfadeDurationInFrames: number;
}

interface OverlayProps {
  overlaySrc: string;
  overlayX: number;
  overlayY: number;
  overlayWidth: number;
  overlayHeight: number;
  overlayDuration: number;
  fadeDuration: number;
}

export interface FinalVideoProps {
  clips: ClipEntry[];
  overlayProps: OverlayProps;
  summarySlideProps: SummarySlideProps;
  summaryDurationInFrames: number;
  summaryEnabled: boolean;
}

/**
 * Compute the starting frame for each clip, accounting for crossfade overlaps.
 * Clip 0 starts at frame 0. Each subsequent clip starts at
 * (previous start + previous duration - crossfade overlap).
 */
function computeClipStarts(clips: ClipEntry[]): number[] {
  const starts: number[] = [];
  let cursor = 0;
  for (let i = 0; i < clips.length; i++) {
    if (i > 0) {
      cursor -= clips[i].crossfadeDurationInFrames;
    }
    starts.push(cursor);
    cursor += clips[i].durationInFrames;
  }
  return starts;
}

const ClipSegment: React.FC<{
  src: string;
  durationInFrames: number;
  crossfadeInFrames: number;
  crossfadeOutFrames: number;
  isFirst: boolean;
  isLast: boolean;
}> = ({ src, durationInFrames, crossfadeInFrames, crossfadeOutFrames, isFirst, isLast }) => {
  const frame = useCurrentFrame();

  let opacity = 1;
  if (!isFirst && crossfadeInFrames > 0) {
    opacity = interpolate(frame, [0, crossfadeInFrames], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  }
  if (!isLast && crossfadeOutFrames > 0) {
    const fadeOutOpacity = interpolate(
      frame,
      [durationInFrames - crossfadeOutFrames, durationInFrames],
      [1, 0],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );
    opacity = Math.min(opacity, fadeOutOpacity);
  }

  return (
    <AbsoluteFill style={{ opacity }}>
      <Video src={src} />
    </AbsoluteFill>
  );
};

const OverlayLayer: React.FC<OverlayProps> = ({
  overlaySrc,
  overlayX,
  overlayY,
  overlayWidth,
  overlayHeight,
  overlayDuration,
  fadeDuration,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (!overlaySrc) return null;

  const overlayEndFrame = overlayDuration * fps;
  const fadeStartFrame = overlayEndFrame - fadeDuration * fps;

  const opacity =
    frame >= overlayEndFrame
      ? 0
      : frame >= fadeStartFrame
        ? interpolate(frame, [fadeStartFrame, overlayEndFrame], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        : 1;

  if (opacity <= 0) return null;

  return (
    <Img
      src={overlaySrc}
      style={{
        position: "absolute",
        left: `${overlayX}%`,
        top: `${overlayY}%`,
        width: `${overlayWidth}%`,
        height: `${overlayHeight}%`,
        objectFit: "contain",
        opacity,
      }}
    />
  );
};

export const FinalVideo: React.FC<FinalVideoProps> = ({
  clips,
  overlayProps,
  summarySlideProps,
  summaryDurationInFrames,
  summaryEnabled,
}) => {
  const starts = computeClipStarts(clips);

  // Total clip frames = last clip start + last clip duration
  let totalClipFrames = 1;
  if (clips.length > 0) {
    const last = clips.length - 1;
    totalClipFrames = Math.max(1, starts[last] + clips[last].durationInFrames);
  }

  return (
    <Series>
      <Series.Sequence durationInFrames={totalClipFrames}>
        <AbsoluteFill>
          {/* Clip layer — each clip is an absolutely-positioned Sequence so
              they can overlap during crossfades and pre-mount for buffering */}
          {clips.map((clip, i) => (
            <Sequence
              key={i}
              from={starts[i]}
              durationInFrames={clip.durationInFrames}
              premountFor={60}
            >
              <ClipSegment
                src={clip.src}
                durationInFrames={clip.durationInFrames}
                crossfadeInFrames={clip.crossfadeDurationInFrames}
                crossfadeOutFrames={i < clips.length - 1 ? clips[i + 1].crossfadeDurationInFrames : 0}
                isFirst={i === 0}
                isLast={i === clips.length - 1}
              />
            </Sequence>
          ))}

          {/* Overlay layer */}
          <AbsoluteFill style={{ zIndex: 1 }}>
            <OverlayLayer {...overlayProps} />
          </AbsoluteFill>
        </AbsoluteFill>
      </Series.Sequence>

      {summaryEnabled && summaryDurationInFrames > 0 && (
        <Series.Sequence durationInFrames={summaryDurationInFrames}>
          <SummarySlide {...summarySlideProps} />
        </Series.Sequence>
      )}
    </Series>
  );
};
