<<<<<<< HEAD
// preload.js

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    selectLogo: () => ipcRenderer.invoke('select-logo'),
    startDeploy: (link, color, logoPath) => ipcRenderer.invoke('start-deploy', link, color, logoPath)
=======
// preload.js

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    selectLogo: () => ipcRenderer.invoke('select-logo'),
    startDeploy: (link, color, logoPath) => ipcRenderer.invoke('start-deploy', link, color, logoPath)
>>>>>>> 458222c21063fcd8fed25c018e8b669b847ef347
});