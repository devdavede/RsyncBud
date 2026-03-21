const {app, BrowserWindow, ipcMain, dialog} = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const {spawn} = require('child_process');

let mainWindow;

function createWindow () {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 650,
    icon: path.join(__dirname, 'assets', 'logo.png'),
    titleBarStyle: 'hidden',
    trafficLightPosition: {x: 16, y: 16},
    vibrancy: 'under-window',
    visualEffectState: 'active',
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      // Security best practices:
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.loadFile('index.html');
}

function installQuickAction () {
  if (process.platform !== 'darwin') return;

  const targetServicesDir = path.join(os.homedir(), 'Library', 'Services');
  const targetWorkflow = path.join(targetServicesDir, 'RsyncBud.workflow');

  // Find where the bundled workflow is located (in dev or packaged app)
  let sourceWorkflow = path.join(__dirname, 'assets', 'RsyncBud.workflow');
  if (app.isPackaged) {
    sourceWorkflow = path.join(process.resourcesPath, 'assets', 'RsyncBud.workflow');
  }

  try {
    if (!fs.existsSync(targetServicesDir)) {
      fs.mkdirSync(targetServicesDir, {recursive: true});
    }

    // Auto-install it if the user doesn't have it yet
    if (!fs.existsSync(targetWorkflow) && fs.existsSync(sourceWorkflow)) {
      fs.cpSync(sourceWorkflow, targetWorkflow, {recursive: true});
      console.log('Successfully auto-installed RsyncBud Quick Action to macOS Services.');
    }
  } catch (err) {
    console.error('Failed to auto-install Quick Action:', err);
  }
}

app.whenReady().then(() => {
  installQuickAction();
  createWindow();

  app.on('activate', function() {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function() {
  if (process.platform !== 'darwin') app.quit();
});

// IPC: Get Source Files
ipcMain.handle('get-sources', () => {
  // If packaged, args start at index 1. If not, they start at 2 e.g. "electron . file1 file2"
  const args = process.argv.slice(app.isPackaged ? 1 : 2);
  // Filter out any arguments that look like Electron flags (e.g. --allow-file-access-from-files)
  const sourceFiles = args.filter(arg => !arg.startsWith('--'));
  return sourceFiles;
});

// History Management
const historyPath = path.join(app.getPath('userData'), 'rsyncbud_history.json');

ipcMain.handle('get-history', () => {
  try {
    if (fs.existsSync(historyPath)) {
      const data = fs.readFileSync(historyPath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Failed to read history:', err);
  }
  return {history: [], favorites: []};
});

ipcMain.handle('save-history', (event, newHistory) => {
  try {
    fs.writeFileSync(historyPath, JSON.stringify(newHistory, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Failed to save history:', err);
    return false;
  }
});

// Directory Chooser
ipcMain.handle('choose-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'createDirectory']
  });
  if (result.canceled) return null;
  return result.filePaths[0];
});

// Run Rsync
ipcMain.on('run-rsync', (event, options) => {
  const {
    sources, target, compress, move, delete: optDelete, update, 
    dryrun, progress, syncSeparately, checksum, ignoreExisting, 
    hardLinks, pruneEmpty, inplace, xattrs, acls
  } = options;

  if (!sources || sources.length === 0) {
    event.reply('rsync-stdout', 'No source files to sync.\n');
    return;
  }

  // -a: archive mode, -v: verbose
  const baseArgs = ['-av'];

  if (compress) baseArgs.push('-z');
  if (move) baseArgs.push('--remove-source-files');
  if (optDelete) baseArgs.push('--delete');
  if (update) baseArgs.push('-u');
  if (dryrun) baseArgs.push('-n'); // -n is --dry-run
  if (progress) baseArgs.push('-P'); // -P is --partial --progress
  if (checksum) baseArgs.push('-c');
  if (ignoreExisting) baseArgs.push('--ignore-existing');
  if (hardLinks) baseArgs.push('-H');
  if (pruneEmpty) baseArgs.push('-m');
  if (inplace) baseArgs.push('--inplace');
  if (xattrs) baseArgs.push('-X');
  if (acls) baseArgs.push('-A');

  if (syncSeparately) {
    let currentIndex = 0;
    let finalCode = 0;

    const runNext = () => {
      if (currentIndex >= sources.length) {
        event.reply('rsync-exit', finalCode);
        return;
      }

      const currentSource = sources[currentIndex];
      const rsyncArgs = [...baseArgs, currentSource, target];
      
      event.reply('rsync-stdout', `Running: rsync ${rsyncArgs.join(' ')}\n\n`);
      const rsyncProcess = spawn('rsync', rsyncArgs);

      rsyncProcess.stdout.on('data', (data) => {
        event.reply('rsync-stdout', data.toString());
      });

      rsyncProcess.stderr.on('data', (data) => {
        event.reply('rsync-stderr', data.toString());
      });

      rsyncProcess.on('close', (code) => {
        if (code !== 0) finalCode = code;
        currentIndex++;
        runNext();
      });

      rsyncProcess.on('error', (err) => {
        event.reply('rsync-stderr', `Process error: ${err.message}\n`);
        finalCode = 1;
        currentIndex++;
        runNext();
      });
    };

    runNext();
  } else {
    // Add sources
    const rsyncArgs = [...baseArgs, ...sources, target];

    event.reply('rsync-stdout', `Running: rsync ${rsyncArgs.join(' ')}\n\n`);

    const rsyncProcess = spawn('rsync', rsyncArgs);

    rsyncProcess.stdout.on('data', (data) => {
      event.reply('rsync-stdout', data.toString());
    });

    rsyncProcess.stderr.on('data', (data) => {
      event.reply('rsync-stderr', data.toString());
    });

    rsyncProcess.on('close', (code) => {
      event.reply('rsync-exit', code);
    });

    rsyncProcess.on('error', (err) => {
      event.reply('rsync-stderr', `Process error: ${err.message}\n`);
    });
  }
});
