const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('api', {
  platform: process.platform,
  getPathForFile: (file) => webUtils.getPathForFile(file),
  logFromRenderer: (message) => ipcRenderer.invoke('log-from-renderer', message),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  openChangelog: () => ipcRenderer.invoke('open-changelog'),
  selectFile: () => ipcRenderer.invoke('select-file'),
  selectExe: () => ipcRenderer.invoke('select-exe'),
  checkExePath: () => ipcRenderer.invoke('check-exe-path'),
  verifyPath: (filePath, type) => ipcRenderer.invoke('verify-path', filePath, type),
  getMediainfo: (filePath, mediainfoPath, deep) => ipcRenderer.invoke('get-mediainfo', filePath, mediainfoPath, deep),
  compareVideos: (cmdStr) => ipcRenderer.invoke('compare-videos', cmdStr)
});
