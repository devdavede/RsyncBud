const { app, ipcMain, dialog } = require('electron');
const historyStore = require('./history-store');
const { runRsync } = require('./rsync/runner');

function registerIpcHandlers(getMainWindow) {
  ipcMain.handle('get-sources', () => {
    // If packaged, args start at index 1. If not, they start at 2 e.g. "electron . file1 file2"
    const args = process.argv.slice(app.isPackaged ? 1 : 2);
    // Filter out any arguments that look like Electron flags (e.g. --allow-file-access-from-files)
    return args.filter((arg) => !arg.startsWith('--'));
  });

  ipcMain.handle('get-history', () => historyStore.readHistory());

  ipcMain.handle('save-history', (event, newHistory) => historyStore.writeHistory(newHistory));

  ipcMain.handle('choose-directory', async () => {
    const result = await dialog.showOpenDialog(getMainWindow(), {
      properties: ['openDirectory', 'createDirectory']
    });
    if (result.canceled) return null;
    return result.filePaths[0];
  });

  ipcMain.on('run-rsync', (event, options) => {
    runRsync(event, options);
  });
}

module.exports = { registerIpcHandlers };
