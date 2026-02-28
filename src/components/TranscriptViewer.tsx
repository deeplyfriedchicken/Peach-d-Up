import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import type { Clip } from "../hooks/useOverlayState";
import type { OverlayAction } from "../hooks/useOverlayState";
import { splitSegment } from "../utils/splitCaptions";
import type { CaptionChunk } from "../utils/splitCaptions";

interface TranscriptViewerProps {
  clip: Clip;
  clipIndex: number;
  clipStartFrame: number;
  clipDurationInFrames: number;
  fps: number;
  currentFrame: number;
  maxWords: number;
  onSeek: (frame: number) => void;
  dispatch: React.Dispatch<OverlayAction>;
}

function truncateFilename(filePath: string, maxLen = 20): string {
  const parts = filePath.split("/");
  const full = parts[parts.length - 1] || filePath;
  if (full.length <= maxLen) return full;

  const dotIdx = full.lastIndexOf(".");
  if (dotIdx <= 0) return full.slice(0, maxLen - 3) + "...";

  const name = full.slice(0, dotIdx);
  const ext = full.slice(dotIdx);
  const available = maxLen - ext.length - 3;
  if (available <= 0) return full.slice(0, maxLen - 3) + "...";
  return name.slice(0, available) + "..." + ext;
}

interface FlatMatch {
  charStart: number;
  charEnd: number;
}

function findMatches(text: string, query: string): FlatMatch[] {
  if (!query) return [];
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  const results: FlatMatch[] = [];
  let pos = 0;
  while (pos < lower.length) {
    const idx = lower.indexOf(q, pos);
    if (idx === -1) break;
    results.push({ charStart: idx, charEnd: idx + q.length });
    pos = idx + 1;
  }
  return results;
}

function renderHighlightedText(
  text: string,
  matches: FlatMatch[],
  currentMatchIdx: number,
  matchRefs: React.MutableRefObject<(HTMLSpanElement | null)[]>,
): React.ReactNode[] {
  if (matches.length === 0) return [text];
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    if (m.charStart > cursor) {
      parts.push(text.slice(cursor, m.charStart));
    }
    const isCurrent = i === currentMatchIdx;
    parts.push(
      <span
        key={m.charStart}
        ref={(el) => { matchRefs.current[i] = el; }}
        style={{
          background: isCurrent ? "#FF5C2A" : "rgba(255,200,0,0.4)",
          color: isCurrent ? "#fff" : "inherit",
          borderRadius: 2,
          padding: "0 1px",
        }}
      >
        {text.slice(m.charStart, m.charEnd)}
      </span>
    );
    cursor = m.charEnd;
  }
  if (cursor < text.length) {
    parts.push(text.slice(cursor));
  }
  return parts;
}

// Shared textarea/overlay styles to keep them perfectly aligned
const sharedTextStyle: React.CSSProperties = {
  fontSize: 11,
  fontFamily: "inherit",
  lineHeight: 1.4,
  padding: 6,
  whiteSpace: "pre-wrap",
  wordWrap: "break-word",
  overflowWrap: "break-word",
};

export const TranscriptViewer: React.FC<TranscriptViewerProps> = ({
  clip,
  clipIndex,
  clipStartFrame,
  clipDurationInFrames,
  fps,
  currentFrame,
  maxWords,
  onSeek,
  dispatch,
}) => {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [search, setSearch] = useState("");
  const [matchIndex, setMatchIndex] = useState(0);
  const activeRef = useRef<HTMLSpanElement>(null);
  const matchRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const editMatchRefs = useRef<(HTMLSpanElement | null)[]>([]);

  // Filter captions to only those within the trimmed range, offset by trimStart
  const trimmedCaptions = useMemo(() => {
    const trimEnd = clip.duration - clip.trimEnd;
    return clip.captions
      .filter((cap) => cap.end > clip.trimStart && cap.start < trimEnd)
      .map((cap) => ({
        ...cap,
        start: Math.max(0, cap.start - clip.trimStart),
        end: Math.min(trimEnd - clip.trimStart, cap.end - clip.trimStart),
      }));
  }, [clip.captions, clip.trimStart, clip.trimEnd, clip.duration]);

  const captions = trimmedCaptions;
  const displayName = truncateFilename(clip.filePath);

  // Split captions into display chunks based on maxWords (matches video overlay)
  const chunks = useMemo(
    () => captions.flatMap((seg) => splitSegment(seg, maxWords)),
    [captions, maxWords]
  );

  // Find active chunk based on currentFrame — only if playhead is within this clip
  const activeChunkIndex = useMemo(() => {
    const relativeFrame = currentFrame - clipStartFrame;
    if (relativeFrame < 0 || relativeFrame >= clipDurationInFrames) return -1;
    const relativeTime = relativeFrame / fps;
    for (let i = 0; i < chunks.length; i++) {
      if (relativeTime >= chunks[i].start && relativeTime < chunks[i].end) {
        return i;
      }
    }
    return -1;
  }, [currentFrame, clipStartFrame, clipDurationInFrames, fps, chunks]);

  // Keep old name for auto-scroll effect
  const activeSegmentIndex = activeChunkIndex;

  // Auto-scroll to active segment
  useEffect(() => {
    if (!editing && activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [activeSegmentIndex, editing]);

  // View mode: search against chunks
  const viewSearchResults = useMemo(() => {
    if (editing || !search.trim()) return [];
    const query = search.toLowerCase();
    const results: { segIndex: number; charStart: number; charEnd: number }[] = [];
    for (let s = 0; s < chunks.length; s++) {
      const text = chunks[s].text.toLowerCase();
      let pos = 0;
      while (pos < text.length) {
        const idx = text.indexOf(query, pos);
        if (idx === -1) break;
        results.push({ segIndex: s, charStart: idx, charEnd: idx + query.length });
        pos = idx + 1;
      }
    }
    return results;
  }, [search, chunks, editing]);

  // Edit mode: search against flat editText
  const editSearchResults = useMemo(() => {
    if (!editing || !search.trim()) return [];
    return findMatches(editText, search);
  }, [search, editText, editing]);

  const totalMatches = editing ? editSearchResults.length : viewSearchResults.length;

  // Reset matchIndex when results change
  useEffect(() => {
    setMatchIndex(0);
  }, [totalMatches]);

  // View mode: scroll to current match
  useEffect(() => {
    if (!editing && viewSearchResults.length > 0 && matchRefs.current[matchIndex]) {
      matchRefs.current[matchIndex]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [matchIndex, viewSearchResults.length, editing]);

  // Edit mode: scroll highlight overlay to show current match
  useEffect(() => {
    if (!editing || editSearchResults.length === 0) return;
    const el = editMatchRefs.current[matchIndex];
    if (!el || !overlayRef.current) return;
    const container = overlayRef.current;
    const elTop = el.offsetTop;
    const elHeight = el.offsetHeight;
    const scrollTop = elTop - container.clientHeight / 2 + elHeight / 2;
    container.scrollTop = Math.max(0, scrollTop);
    if (textareaRef.current) {
      textareaRef.current.scrollTop = container.scrollTop;
    }
  }, [matchIndex, editSearchResults, editing]);

  // Sync textarea scroll to highlight overlay
  const handleTextareaScroll = useCallback(() => {
    if (textareaRef.current && overlayRef.current) {
      overlayRef.current.scrollTop = textareaRef.current.scrollTop;
      overlayRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, []);

  const handleChunkClick = useCallback(
    (chunk: CaptionChunk) => {
      const frame = clipStartFrame + Math.round(chunk.start * fps);
      onSeek(frame);
    },
    [clipStartFrame, fps, onSeek]
  );

  const handleEditDone = useCallback(() => {
    const lines = editText.split("\n");
    captions.forEach((cap, j) => {
      const newText = lines[j] ?? "";
      if (newText !== cap.text) {
        dispatch({
          type: "UPDATE_CAPTION_TEXT",
          clipId: clip.id,
          captionId: cap.id,
          text: newText,
        });
      }
    });
    setEditing(false);
  }, [editText, captions, dispatch, clip.id]);

  const handleStartEdit = useCallback(() => {
    setEditText(captions.map((c) => c.text).join("\n"));
    setEditing(true);
  }, [captions]);

  // Render highlighted text for a view-mode chunk
  const renderChunkText = (chunk: CaptionChunk, chunkIndex: number) => {
    const chunkMatches = viewSearchResults.filter((r) => r.segIndex === chunkIndex);
    if (chunkMatches.length === 0) return chunk.text;

    const parts: React.ReactNode[] = [];
    let cursor = 0;
    const text = chunk.text;

    for (const match of chunkMatches) {
      if (match.charStart > cursor) {
        parts.push(text.slice(cursor, match.charStart));
      }
      const globalMatchIdx = viewSearchResults.indexOf(match);
      const isCurrent = globalMatchIdx === matchIndex;
      parts.push(
        <span
          key={`${chunkIndex}-${match.charStart}`}
          ref={(el) => { matchRefs.current[globalMatchIdx] = el; }}
          style={{
            background: isCurrent ? "#FF5C2A" : "rgba(255,200,0,0.4)",
            color: isCurrent ? "#fff" : "inherit",
            borderRadius: 2,
            padding: "0 1px",
          }}
        >
          {text.slice(match.charStart, match.charEnd)}
        </span>
      );
      cursor = match.charEnd;
    }
    if (cursor < text.length) {
      parts.push(text.slice(cursor));
    }
    return parts;
  };

  // Build the highlight overlay content for edit mode
  const editOverlayContent = useMemo(() => {
    if (!editing) return null;
    return renderHighlightedText(editText, editSearchResults, matchIndex, editMatchRefs);
  }, [editing, editText, editSearchResults, matchIndex]);

  return (
    <div
      style={{
        background: "#1a1a1a",
        borderRadius: 6,
        padding: 8,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 6,
          fontSize: 11,
          color: "#aaa",
        }}
      >
        <span
          style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
          title={clip.filePath}
        >
          {displayName}
        </span>
        {clip.captionStatus === "transcribing" && (
          <span style={{ color: "#FF5C2A", flexShrink: 0 }}>transcribing...</span>
        )}
        {clip.captionStatus === "done" && (
          <span style={{ color: "#4a4", flexShrink: 0 }}>done</span>
        )}
        {clip.captionStatus === "error" && (
          <span style={{ color: "#f44", flexShrink: 0 }}>error</span>
        )}
        <div style={{ flex: 1 }} />
        {clip.captionStatus === "done" && !editing && (
          <button
            onClick={handleStartEdit}
            style={{
              background: "none",
              border: "1px solid #444",
              borderRadius: 4,
              color: "#aaa",
              fontSize: 10,
              padding: "2px 8px",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            Edit
          </button>
        )}
        {editing && (
          <button
            onClick={handleEditDone}
            style={{
              background: "rgba(255,92,42,0.15)",
              border: "1px solid #FF5C2A",
              borderRadius: 4,
              color: "#FF5C2A",
              fontSize: 10,
              padding: "2px 8px",
              cursor: "pointer",
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            Done
          </button>
        )}
      </div>

      {clip.captionStatus === "done" && (
        <>
          {/* Search bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              marginBottom: 6,
            }}
          >
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                flex: 1,
                background: "#222",
                border: "1px solid #333",
                borderRadius: 4,
                color: "#ddd",
                fontSize: 10,
                padding: "3px 6px",
                outline: "none",
              }}
            />
            {totalMatches > 0 && (
              <>
                <span style={{ fontSize: 10, color: "#888", whiteSpace: "nowrap" }}>
                  {matchIndex + 1} of {totalMatches}
                </span>
                <button
                  onClick={() =>
                    setMatchIndex((prev) =>
                      prev > 0 ? prev - 1 : totalMatches - 1
                    )
                  }
                  style={navBtnStyle}
                  title="Previous match"
                >
                  &#9650;
                </button>
                <button
                  onClick={() =>
                    setMatchIndex((prev) =>
                      prev < totalMatches - 1 ? prev + 1 : 0
                    )
                  }
                  style={navBtnStyle}
                  title="Next match"
                >
                  &#9660;
                </button>
              </>
            )}
            {search.trim() && totalMatches === 0 && (
              <span style={{ fontSize: 10, color: "#666", whiteSpace: "nowrap" }}>
                0 matches
              </span>
            )}
          </div>

          {/* Edit mode — textarea with highlight overlay */}
          {editing && (
            <div style={{ position: "relative" }}>
              {/* Highlight overlay — renders behind textarea text */}
              <div
                ref={overlayRef}
                aria-hidden
                style={{
                  ...sharedTextStyle,
                  position: "absolute",
                  inset: 0,
                  background: "#222",
                  border: "1px solid transparent",
                  borderRadius: 4,
                  color: "#ddd",
                  overflow: "hidden",
                  pointerEvents: "none",
                }}
              >
                {editOverlayContent}
              </div>
              {/* Actual textarea — transparent text so highlights show through */}
              <textarea
                ref={textareaRef}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onScroll={handleTextareaScroll}
                style={{
                  ...sharedTextStyle,
                  width: "100%",
                  height: 160,
                  background: search.trim() ? "transparent" : "#222",
                  border: "1px solid #333",
                  borderRadius: 4,
                  color: search.trim() ? "transparent" : "#ddd",
                  caretColor: "#ddd",
                  resize: "vertical",
                  position: "relative",
                  zIndex: 1,
                }}
              />
            </div>
          )}

          {/* View mode — transcript chunks (split by maxWords) */}
          {!editing && (
            <div
              ref={containerRef}
              style={{
                maxHeight: 160,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              {chunks.map((chunk, i) => {
                const isActive = i === activeChunkIndex;
                return (
                  <span
                    key={`${chunk.start}-${i}`}
                    ref={isActive ? activeRef : undefined}
                    onClick={() => handleChunkClick(chunk)}
                    style={{
                      display: "block",
                      cursor: "pointer",
                      fontSize: 12,
                      lineHeight: 1.6,
                      padding: "4px 6px",
                      borderRadius: 3,
                      color: isActive ? "#fff" : "#ccc",
                      background: isActive
                        ? "rgba(255,92,42,0.25)"
                        : "transparent",
                      transition: "background 0.15s",
                    }}
                  >
                    {renderChunkText(chunk, i)}
                  </span>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

const navBtnStyle: React.CSSProperties = {
  background: "none",
  border: "1px solid #444",
  borderRadius: 3,
  color: "#aaa",
  fontSize: 8,
  padding: "1px 4px",
  cursor: "pointer",
  lineHeight: 1,
};
