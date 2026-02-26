import { useEffect } from "react";

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
        fps: 30, // Default; browsers don't expose FPS directly
      });
    };

    return () => {
      video.src = "";
    };
  }, [videoSrc]);
}
