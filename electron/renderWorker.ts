import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import path from "path";

interface ClipConfig {
  id: string;
  src: string;
  duration: number;
  crossfadeDuration: number;
  trimStart: number;
  trimEnd: number;
}

interface CaptionSegment {
  id: string;
  start: number;
  end: number;
  text: string;
}

interface CaptionSettings {
  enabled: boolean;
  fontSize: number;
  color: string;
  position: "top" | "center" | "bottom";
  maxWords: number;
}

interface RenderConfig {
  clips: ClipConfig[];
  overlaySrc: string;
  overlayX: number;
  overlayY: number;
  overlayWidth: number;
  overlayHeight: number;
  overlayDuration: number;
  fadeDuration: number;
  videoWidth: number;
  videoHeight: number;
  fps: number;
  outputPath: string;
  summaryEnabled: boolean;
  summaryItems: Array<{ id: string; emoji: string; text: string }>;
  summaryDuration: number;
  captionSettings?: CaptionSettings;
  clipCaptions?: Array<{ clipId: string; captions: CaptionSegment[] }>;
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

  // Calculate total clip frames accounting for crossfade overlaps and trimming
  let totalClipFrames = 0;
  for (let i = 0; i < config.clips.length; i++) {
    const c = config.clips[i];
    const effDuration = c.duration - (c.trimStart || 0) - (c.trimEnd || 0);
    totalClipFrames += Math.round(effDuration * config.fps);
    if (i > 0) {
      totalClipFrames -= Math.round(c.crossfadeDuration * config.fps);
    }
  }
  totalClipFrames = Math.max(1, totalClipFrames);

  const summaryDurationInFrames = Math.round(config.summaryDuration * config.fps);
  const totalDurationInFrames = totalClipFrames + (config.summaryEnabled ? summaryDurationInFrames : 0);

  // Build a map of clipId -> captions for merging
  const captionsMap = new Map<string, CaptionSegment[]>();
  if (config.clipCaptions) {
    for (const cc of config.clipCaptions) {
      captionsMap.set(cc.clipId, cc.captions);
    }
  }

  const clips = config.clips.map((c) => {
    const trimStart = c.trimStart || 0;
    const trimEnd = c.trimEnd || 0;
    const effDuration = c.duration - trimStart - trimEnd;
    const trimEndTime = c.duration - trimEnd;

    // Filter captions to trimmed range and offset times, matching preview behavior
    const rawCaptions = captionsMap.get(c.id) || [];
    const filteredCaptions = rawCaptions
      .filter((cap) => cap.end > trimStart && cap.start < trimEndTime)
      .map((cap) => ({
        ...cap,
        start: Math.max(0, cap.start - trimStart),
        end: Math.min(effDuration, cap.end - trimStart),
      }));

    return {
      src: c.src,
      durationInFrames: Math.max(1, Math.round(effDuration * config.fps)),
      crossfadeDurationInFrames: Math.round(c.crossfadeDuration * config.fps),
      startFrom: Math.round(trimStart * config.fps),
      captions: filteredCaptions,
    };
  });

  const inputProps = {
    clips,
    overlayProps: {
      overlaySrc: config.overlaySrc,
      overlayX: config.overlayX,
      overlayY: config.overlayY,
      overlayWidth: config.overlayWidth,
      overlayHeight: config.overlayHeight,
      overlayDuration: config.overlayDuration,
      fadeDuration: config.fadeDuration,
    },
    summarySlideProps: { items: config.summaryItems },
    summaryDurationInFrames,
    summaryEnabled: config.summaryEnabled,
    captionSettings: config.captionSettings || {
      enabled: false,
      fontSize: 48,
      color: "#FFFFFF",
      position: "bottom",
      maxWords: 10,
    },
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
