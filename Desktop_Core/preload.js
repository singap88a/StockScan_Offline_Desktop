const { contextBridge, ipcRenderer } = require('electron');

// Brinding safety between main process and renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Add any IPC bridges here if needed
  platform: process.platform,
});
