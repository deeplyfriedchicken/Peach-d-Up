export interface ClipConfig {
  id: string;
  src: string;
  duration: number;
  crossfadeDuration: number;
  trimStart: number;
  trimEnd: number;
}

export interface CaptionSegment {
  id: string;
  start: number; // seconds relative to clip start
  end: number;
  text: string;
}

export type CaptionPosition = "top" | "center" | "bottom";

export interface CaptionSettings {
  enabled: boolean;
  fontSize: number;
  color: string;
  position: CaptionPosition;
  maxWords: number;
}

export interface OverlayConfig {
  clips: ClipConfig[];
  overlaySrc: string;
  /** Overlay X position as percentage of video width (0-100) */
  overlayX: number;
  /** Overlay Y position as percentage of video height (0-100) */
  overlayY: number;
  /** Overlay width as percentage of video width (0-100) */
  overlayWidth: number;
  /** Overlay height as percentage of video height (0-100) */
  overlayHeight: number;
  /** Duration in seconds the overlay is visible */
  overlayDuration: number;
  /** Fade-out duration in seconds */
  fadeDuration: number;
  /** Video width in pixels (derived from first clip) */
  videoWidth: number;
  /** Video height in pixels (derived from first clip) */
  videoHeight: number;
  /** Video FPS (derived from first clip) */
  fps: number;
}

export interface ExportConfig extends OverlayConfig {
  outputPath: string;
  summaryEnabled: boolean;
  summaryItems: Array<{ id: string; emoji: string; text: string }>;
  summaryDuration: number;
  captionSettings: CaptionSettings;
  clipCaptions: Array<{ clipId: string; captions: CaptionSegment[] }>;
}

declare global {
  interface Window {
    electronAPI: {
      selectVideo: () => Promise<Array<{ filePath: string; url: string }> | null>;
      selectPng: () => Promise<{ filePath: string; url: string } | null>;
      selectSavePath: () => Promise<string | null>;
      exportVideo: (config: ExportConfig) => Promise<{ success: boolean; error?: string }>;
      onExportProgress: (cb: (progress: number) => void) => () => void;
      transcribeAudio: (filePath: string) => Promise<{ success: boolean; segments: CaptionSegment[]; error?: string }>;
      showExportComplete: (outputPath: string) => Promise<void>;
    };
  }
}
