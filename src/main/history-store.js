const { app } = require('electron');
const path = require('path');
const fs = require('fs');

function getHistoryPath() {
  return path.join(app.getPath('userData'), 'rsyncbud_history.json');
}

function readHistory() {
  try {
    const historyPath = getHistoryPath();
    if (fs.existsSync(historyPath)) {
      const data = fs.readFileSync(historyPath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Failed to read history:', err);
  }
  return { history: [], favorites: [] };
}

function writeHistory(newHistory) {
  try {
    fs.writeFileSync(getHistoryPath(), JSON.stringify(newHistory, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Failed to save history:', err);
    return false;
  }
}

module.exports = { readHistory, writeHistory };
