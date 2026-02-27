import { useEffect, useRef } from "react";
import type { Clip } from "./useOverlayState";

export function useVideoMeta(
  videoSrc: string | null,
  onMeta: (meta: { width: number; height: number; duration: number; fps: number }) => void
) {
  useEffect(() => {
    if (!videoSrc) return;

    const video = document.createElement("video");
    video.src = videoSrc;
    video.preload = "metadata";

    video.onloadedmetadata = () => {
      onMeta({
        width: video.videoWidth,
        height: video.videoHeight,
        duration: video.duration,
        fps: 30,
      });
    };

    return () => {
      video.src = "";
    };
  }, [videoSrc]);
}

export function useClipsMeta(
  clips: Clip[],
  onClipMeta: (id: string, meta: { width: number; height: number; duration: number; fps: number }) => void
) {
  const loadedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const currentIds = new Set(clips.map((c) => c.id));
    // Clean up removed clip IDs from tracking
    for (const id of loadedRef.current) {
      if (!currentIds.has(id)) {
        loadedRef.current.delete(id);
      }
    }
  }, [clips]);

  useEffect(() => {
    const cleanups: Array<() => void> = [];

    for (const clip of clips) {
      if (clip.duration > 0) continue; // already has metadata
      if (loadedRef.current.has(clip.id)) continue; // already loading

      loadedRef.current.add(clip.id);

      const video = document.createElement("video");
      video.src = clip.src;
      video.preload = "metadata";

      const clipId = clip.id;
      video.onloadedmetadata = () => {
        onClipMeta(clipId, {
          width: video.videoWidth,
          height: video.videoHeight,
          duration: video.duration,
          fps: 30,
        });
      };

      cleanups.push(() => {
        video.src = "";
      });
    }

    return () => {
      cleanups.forEach((fn) => fn());
    };
  }, [clips.map((c) => c.id).join(",")]);
}
