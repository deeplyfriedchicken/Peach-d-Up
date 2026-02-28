/**
 * Compute the starting frame for each clip, accounting for crossfade overlaps.
 * Clip 0 starts at frame 0. Each subsequent clip starts at
 * (previous start + previous duration - crossfade overlap).
 */
export function computeClipStarts(
  clips: { durationInFrames: number; crossfadeDurationInFrames: number }[]
): number[] {
  const starts: number[] = [];
  let cursor = 0;
  for (let i = 0; i < clips.length; i++) {
    if (i > 0) {
      cursor -= clips[i].crossfadeDurationInFrames;
    }
    starts.push(cursor);
    cursor += clips[i].durationInFrames;
  }
  return starts;
}
