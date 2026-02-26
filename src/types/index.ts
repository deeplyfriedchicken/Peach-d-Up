export interface OverlayConfig {
  videoSrc: string;
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
  /** Video width in pixels */
  videoWidth: number;
  /** Video height in pixels */
  videoHeight: number;
  /** Video duration in seconds */
  videoDuration: number;
  /** Video FPS */
  fps: number;
}

export interface ExportConfig extends OverlayConfig {
  outputPath: string;
  summaryEnabled: boolean;
  summaryItems: Array<{ id: string; emoji: string; text: string }>;
  summaryDuration: number;
}

declare global {
  interface Window {
    electronAPI: {
      selectVideo: () => Promise<{ filePath: string; url: string } | null>;
      selectPng: () => Promise<{ filePath: string; url: string } | null>;
      selectSavePath: () => Promise<string | null>;
      exportVideo: (config: ExportConfig) => Promise<{ success: boolean; error?: string }>;
      onExportProgress: (cb: (progress: number) => void) => () => void;
    };
  }
}
