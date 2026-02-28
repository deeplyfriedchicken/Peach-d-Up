import React, { useCallback, useRef, useState, useEffect, useMemo } from "react";
import { useOverlayState, totalVideoDuration } from "./hooks/useOverlayState";
import { computeClipStarts } from "./utils/clipStarts";
import { useClipsMeta } from "./hooks/useVideoMeta";
import { FileSelector } from "./components/FileSelector";
import { ClipList } from "./components/ClipList";
import { ClipTimeline } from "./components/ClipTimeline";
import { PlayerPreview } from "./components/PlayerPreview";
import { OverlayEditor } from "./components/OverlayEditor";
import { ControlPanel } from "./components/ControlPanel";
import { OverlayInputs } from "./components/OverlayInputs";
import { ExportPanel } from "./components/ExportPanel";
import { TabBar } from "./components/TabBar";
import { SummaryInputs } from "./components/SummaryInputs";
import { CaptionControls } from "./components/CaptionControls";
import { useTranscription } from "./hooks/useTranscription";

export const App: React.FC = () => {
  const [state, dispatch] = useOverlayState();
  const playerRef = useRef<any>(null);
  const [currentFrame, setCurrentFrame] = useState(0);

  const videoDuration = totalVideoDuration(state.clips);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    const handler = (e: { detail: { frame: number } }) => {
      setCurrentFrame(e.detail.frame);
    };
    player.addEventListener("timeupdate", handler);
    return () => player.removeEventListener("timeupdate", handler);
  }, [state.clips.length]);

  const overlayEndFrame = state.overlayDuration * state.fps;
  const fadeStartFrame = overlayEndFrame - state.fadeDuration * state.fps;
  const overlayVisible = state.overlaySrc && currentFrame < overlayEndFrame;

  let overlayOpacity = 1;
  if (currentFrame >= overlayEndFrame) {
    overlayOpacity = 0;
  } else if (currentFrame >= fadeStartFrame && fadeStartFrame < overlayEndFrame) {
    overlayOpacity = (overlayEndFrame - currentFrame) / (overlayEndFrame - fadeStartFrame);
  }

  useClipsMeta(state.clips, (id, meta) => {
    dispatch({ type: "SET_CLIP_META", id, ...meta });
  });

  useTranscription(state.clips, state.captionsEnabled, dispatch);

  const clipStartFrames = useMemo(
    () =>
      computeClipStarts(
        state.clips.map((c) => ({
          durationInFrames: Math.round(c.duration * state.fps),
          crossfadeDurationInFrames: Math.round(c.crossfadeDuration * state.fps),
        }))
      ),
    [state.clips, state.fps]
  );

  const handleSeek = useCallback(
    (frame: number) => {
      playerRef.current?.seekTo(frame);
    },
    []
  );

  const handleAddClips = useCallback(async () => {
    if (!window.electronAPI) return;
    const result = await window.electronAPI.selectVideo();
    if (result) {
      const clips = result.map((r) => ({
        id: crypto.randomUUID(),
        filePath: r.filePath,
        src: r.url,
      }));
      dispatch({ type: "ADD_CLIPS", clips });
    }
  }, [dispatch]);

  const handleSelectOverlay = useCallback(async () => {
    if (!window.electronAPI) return;
    const result = await window.electronAPI.selectPng();
    if (result) {
      dispatch({ type: "SET_OVERLAY", src: result.url, filePath: result.filePath });
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

  const totalFrames = Math.max(1, Math.round(videoDuration * state.fps));

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
        background: "#111",
        color: "#eee",
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}
    >
      {/* Title bar drag region */}
      <div
        className="drag"
        style={{
          height: 38,
          flexShrink: 0,
        }}
      />

      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
      {/* Left: Player */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <div style={{ width: "100%", maxWidth: 900 }}>
          <div style={{ position: "relative", overflow: "visible" }}>
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
          {state.activeTab === "overlay" && state.clips.length > 0 && (
            <ClipTimeline
              clips={state.clips}
              fps={state.fps}
              totalDurationInFrames={totalFrames}
              currentFrame={currentFrame}
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
            <ClipList
              clips={state.clips}
              onAddClips={handleAddClips}
              onRemoveClip={(id) => dispatch({ type: "REMOVE_CLIP", id })}
              onReorderClips={(from, to) => dispatch({ type: "REORDER_CLIPS", fromIndex: from, toIndex: to })}
              onCrossfadeChange={(id, dur) => dispatch({ type: "SET_CLIP_CROSSFADE", id, crossfadeDuration: dur })}
            />

            <CaptionControls
              captionsEnabled={state.captionsEnabled}
              captionFontSize={state.captionFontSize}
              captionColor={state.captionColor}
              captionPosition={state.captionPosition}
              captionMaxWords={state.captionMaxWords}
              clips={state.clips}
              dispatch={dispatch}
              currentFrame={currentFrame}
              fps={state.fps}
              onSeek={handleSeek}
              clipStartFrames={clipStartFrames}
            />

            <FileSelector
              overlayFilePath={state.overlayFilePath}
              onOverlaySelect={handleSelectOverlay}
              onOverlayClear={() => dispatch({ type: "CLEAR_OVERLAY" })}
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

            {state.clips.length > 0 && (
              <ControlPanel
                overlayDuration={state.overlayDuration}
                fadeDuration={state.fadeDuration}
                videoDuration={videoDuration}
                onOverlayDurationChange={(d) => dispatch({ type: "SET_OVERLAY_DURATION", duration: d })}
                onFadeDurationChange={(d) => dispatch({ type: "SET_FADE_DURATION", duration: d })}
              />
            )}
          </>
        )}

        {state.activeTab === "summary" && (
          <>
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

        <ExportPanel state={state} disabled={state.clips.length === 0} />
      </div>
      </div>
    </div>
  );
};
