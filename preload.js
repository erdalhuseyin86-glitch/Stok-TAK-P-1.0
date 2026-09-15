const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  sendEmail: (payload) => ipcRenderer.invoke('send-email', payload),
  printPreview: (payload) => ipcRenderer.invoke('print-preview', payload),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  windowControls: {
    minimize: () => ipcRenderer.send('win-minimize'),
    maximizeToggle: () => ipcRenderer.send('win-maximize-toggle'),
    close: () => ipcRenderer.send('win-close'),
    onStateChange: (callback) => ipcRenderer.on('window-state', (event, state) => callback(state))
  }
});
