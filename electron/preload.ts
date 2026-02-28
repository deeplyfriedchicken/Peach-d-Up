import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  selectVideo: () => ipcRenderer.invoke("select-video"),
  selectPng: () => ipcRenderer.invoke("select-png"),
  selectSavePath: () => ipcRenderer.invoke("select-save-path"),
  exportVideo: (config: any) => ipcRenderer.invoke("export-video", config),
  transcribeAudio: (filePath: string) => ipcRenderer.invoke("transcribe-audio", filePath),
  onExportProgress: (cb: (progress: number) => void) => {
    const handler = (_event: any, progress: number) => cb(progress);
    ipcRenderer.on("export-progress", handler);
    return () => ipcRenderer.removeListener("export-progress", handler);
  },
  showExportComplete: (outputPath: string) => ipcRenderer.invoke("show-export-complete", outputPath),
});
