window.RsyncBud = window.RsyncBud || {};

(function () {
  const { dom, state, terminal, history } = RsyncBud;

  const RUN_ICON = `
        <svg class="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <span>Start Sync</span>
    `;

  const SPINNER_ICON = `
        <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>Running...</span>
    `;

  function setRunningState(isRunning) {
    dom.runBtn.disabled = isRunning;
    dom.runBtn.classList.toggle('opacity-50', isRunning);
    dom.runBtn.classList.toggle('cursor-not-allowed', isRunning);
    dom.runBtn.innerHTML = isRunning ? SPINNER_ICON : RUN_ICON;
  }

  function initSyncListeners() {
    window.api.onRsyncStdout((data) => terminal.appendLog(data, 'text-gray-300'));
    window.api.onRsyncStderr((data) => terminal.appendLog(data, 'text-red-400'));
    window.api.onRsyncExit((code) => {
      terminal.appendLog(`\n--- Process exited with code ${code} ---\n`, 'text-blue-400 font-bold');
      setRunningState(false);

      dom.progressText.textContent = code === 0 ? 'Finished Successfully' : 'Finished with Errors';
      dom.progressPercent.textContent = '100%';
      dom.progressBar.style.width = '100%';

      setTimeout(() => {
        dom.progressPercent.style.opacity = '0';
        dom.progressContainer.style.opacity = '0';
        setTimeout(() => {
          dom.progressText.textContent = 'Output Console';
        }, 300);
      }, 3000);
    });

    dom.browseBtn.addEventListener('click', async () => {
      const dir = await window.api.chooseDirectory();
      if (dir) dom.targetInput.value = dir;
    });

    dom.runBtn.addEventListener('click', async () => {
      const target = dom.targetInput.value.trim();
      if (!target) {
        terminal.appendLog('\nError: Target directory is required.\n', 'text-red-500');
        return;
      }

      if (state.sources.length === 0) {
        terminal.appendLog('\nError: No valid source files selected.\n', 'text-red-500');
        return;
      }

      await history.addTargetToHistory(target);

      setRunningState(true);

      dom.progressText.textContent = 'Preparing...';
      dom.progressBar.style.width = '0%';
      dom.progressPercent.textContent = '0%';
      dom.progressPercent.style.opacity = '1';
      dom.progressContainer.style.opacity = '1';

      terminal.resetLog();

      window.api.runRsync({
        sources: state.sources,
        target,
        compress: dom.optCompress.checked,
        move: dom.optMove.checked,
        delete: dom.optDelete.checked,
        update: dom.optUpdate.checked,
        dryrun: dom.optDryrun.checked,
        progress: dom.optProgress.checked,
        syncSeparately: dom.optSyncSeparately.checked,
        checksum: dom.optChecksum.checked,
        ignoreExisting: dom.optIgnoreExisting.checked,
        hardLinks: dom.optHardLinks.checked,
        pruneEmpty: dom.optPruneEmpty.checked,
        inplace: dom.optInplace.checked,
        xattrs: dom.optXattrs.checked,
        acls: dom.optAcls.checked
      });
    });
  }

  RsyncBud.sync = { initSyncListeners };
})();
