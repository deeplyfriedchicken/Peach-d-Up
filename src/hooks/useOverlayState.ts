import { useReducer } from "react";
import type { CaptionSegment, CaptionPosition } from "../types";

export interface SummaryItem {
  id: string;
  emoji: string;
  text: string;
}

export interface Clip {
  id: string;
  filePath: string;
  src: string;
  width: number;
  height: number;
  duration: number;
  fps: number;
  crossfadeDuration: number;
  captions: CaptionSegment[];
  captionStatus: "idle" | "transcribing" | "done" | "error";
}

export interface OverlayState {
  clips: Clip[];
  overlaySrc: string | null;
  overlayFilePath: string | null;
  overlayX: number;
  overlayY: number;
  overlayWidth: number;
  overlayHeight: number;
  overlayAspect: number;
  overlayDuration: number;
  fadeDuration: number;
  videoWidth: number;
  videoHeight: number;
  fps: number;
  activeTab: "overlay" | "summary";
  summaryItems: SummaryItem[];
  summaryDuration: number;
  captionsEnabled: boolean;
  captionFontSize: number;
  captionColor: string;
  captionPosition: CaptionPosition;
  captionMaxWords: number;
}

export function totalVideoDuration(clips: Clip[]): number {
  if (clips.length === 0) return 0;
  let total = 0;
  for (let i = 0; i < clips.length; i++) {
    total += clips[i].duration;
    if (i > 0) {
      total -= clips[i].crossfadeDuration;
    }
  }
  return Math.max(0, total);
}

type Action =
  | { type: "ADD_CLIPS"; clips: Array<{ id: string; filePath: string; src: string }> }
  | { type: "SET_CLIP_META"; id: string; width: number; height: number; duration: number; fps: number }
  | { type: "REMOVE_CLIP"; id: string }
  | { type: "REORDER_CLIPS"; fromIndex: number; toIndex: number }
  | { type: "SET_CLIP_CROSSFADE"; id: string; crossfadeDuration: number }
  | { type: "SET_OVERLAY"; src: string; filePath: string }
  | { type: "CLEAR_OVERLAY" }
  | { type: "SET_OVERLAY_POSITION"; x: number; y: number }
  | { type: "SET_OVERLAY_SIZE"; width: number; height: number }
  | { type: "SET_OVERLAY_DURATION"; duration: number }
  | { type: "SET_FADE_DURATION"; duration: number }
  | { type: "SET_OVERLAY_NATURAL_SIZE"; imgWidth: number; imgHeight: number }
  | { type: "SET_ACTIVE_TAB"; tab: "overlay" | "summary" }
  | { type: "ADD_SUMMARY_ITEM" }
  | { type: "REMOVE_SUMMARY_ITEM"; id: string }
  | { type: "UPDATE_SUMMARY_ITEM"; id: string; emoji?: string; text?: string }
  | { type: "SET_SUMMARY_DURATION"; duration: number }
  | { type: "SET_CAPTIONS_ENABLED"; enabled: boolean }
  | { type: "SET_CAPTION_FONT_SIZE"; fontSize: number }
  | { type: "SET_CAPTION_COLOR"; color: string }
  | { type: "SET_CAPTION_POSITION"; position: CaptionPosition }
  | { type: "SET_CAPTION_MAX_WORDS"; maxWords: number }
  | { type: "SET_CLIP_CAPTION_STATUS"; clipId: string; status: "idle" | "transcribing" | "done" | "error" }
  | { type: "SET_CLIP_CAPTIONS"; clipId: string; captions: CaptionSegment[] }
  | { type: "UPDATE_CAPTION_TEXT"; clipId: string; captionId: string; text: string };

export type { Action as OverlayAction };

const initialState: OverlayState = {
  clips: [],
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
  fps: 30,
  activeTab: "overlay",
  summaryItems: [],
  summaryDuration: 5,
  captionsEnabled: false,
  captionFontSize: 48,
  captionColor: "#FFFFFF",
  captionPosition: "bottom",
  captionMaxWords: 10,
};

function deriveDimsFromFirstClip(clips: Clip[], state: OverlayState): Partial<OverlayState> {
  if (clips.length === 0) return {};
  const first = clips[0];
  if (first.width > 0 && first.height > 0) {
    return { videoWidth: first.width, videoHeight: first.height, fps: first.fps || state.fps };
  }
  return {};
}

function reducer(state: OverlayState, action: Action): OverlayState {
  switch (action.type) {
    case "ADD_CLIPS": {
      const newClips: Clip[] = action.clips.map((c) => ({
        id: c.id,
        filePath: c.filePath,
        src: c.src,
        width: 0,
        height: 0,
        duration: 0,
        fps: 0,
        crossfadeDuration: 0.5,
        captions: [],
        captionStatus: "idle",
      }));
      const allClips = [...state.clips, ...newClips];
      return { ...state, clips: allClips, ...deriveDimsFromFirstClip(allClips, state) };
    }
    case "SET_CLIP_META": {
      const clips = state.clips.map((c) =>
        c.id === action.id
          ? { ...c, width: action.width, height: action.height, duration: action.duration, fps: action.fps }
          : c
      );
      const dims = deriveDimsFromFirstClip(clips, state);
      const total = totalVideoDuration(clips);
      return {
        ...state,
        clips,
        ...dims,
        overlayDuration: Math.min(state.overlayDuration, total > 0 ? total : state.overlayDuration),
      };
    }
    case "REMOVE_CLIP": {
      const clips = state.clips.filter((c) => c.id !== action.id);
      const dims = deriveDimsFromFirstClip(clips, state);
      return { ...state, clips, ...dims };
    }
    case "REORDER_CLIPS": {
      const clips = [...state.clips];
      const [moved] = clips.splice(action.fromIndex, 1);
      clips.splice(action.toIndex, 0, moved);
      const dims = deriveDimsFromFirstClip(clips, state);
      return { ...state, clips, ...dims };
    }
    case "SET_CLIP_CROSSFADE": {
      const clips = state.clips.map((c) =>
        c.id === action.id ? { ...c, crossfadeDuration: action.crossfadeDuration } : c
      );
      return { ...state, clips };
    }
    case "SET_OVERLAY":
      return { ...state, overlaySrc: action.src, overlayFilePath: action.filePath };
    case "CLEAR_OVERLAY":
      return { ...state, overlaySrc: null, overlayFilePath: null };
    case "SET_OVERLAY_POSITION":
      return { ...state, overlayX: action.x, overlayY: action.y };
    case "SET_OVERLAY_SIZE":
      return { ...state, overlayWidth: action.width, overlayHeight: action.height, overlayAspect: action.height / action.width };
    case "SET_OVERLAY_DURATION":
      return { ...state, overlayDuration: action.duration };
    case "SET_FADE_DURATION":
      return { ...state, fadeDuration: action.duration };
    case "SET_OVERLAY_NATURAL_SIZE": {
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
    case "SET_CAPTIONS_ENABLED":
      return { ...state, captionsEnabled: action.enabled };
    case "SET_CAPTION_FONT_SIZE":
      return { ...state, captionFontSize: action.fontSize };
    case "SET_CAPTION_COLOR":
      return { ...state, captionColor: action.color };
    case "SET_CAPTION_POSITION":
      return { ...state, captionPosition: action.position };
    case "SET_CAPTION_MAX_WORDS":
      return { ...state, captionMaxWords: action.maxWords };
    case "SET_CLIP_CAPTION_STATUS": {
      const clips = state.clips.map((c) =>
        c.id === action.clipId ? { ...c, captionStatus: action.status } : c
      );
      return { ...state, clips };
    }
    case "SET_CLIP_CAPTIONS": {
      const clips = state.clips.map((c) =>
        c.id === action.clipId ? { ...c, captions: action.captions, captionStatus: "done" as const } : c
      );
      return { ...state, clips };
    }
    case "UPDATE_CAPTION_TEXT": {
      const clips = state.clips.map((c) =>
        c.id === action.clipId
          ? {
              ...c,
              captions: c.captions.map((cap) =>
                cap.id === action.captionId ? { ...cap, text: action.text } : cap
              ),
            }
          : c
      );
      return { ...state, clips };
    }
    default:
      return state;
  }
}

export function useOverlayState() {
  return useReducer(reducer, initialState);
}
