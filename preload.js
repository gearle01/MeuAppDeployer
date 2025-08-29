// preload.js

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    selectLogo: () => ipcRenderer.invoke('select-logo'),
    startDeploy: (link, color, logoPath) => ipcRenderer.invoke('start-deploy', link, color, logoPath)
});