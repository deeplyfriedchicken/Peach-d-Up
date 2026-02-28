import type { CaptionSegment } from "../types";

export interface CaptionChunk {
  start: number;
  end: number;
  text: string;
}

/**
 * Split a caption segment into chunks of at most `maxWords` words,
 * distributing the time evenly across chunks.
 */
export function splitSegment(seg: CaptionSegment, maxWords: number): CaptionChunk[] {
  const words = seg.text.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) {
    return [{ start: seg.start, end: seg.end, text: seg.text }];
  }

  const chunks: CaptionChunk[] = [];
  const totalDuration = seg.end - seg.start;
  const numChunks = Math.ceil(words.length / maxWords);
  const chunkDuration = totalDuration / numChunks;

  for (let i = 0; i < numChunks; i++) {
    const chunkWords = words.slice(i * maxWords, (i + 1) * maxWords);
    chunks.push({
      start: seg.start + i * chunkDuration,
      end: seg.start + (i + 1) * chunkDuration,
      text: chunkWords.join(" "),
    });
  }

  return chunks;
}
