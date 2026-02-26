import React, { useCallback, useRef, useState, useEffect } from "react";
import { useOverlayState } from "./hooks/useOverlayState";
import { useVideoMeta } from "./hooks/useVideoMeta";
import { FileSelector } from "./components/FileSelector";
import { PlayerPreview } from "./components/PlayerPreview";
import { OverlayEditor } from "./components/OverlayEditor";
import { ControlPanel } from "./components/ControlPanel";
import { OverlayInputs } from "./components/OverlayInputs";
import { ExportPanel } from "./components/ExportPanel";
import { TabBar } from "./components/TabBar";
import { SummaryInputs } from "./components/SummaryInputs";

export const App: React.FC = () => {
  const [state, dispatch] = useOverlayState();
  const playerRef = useRef<any>(null);
  const [currentFrame, setCurrentFrame] = useState(0);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    const handler = (e: { detail: { frame: number } }) => {
      setCurrentFrame(e.detail.frame);
    };
    player.addEventListener("timeupdate", handler);
    return () => player.removeEventListener("timeupdate", handler);
  }, [state.videoSrc]);

  const overlayEndFrame = state.overlayDuration * state.fps;
  const fadeStartFrame = overlayEndFrame - state.fadeDuration * state.fps;
  const overlayVisible = state.overlaySrc && currentFrame < overlayEndFrame;

  let overlayOpacity = 1;
  if (currentFrame >= overlayEndFrame) {
    overlayOpacity = 0;
  } else if (currentFrame >= fadeStartFrame && fadeStartFrame < overlayEndFrame) {
    overlayOpacity = (overlayEndFrame - currentFrame) / (overlayEndFrame - fadeStartFrame);
  }

  useVideoMeta(state.videoSrc, (meta) => {
    dispatch({ type: "SET_VIDEO_META", ...meta });
  });

  const handleSelectVideo = useCallback(async () => {
    if (!window.electronAPI) return;
    const result = await window.electronAPI.selectVideo();
    if (result) {
      dispatch({ type: "SET_VIDEO", src: result.url, filePath: result.filePath });
    }
  }, [dispatch]);

  const handleSelectOverlay = useCallback(async () => {
    if (!window.electronAPI) return;
    const result = await window.electronAPI.selectPng();
    if (result) {
      dispatch({ type: "SET_OVERLAY", src: result.url, filePath: result.filePath });
      // Load image natural dimensions to auto-size the overlay
      const img = new Image();
      img.onload = () => {
        dispatch({
          type: "SET_OVERLAY_NATURAL_SIZE",
          imgWidth: img.naturalWidth,
          imgHeight: img.naturalHeight,
        });
      };
      img.src = result.url;
    }
  }, [dispatch]);

  return (
    <div
      className="drag"
      style={{
        display: "flex",
        height: "100vh",
        background: "#111",
        color: "#eee",
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}
    >
      {/* Left: Player */}
      <div
        className="no-drag"
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <div style={{ position: "relative", width: "100%", maxWidth: 900 }}>
          <PlayerPreview state={state} playerRef={playerRef} />
          {state.activeTab === "overlay" && (
            <OverlayEditor
              overlayX={state.overlayX}
              overlayY={state.overlayY}
              overlayWidth={state.overlayWidth}
              overlayHeight={state.overlayHeight}
              overlaySrc={state.overlaySrc}
              visible={!!overlayVisible}
              opacity={overlayOpacity}
              onPositionChange={(x, y) => dispatch({ type: "SET_OVERLAY_POSITION", x, y })}
              onSizeChange={(w, h) => dispatch({ type: "SET_OVERLAY_SIZE", width: w, height: h })}
            />
          )}
        </div>
      </div>

      {/* Right: Sidebar */}
      <div
        className="no-drag"
        style={{
          width: 280,
          borderLeft: "1px solid #2a2a2a",
          padding: 24,
          display: "flex",
          flexDirection: "column",
          gap: 28,
          overflowY: "auto",
        }}
      >
        <TabBar
          activeTab={state.activeTab}
          onTabChange={(tab) => {
            dispatch({ type: "SET_ACTIVE_TAB", tab });
            setCurrentFrame(0);
          }}
        />

        {state.activeTab === "overlay" && (
          <>
            <FileSelector
              videoFilePath={state.videoFilePath}
              overlayFilePath={state.overlayFilePath}
              onVideoSelect={handleSelectVideo}
              onOverlaySelect={handleSelectOverlay}
            />

            {state.overlaySrc && (
              <OverlayInputs
                overlayX={state.overlayX}
                overlayY={state.overlayY}
                overlayWidth={state.overlayWidth}
                overlayHeight={state.overlayHeight}
                overlayAspect={state.overlayAspect}
                onPositionChange={(x, y) => dispatch({ type: "SET_OVERLAY_POSITION", x, y })}
                onSizeChange={(w, h) => dispatch({ type: "SET_OVERLAY_SIZE", width: w, height: h })}
              />
            )}

            {state.videoSrc && (
              <ControlPanel
                overlayDuration={state.overlayDuration}
                fadeDuration={state.fadeDuration}
                videoDuration={state.videoDuration}
                onOverlayDurationChange={(d) => dispatch({ type: "SET_OVERLAY_DURATION", duration: d })}
                onFadeDurationChange={(d) => dispatch({ type: "SET_FADE_DURATION", duration: d })}
              />
            )}
          </>
        )}

        {state.activeTab === "summary" && (
          <>
            <FileSelector
              videoFilePath={state.videoFilePath}
              overlayFilePath={state.overlayFilePath}
              onVideoSelect={handleSelectVideo}
              onOverlaySelect={handleSelectOverlay}
            />

            <SummaryInputs
              items={state.summaryItems}
              summaryDuration={state.summaryDuration}
              onAddItem={() => dispatch({ type: "ADD_SUMMARY_ITEM" })}
              onRemoveItem={(id) => dispatch({ type: "REMOVE_SUMMARY_ITEM", id })}
              onUpdateItem={(id, emoji, text) => dispatch({ type: "UPDATE_SUMMARY_ITEM", id, emoji, text })}
              onDurationChange={(d) => dispatch({ type: "SET_SUMMARY_DURATION", duration: d })}
            />
          </>
        )}

        <ExportPanel state={state} disabled={!state.videoSrc} />
      </div>
    </div>
  );
};
