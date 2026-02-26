import { useReducer } from "react";

export interface SummaryItem {
  id: string;
  emoji: string;
  text: string;
}

export interface OverlayState {
  videoSrc: string | null;
  videoFilePath: string | null;
  overlaySrc: string | null;
  overlayFilePath: string | null;
  overlayX: number;
  overlayY: number;
  overlayWidth: number;
  overlayHeight: number;
  /** Image aspect ratio (height/width) adjusted for video aspect, used to keep size proportional */
  overlayAspect: number;
  overlayDuration: number;
  fadeDuration: number;
  videoWidth: number;
  videoHeight: number;
  videoDuration: number;
  fps: number;
  activeTab: "overlay" | "summary";
  summaryItems: SummaryItem[];
  summaryDuration: number;
}

type Action =
  | { type: "SET_VIDEO"; src: string; filePath: string }
  | { type: "SET_OVERLAY"; src: string; filePath: string }
  | { type: "SET_OVERLAY_POSITION"; x: number; y: number }
  | { type: "SET_OVERLAY_SIZE"; width: number; height: number }
  | { type: "SET_OVERLAY_DURATION"; duration: number }
  | { type: "SET_FADE_DURATION"; duration: number }
  | { type: "SET_VIDEO_META"; width: number; height: number; duration: number; fps: number }
  | { type: "SET_OVERLAY_NATURAL_SIZE"; imgWidth: number; imgHeight: number }
  | { type: "SET_ACTIVE_TAB"; tab: "overlay" | "summary" }
  | { type: "ADD_SUMMARY_ITEM" }
  | { type: "REMOVE_SUMMARY_ITEM"; id: string }
  | { type: "UPDATE_SUMMARY_ITEM"; id: string; emoji?: string; text?: string }
  | { type: "SET_SUMMARY_DURATION"; duration: number };

const initialState: OverlayState = {
  videoSrc: null,
  videoFilePath: null,
  overlaySrc: null,
  overlayFilePath: null,
  overlayX: 0,
  overlayY: 0,
  overlayWidth: 100,
  overlayHeight: 100,
  overlayAspect: 1,
  overlayDuration: 5,
  fadeDuration: 1,
  videoWidth: 1920,
  videoHeight: 1080,
  videoDuration: 10,
  fps: 30,
  activeTab: "overlay",
  summaryItems: [],
  summaryDuration: 5,
};

function reducer(state: OverlayState, action: Action): OverlayState {
  switch (action.type) {
    case "SET_VIDEO":
      return { ...state, videoSrc: action.src, videoFilePath: action.filePath };
    case "SET_OVERLAY":
      return { ...state, overlaySrc: action.src, overlayFilePath: action.filePath };
    case "SET_OVERLAY_POSITION":
      return { ...state, overlayX: action.x, overlayY: action.y };
    case "SET_OVERLAY_SIZE":
      return { ...state, overlayWidth: action.width, overlayHeight: action.height, overlayAspect: action.height / action.width };
    case "SET_OVERLAY_DURATION":
      return { ...state, overlayDuration: action.duration };
    case "SET_FADE_DURATION":
      return { ...state, fadeDuration: action.duration };
    case "SET_VIDEO_META":
      return {
        ...state,
        videoWidth: action.width,
        videoHeight: action.height,
        videoDuration: action.duration,
        fps: action.fps,
        overlayDuration: Math.min(state.overlayDuration, action.duration),
      };
    case "SET_OVERLAY_NATURAL_SIZE": {
      // Fill video width, preserve aspect ratio, top-center
      const widthPct = 100;
      const aspectRatio = action.imgHeight / action.imgWidth;
      const heightPct = widthPct * aspectRatio * (state.videoWidth / state.videoHeight);
      return {
        ...state,
        overlayWidth: widthPct,
        overlayHeight: heightPct,
        overlayAspect: heightPct / widthPct,
        overlayX: 0,
        overlayY: 0,
      };
    }
    case "SET_ACTIVE_TAB":
      return { ...state, activeTab: action.tab };
    case "ADD_SUMMARY_ITEM":
      return {
        ...state,
        summaryItems: [...state.summaryItems, { id: crypto.randomUUID(), emoji: "", text: "" }],
      };
    case "REMOVE_SUMMARY_ITEM":
      return {
        ...state,
        summaryItems: state.summaryItems.filter((item) => item.id !== action.id),
      };
    case "UPDATE_SUMMARY_ITEM":
      return {
        ...state,
        summaryItems: state.summaryItems.map((item) =>
          item.id === action.id
            ? { ...item, ...(action.emoji !== undefined && { emoji: action.emoji }), ...(action.text !== undefined && { text: action.text }) }
            : item
        ),
      };
    case "SET_SUMMARY_DURATION":
      return { ...state, summaryDuration: action.duration };
    default:
      return state;
  }
}

export function useOverlayState() {
  return useReducer(reducer, initialState);
}
