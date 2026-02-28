import { app, BrowserWindow, ipcMain, dialog, Notification, shell } from "electron";
import path from "path";
import { startFileServer, registerFile } from "./fileServer";
import { renderVideo } from "./renderWorker";
import { transcribeVideo } from "./transcribe";

let mainWindow: BrowserWindow | null = null;
let fileServerPort: number;

const isDev = !app.isPackaged;

async function createWindow() {
  fileServerPort = await startFileServer();

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 600,
    titleBarStyle: "hiddenInset",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  app.quit();
});

// ---- IPC Handlers ----

ipcMain.handle("select-video", async () => {
  const result = await dialog.showOpenDialog({
    filters: [{ name: "Video", extensions: ["mp4", "mov", "webm", "mkv"] }],
    properties: ["openFile", "multiSelections"],
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths.map((fp) => ({
    filePath: fp,
    url: registerFile(fp, fileServerPort),
  }));
});

ipcMain.handle("select-png", async () => {
  const result = await dialog.showOpenDialog({
    filters: [{ name: "Image", extensions: ["png", "jpg", "jpeg", "webp"] }],
    properties: ["openFile"],
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  const filePath = result.filePaths[0];
  const url = registerFile(filePath, fileServerPort);
  return { filePath, url };
});

ipcMain.handle("select-save-path", async () => {
  const now = new Date();
  const ts = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const result = await dialog.showSaveDialog({
    filters: [{ name: "MP4 Video", extensions: ["mp4"] }],
    defaultPath: `${ts}.mp4`,
  });
  if (result.canceled || !result.filePath) return null;
  return result.filePath;
});

ipcMain.handle("transcribe-audio", async (_event, filePath: string) => {
  try {
    const segments = await transcribeVideo(filePath);
    return { success: true, segments };
  } catch (err: any) {
    return { success: false, segments: [], error: err.message };
  }
});

ipcMain.handle("export-video", async (event, config) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  try {
    await renderVideo(config, (progress: number) => {
      win?.webContents.send("export-progress", progress);
    });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle("show-export-complete", async (event, outputPath: string) => {
  // Native notification
  if (Notification.isSupported()) {
    const notification = new Notification({
      title: "Export Complete",
      body: path.basename(outputPath),
    });
    notification.show();
  }

  // Dialog with "Show in Finder" option
  const win = BrowserWindow.fromWebContents(event.sender);
  const result = await dialog.showMessageBox(win!, {
    type: "info",
    title: "Export Complete",
    message: "Your video has been exported successfully.",
    detail: outputPath,
    buttons: ["Show in Finder", "OK"],
    defaultId: 0,
  });

  if (result.response === 0) {
    shell.showItemInFolder(outputPath);
  }
});
