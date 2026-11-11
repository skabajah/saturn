const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('saturn', {
  minimize:         () => ipcRenderer.invoke('win:minimize'),
  toggleMaximize:   () => ipcRenderer.invoke('win:toggleMaximize'),
  close:            () => ipcRenderer.invoke('win:close'),
  isMaximized:      () => ipcRenderer.invoke('win:isMaximized'),
  toggleFullscreen: () => ipcRenderer.invoke('win:toggleFullscreen'),
  openMedia:        () => ipcRenderer.invoke('dialog:openMedia'),
  platform: process.platform
});