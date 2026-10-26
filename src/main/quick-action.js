const { app } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

/**
 * Copies the bundled Automator Quick Action into ~/Library/Services on first
 * run so it shows up in the Finder right-click menu without manual setup.
 */
function installQuickAction() {
  if (process.platform !== 'darwin') return;

  const targetServicesDir = path.join(os.homedir(), 'Library', 'Services');
  const targetWorkflow = path.join(targetServicesDir, 'RsyncBud.workflow');

  let sourceWorkflow = path.join(__dirname, '..', '..', 'assets', 'RsyncBud.workflow');
  if (app.isPackaged) {
    sourceWorkflow = path.join(process.resourcesPath, 'assets', 'RsyncBud.workflow');
  }

  try {
    if (!fs.existsSync(targetServicesDir)) {
      fs.mkdirSync(targetServicesDir, { recursive: true });
    }

    if (!fs.existsSync(targetWorkflow) && fs.existsSync(sourceWorkflow)) {
      fs.cpSync(sourceWorkflow, targetWorkflow, { recursive: true });
      console.log('Successfully auto-installed RsyncBud Quick Action to macOS Services.');
    }
  } catch (err) {
    console.error('Failed to auto-install Quick Action:', err);
  }
}

module.exports = { installQuickAction };
