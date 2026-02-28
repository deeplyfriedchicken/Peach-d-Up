import React, { useMemo } from "react";
import { Player } from "@remotion/player";
import { FinalVideo } from "../compositions/FinalVideo";
import { SummarySlide } from "./SummarySlide";
import type { OverlayState } from "../hooks/useOverlayState";
import { totalVideoDuration } from "../hooks/useOverlayState";

interface PlayerPreviewProps {
  state: OverlayState;
  playerRef: React.RefObject<any>;
}

const playerStyle: React.CSSProperties = {
  width: "100%",
  maxHeight: "calc(100vh - 80px)",
  borderRadius: 12,
  overflow: "hidden",
};

export const PlayerPreview: React.FC<PlayerPreviewProps> = ({ state, playerRef }) => {
  if (state.activeTab === "summary") {
    const durationInFrames = Math.max(1, Math.round(state.summaryDuration * state.fps));

    return (
      <Player
        ref={playerRef}
        component={SummarySlide}
        compositionWidth={state.videoWidth}
        compositionHeight={state.videoHeight}
        durationInFrames={durationInFrames}
        fps={state.fps}
        style={playerStyle}
        controls
        inputProps={{
          items: state.summaryItems,
        }}
      />
    );
  }

  if (state.clips.length === 0) {
    return (
      <div
        style={{
          width: "100%",
          maxHeight: "calc(100vh - 80px)",
          aspectRatio: `${state.videoWidth}/${state.videoHeight}`,
          background: "#1a1a1a",
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#555",
          fontSize: 16,
        }}
      >
        Add clips to get started
      </div>
    );
  }

  // Memoize inputProps AND totalFrames together so they stay in sync
  // and don't cause unnecessary Player re-renders
  const { inputProps, totalFrames } = useMemo(() => {
    const clips = state.clips.map((c) => {
      const effDuration = c.duration - c.trimStart - c.trimEnd;
      const trimStartFrames = Math.round(c.trimStart * state.fps);
      return {
        src: c.src,
        durationInFrames: Math.max(1, Math.round(effDuration * state.fps)),
        crossfadeDurationInFrames: Math.round(c.crossfadeDuration * state.fps),
        startFrom: trimStartFrames,
        captions: (c.captions || [])
          .filter((cap) => cap.end > c.trimStart && cap.start < c.duration - c.trimEnd)
          .map((cap) => ({
            ...cap,
            start: Math.max(0, cap.start - c.trimStart),
            end: Math.min(effDuration, cap.end - c.trimStart),
          })),
      };
    });

    const totalSec = totalVideoDuration(state.clips);

    return {
      totalFrames: Math.max(1, Math.round(totalSec * state.fps)),
      inputProps: {
        clips,
        overlayProps: {
          overlaySrc: "",
          overlayX: state.overlayX,
          overlayY: state.overlayY,
          overlayWidth: state.overlayWidth,
          overlayHeight: state.overlayHeight,
          overlayDuration: state.overlayDuration,
          fadeDuration: state.fadeDuration,
        },
        summarySlideProps: { items: [] as any[] },
        summaryDurationInFrames: 0,
        summaryEnabled: false,
        captionSettings: {
          enabled: state.captionsEnabled,
          fontSize: state.captionFontSize,
          color: state.captionColor,
          position: state.captionPosition,
          maxWords: state.captionMaxWords,
        },
      },
    };
  }, [
    state.clips,
    state.fps,
    state.overlayX,
    state.overlayY,
    state.overlayWidth,
    state.overlayHeight,
    state.overlayDuration,
    state.fadeDuration,
    state.captionsEnabled,
    state.captionFontSize,
    state.captionColor,
    state.captionPosition,
    state.captionMaxWords,
  ]);

  return (
    <Player
      ref={playerRef}
      component={FinalVideo}
      compositionWidth={state.videoWidth}
      compositionHeight={state.videoHeight}
      durationInFrames={totalFrames}
      fps={state.fps}
      style={playerStyle}
      controls
      inputProps={inputProps}
    />
  );
};
