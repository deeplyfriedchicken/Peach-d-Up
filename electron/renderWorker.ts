import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import path from "path";

interface RenderConfig {
  videoSrc: string;
  overlaySrc: string;
  overlayX: number;
  overlayY: number;
  overlayWidth: number;
  overlayHeight: number;
  overlayDuration: number;
  fadeDuration: number;
  videoWidth: number;
  videoHeight: number;
  videoDuration: number;
  fps: number;
  outputPath: string;
}

export async function renderVideo(
  config: RenderConfig,
  onProgress: (progress: number) => void
): Promise<void> {
  const entryPoint = path.resolve(__dirname, "../src/index.ts");

  const bundleLocation = await bundle({
    entryPoint,
    onProgress: (p) => onProgress(p * 0.2), // 0-20% for bundling
  });

  const inputProps = {
    videoSrc: config.videoSrc,
    overlaySrc: config.overlaySrc,
    overlayX: config.overlayX,
    overlayY: config.overlayY,
    overlayWidth: config.overlayWidth,
    overlayHeight: config.overlayHeight,
    overlayDuration: config.overlayDuration,
    fadeDuration: config.fadeDuration,
  };

  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: "VideoOverlay",
    inputProps,
  });

  // Override composition dimensions/duration from actual video
  composition.width = config.videoWidth;
  composition.height = config.videoHeight;
  composition.durationInFrames = Math.round(config.videoDuration * config.fps);
  composition.fps = config.fps;

  await renderMedia({
    composition,
    serveUrl: bundleLocation,
    codec: "h264",
    outputLocation: config.outputPath,
    inputProps,
    onProgress: ({ progress }) => {
      onProgress(0.2 + progress * 0.8); // 20-100% for rendering
    },
  });
}
