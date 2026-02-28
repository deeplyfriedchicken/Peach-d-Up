import { useEffect, useRef } from "react";
import type { Clip, OverlayAction } from "./useOverlayState";

export function useTranscription(
  clips: Clip[],
  captionsEnabled: boolean,
  dispatch: React.Dispatch<OverlayAction>
) {
  const pendingRef = useRef<Set<string>>(new Set());
  const clipsRef = useRef(clips);
  clipsRef.current = clips;

  // Only re-run when captionsEnabled changes or clip IDs/statuses change
  const clipKey = clips
    .map((c) => `${c.id}:${c.captionStatus}:${c.duration > 0 ? 1 : 0}`)
    .join(",");

  useEffect(() => {
    if (!captionsEnabled || !window.electronAPI) return;

    for (const clip of clipsRef.current) {
      if (
        clip.captionStatus === "idle" &&
        clip.duration > 0 &&
        !pendingRef.current.has(clip.id)
      ) {
        pendingRef.current.add(clip.id);
        dispatch({
          type: "SET_CLIP_CAPTION_STATUS",
          clipId: clip.id,
          status: "transcribing",
        });

        window.electronAPI
          .transcribeAudio(clip.filePath)
          .then((result) => {
            if (result.success) {
              dispatch({
                type: "SET_CLIP_CAPTIONS",
                clipId: clip.id,
                captions: result.segments,
              });
            } else {
              console.error(
                `[transcription] Failed for clip ${clip.id}:`,
                result.error
              );
              dispatch({
                type: "SET_CLIP_CAPTION_STATUS",
                clipId: clip.id,
                status: "error",
              });
            }
          })
          .catch((err) => {
            console.error(`[transcription] Error for clip ${clip.id}:`, err);
            dispatch({
              type: "SET_CLIP_CAPTION_STATUS",
              clipId: clip.id,
              status: "error",
            });
          })
          .finally(() => {
            pendingRef.current.delete(clip.id);
          });
      }
    }
  }, [clipKey, captionsEnabled, dispatch]);
}
