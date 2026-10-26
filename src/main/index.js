const { app, BrowserWindow } = require('electron');
const { createWindow, getMainWindow } = require('./window');
const { installQuickAction } = require('./quick-action');
const { registerIpcHandlers } = require('./ipc');

app.whenReady().then(() => {
  installQuickAction();
  createWindow();
  registerIpcHandlers(getMainWindow);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
