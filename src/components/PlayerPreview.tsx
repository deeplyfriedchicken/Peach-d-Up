import React from "react";
import { Player } from "@remotion/player";
import { VideoOverlay } from "../Composition";
import { SummarySlide } from "./SummarySlide";
import type { OverlayState } from "../hooks/useOverlayState";

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

  if (!state.videoSrc) {
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
        Select a video to get started
      </div>
    );
  }

  const durationInFrames = Math.max(1, Math.round(state.videoDuration * state.fps));

  return (
    <Player
      ref={playerRef}
      component={VideoOverlay}
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
        videoSrc: state.videoSrc,
        overlaySrc: "",
        overlayX: state.overlayX,
        overlayY: state.overlayY,
        overlayWidth: state.overlayWidth,
        overlayHeight: state.overlayHeight,
        overlayDuration: state.overlayDuration,
        fadeDuration: state.fadeDuration,
      }}
    />
  );
};
