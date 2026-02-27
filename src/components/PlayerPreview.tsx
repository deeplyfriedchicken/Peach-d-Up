import React from "react";
import { Player } from "@remotion/player";
import { FinalVideo } from "../compositions/FinalVideo";
import { SummarySlide } from "./SummarySlide";
import type { OverlayState } from "../hooks/useOverlayState";
import { totalVideoDuration } from "../hooks/useOverlayState";

interface PlayerPreviewProps {
  state: OverlayState;
  playerRef: React.RefObject<any>;
}

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
        style={{
          width: "100%",
          maxHeight: "calc(100vh - 80px)",
          borderRadius: 12,
          overflow: "hidden",
        }}
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

  const totalSec = totalVideoDuration(state.clips);
  const totalFrames = Math.max(1, Math.round(totalSec * state.fps));

  const clips = state.clips.map((c) => ({
    src: c.src,
    durationInFrames: Math.max(1, Math.round(c.duration * state.fps)),
    crossfadeDurationInFrames: Math.round(c.crossfadeDuration * state.fps),
  }));

  return (
    <Player
      ref={playerRef}
      component={FinalVideo}
      compositionWidth={state.videoWidth}
      compositionHeight={state.videoHeight}
      durationInFrames={totalFrames}
      fps={state.fps}
      style={{
        width: "100%",
        maxHeight: "calc(100vh - 80px)",
        borderRadius: 12,
        overflow: "hidden",
      }}
      controls
      inputProps={{
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
        summarySlideProps: { items: [] },
        summaryDurationInFrames: 0,
        summaryEnabled: false,
      }}
    />
  );
};
