window.RsyncBud = window.RsyncBud || {};

(function () {
  const { dom } = RsyncBud;

  let currentLogLine = null;
  let returnCarriage = false;

  function updateProgress(text) {
    // Parse progress percentage (takes the last match in the chunk)
    const matches = [...text.matchAll(/(\d+)%/g)];
    if (matches.length > 0) {
      const pct = matches[matches.length - 1][1];
      dom.progressBar.style.width = pct + '%';
      dom.progressPercent.textContent = pct + '%';
    }

    if (text.includes('building file list')) {
      dom.progressText.textContent = 'Building file list...';
    } else if (matches.length > 0 || text.includes('to-chk')) {
      dom.progressText.textContent = 'Syncing files...';
    }
  }

  function appendLog(text, colorClass) {
    updateProgress(text);

    const parts = text.split(/([\r\n])/);

    for (const part of parts) {
      if (!part) continue;

      if (!currentLogLine || currentLogLine.className !== colorClass) {
        currentLogLine = document.createElement('span');
        currentLogLine.className = colorClass;
        dom.terminalOutput.appendChild(currentLogLine);
        returnCarriage = false;
      }

      if (part === '\n') {
        dom.terminalOutput.appendChild(document.createElement('br'));
        currentLogLine = null;
        returnCarriage = false;
      } else if (part === '\r') {
        returnCarriage = true;
      } else {
        if (returnCarriage) {
          currentLogLine.textContent = '';
          returnCarriage = false;
        }
        currentLogLine.appendChild(document.createTextNode(part));
      }
    }
    dom.terminalOutput.scrollTop = dom.terminalOutput.scrollHeight;
  }

  function resetLog() {
    dom.terminalOutput.innerHTML = '';
    currentLogLine = null;
    returnCarriage = false;
  }

  RsyncBud.terminal = { appendLog, resetLog };
})();
