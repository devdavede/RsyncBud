const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getSources: () => ipcRenderer.invoke('get-sources'),
  getHistory: () => ipcRenderer.invoke('get-history'),
  saveHistory: (data) => ipcRenderer.invoke('save-history', data),
  chooseDirectory: () => ipcRenderer.invoke('choose-directory'),
  runRsync: (options) => ipcRenderer.send('run-rsync', options),
  onRsyncStdout: (callback) => ipcRenderer.on('rsync-stdout', (_event, data) => callback(data)),
  onRsyncStderr: (callback) => ipcRenderer.on('rsync-stderr', (_event, data) => callback(data)),
  onRsyncExit: (callback) => ipcRenderer.on('rsync-exit', (_event, code) => callback(code))
});
