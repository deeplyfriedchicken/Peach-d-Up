import express from "express";
import crypto from "crypto";
import path from "path";
import fs from "fs";
import { AddressInfo } from "net";

const tokenToPath = new Map<string, string>();

export function registerFile(filePath: string, port: number): string {
  // Reuse token if already registered
  for (const [token, p] of tokenToPath) {
    if (p === filePath) {
      return `http://localhost:${port}/media/${token}`;
    }
  }
  const token = crypto.randomBytes(16).toString("hex");
  tokenToPath.set(token, filePath);
  return `http://localhost:${port}/media/${token}`;
}

export function startFileServer(): Promise<number> {
  return new Promise((resolve) => {
    const app = express();

    app.get("/media/:token", (req, res) => {
      const filePath = tokenToPath.get(req.params.token);
      if (!filePath || !fs.existsSync(filePath)) {
        res.status(404).send("Not found");
        return;
      }

      const stat = fs.statSync(filePath);
      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes: Record<string, string> = {
        ".mp4": "video/mp4",
        ".mov": "video/quicktime",
        ".webm": "video/webm",
        ".mkv": "video/x-matroska",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".webp": "image/webp",
      };
      const contentType = mimeTypes[ext] || "application/octet-stream";

      // Support range requests for video seeking
      const range = req.headers.range;
      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
        res.writeHead(206, {
          "Content-Range": `bytes ${start}-${end}/${stat.size}`,
          "Accept-Ranges": "bytes",
          "Content-Length": end - start + 1,
          "Content-Type": contentType,
          "Access-Control-Allow-Origin": "*",
        });
        fs.createReadStream(filePath, { start, end }).pipe(res);
      } else {
        res.writeHead(200, {
          "Content-Length": stat.size,
          "Content-Type": contentType,
          "Access-Control-Allow-Origin": "*",
        });
        fs.createReadStream(filePath).pipe(res);
      }
    });

    const server = app.listen(0, () => {
      const port = (server.address() as AddressInfo).port;
      console.log(`File server running on port ${port}`);
      resolve(port);
    });
  });
}
