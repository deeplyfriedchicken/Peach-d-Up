import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import path from "path";
import os from "os";

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
  summaryEnabled: boolean;
  summaryItems: Array<{ id: string; emoji: string; text: string }>;
  summaryDuration: number;
}

export async function renderVideo(
  config: RenderConfig,
  onProgress: (progress: number) => void
): Promise<void> {
  const rootDir = path.resolve(__dirname, "..");
  const entryPoint = path.resolve(rootDir, "src/index.ts");

  // In packaged macOS apps, cwd defaults to "/" which isn't writable.
  // Remotion's renderer walks up from cwd looking for package.json to
  // determine its cache directory. Set cwd to the app root so it finds it.
  process.chdir(rootDir);

  const bundleLocation = await bundle({
    entryPoint,
    rootDir,
    onProgress: (p) => onProgress(p * 0.2), // 0-20% for bundling
    enableCaching: false,
  });

  const videoDurationInFrames = Math.round(config.videoDuration * config.fps);
  const summaryDurationInFrames = Math.round(config.summaryDuration * config.fps);
  const totalDurationInFrames = videoDurationInFrames + (config.summaryEnabled ? summaryDurationInFrames : 0);

  const inputProps = {
    videoOverlayProps: {
      videoSrc: config.videoSrc,
      overlaySrc: config.overlaySrc,
      overlayX: config.overlayX,
      overlayY: config.overlayY,
      overlayWidth: config.overlayWidth,
      overlayHeight: config.overlayHeight,
      overlayDuration: config.overlayDuration,
      fadeDuration: config.fadeDuration,
    },
    videoDurationInFrames,
    summarySlideProps: { items: config.summaryItems },
    summaryDurationInFrames,
    summaryEnabled: config.summaryEnabled,
  };

  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: "FinalVideo",
    inputProps,
  });

  // Override composition dimensions/duration from actual video
  composition.width = config.videoWidth;
  composition.height = config.videoHeight;
  composition.durationInFrames = totalDurationInFrames;
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
