import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";
import os from "os";
import { app } from "electron";

const execFileAsync = promisify(execFile);

interface CaptionSegment {
  id: string;
  start: number;
  end: number;
  text: string;
}

function getFFmpegPath(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "ffmpeg");
  }
  return path.join(
    __dirname,
    "..",
    "node_modules",
    "@remotion",
    "compositor-darwin-arm64",
    "ffmpeg"
  );
}

function getWhisperPaths(): { binary: string; modelPath: string } {
  if (app.isPackaged) {
    const whisperDir = path.join(process.resourcesPath, "whisper");
    return {
      binary: path.join(whisperDir, "main"),
      modelPath: path.join(whisperDir, "ggml-base.en.bin"),
    };
  }
  const whisperCppDir = path.join(
    __dirname,
    "..",
    "node_modules",
    "whisper-node",
    "lib",
    "whisper.cpp"
  );
  return {
    binary: path.join(whisperCppDir, "main"),
    modelPath: path.join(whisperCppDir, "models", "ggml-base.en.bin"),
  };
}

function parseTimestamp(ts: string): number {
  // Format: "HH:MM:SS.mmm"
  const parts = ts.split(":");
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  const seconds = parseFloat(parts[2]);
  return hours * 3600 + minutes * 60 + seconds;
}

export async function transcribeVideo(
  filePath: string
): Promise<CaptionSegment[]> {
  const ffmpegPath = getFFmpegPath();
  const { binary, modelPath } = getWhisperPaths();

  // Check whisper binary exists
  if (!fs.existsSync(binary)) {
    throw new Error(
      `Whisper binary not found at ${binary}. Run: cd node_modules/whisper-node/lib/whisper.cpp && make`
    );
  }
  if (!fs.existsSync(modelPath)) {
    throw new Error(
      `Whisper model not found at ${modelPath}. Run: npx whisper-node download`
    );
  }

  // Extract audio to 16kHz mono WAV in temp directory
  const tmpWav = path.join(
    os.tmpdir(),
    `whisper-${Date.now()}-${Math.random().toString(36).slice(2)}.wav`
  );

  try {
    // Extract audio as 16kHz mono WAV (required by whisper.cpp)
    // Set DYLD_LIBRARY_PATH so ffmpeg can find its bundled dylibs
    const ffmpegDir = path.dirname(ffmpegPath);
    await execFileAsync(
      ffmpegPath,
      ["-i", filePath, "-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le", "-y", tmpWav],
      { env: { ...process.env, DYLD_LIBRARY_PATH: ffmpegDir } }
    );

    // Run whisper.cpp directly
    const { stdout } = await execFileAsync(
      binary,
      ["-m", modelPath, "-f", tmpWav],
      { maxBuffer: 10 * 1024 * 1024 }
    );

    // Parse whisper output: lines like "[00:00:00.000 --> 00:00:03.000]   Some text"
    const lines = stdout.match(/\[[0-9:.]+\s-->\s[0-9:.]+\].*/g);
    if (!lines || lines.length === 0) {
      return [];
    }

    // Skip the first empty line that whisper typically outputs
    const segments: CaptionSegment[] = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(
        /\[(\d{2}:\d{2}:\d{2}\.\d{3})\s-->\s(\d{2}:\d{2}:\d{2}\.\d{3})\]\s*(.*)/
      );
      if (!match) continue;

      const text = match[3].trim();
      if (!text) continue;

      segments.push({
        id: crypto.randomUUID(),
        start: parseTimestamp(match[1]),
        end: parseTimestamp(match[2]),
        text,
      });
    }

    return segments;
  } finally {
    // Clean up temp WAV file
    try {
      fs.unlinkSync(tmpWav);
    } catch {
      // ignore cleanup errors
    }
  }
}
