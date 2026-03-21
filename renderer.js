// DOM Elements
const sourceList = document.getElementById('source-list');
const targetInput = document.getElementById('target-input');
const browseBtn = document.getElementById('browse-btn');
const favoritesSelect = document.getElementById('favorites-select');
const recentSelect = document.getElementById('recent-select');
const addFavoriteBtn = document.getElementById('add-favorite-btn');
const optCompress = document.getElementById('opt-compress');
const optMove = document.getElementById('opt-move');
const optDelete = document.getElementById('opt-delete');
const optUpdate = document.getElementById('opt-update');
const optDryrun = document.getElementById('opt-dryrun');
const optProgress = document.getElementById('opt-progress');
const optSyncSeparately = document.getElementById('opt-sync-separately');
const optChecksum = document.getElementById('opt-checksum');
const optIgnoreExisting = document.getElementById('opt-ignore-existing');
const optHardLinks = document.getElementById('opt-hard-links');
const optPruneEmpty = document.getElementById('opt-prune-empty');
const optInplace = document.getElementById('opt-inplace');
const optXattrs = document.getElementById('opt-xattrs');
const optAcls = document.getElementById('opt-acls');
const runBtn = document.getElementById('run-btn');
const terminalOutput = document.getElementById('terminal-output');
const progressText = document.getElementById('progress-text');
const progressPercent = document.getElementById('progress-percent');
const progressContainer = document.getElementById('progress-container');
const progressBar = document.getElementById('progress-bar');

// App State
let sources = [];
let historyData = { history: [], favorites: [] };

// Initialize
async function init() {
    // 1. Load Sources
    sources = await window.api.getSources();
    renderSources();

    // 2. Load History
    historyData = await window.api.getHistory();
    renderHistory();
    
    // Default to last used if available
    if (historyData.history && historyData.history.length > 0) {
        targetInput.value = historyData.history[0];
    }

    // Set up listeners for terminal
    window.api.onRsyncStdout((data) => appendLog(data, 'text-gray-300'));
    window.api.onRsyncStderr((data) => appendLog(data, 'text-red-400'));
    window.api.onRsyncExit((code) => {
        appendLog(`\n--- Process exited with code ${code} ---\n`, 'text-blue-400 font-bold');
        runBtn.disabled = false;
        runBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        runBtn.innerHTML = `
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span>Start Sync</span>
        `;
        progressText.textContent = code === 0 ? 'Finished Successfully' : 'Finished with Errors';
        progressPercent.textContent = '100%';
        progressBar.style.width = '100%';
        
        setTimeout(() => {
            progressPercent.style.opacity = '0';
            progressContainer.style.opacity = '0';
            setTimeout(() => {
                progressText.textContent = 'Output Console';
            }, 300);
        }, 3000);
    });
}

function renderSources() {
    sourceList.innerHTML = '';
    if (sources.length === 0) {
        sourceList.innerHTML = '<li class="text-gray-500 italic">No files selected. Try passing files via command line.</li>';
        return;
    }
    sources.forEach((src, idx) => {
        const li = document.createElement('li');
        li.className = 'flex items-center space-x-2 text-gray-300 animated-list-item';
        li.style.animationDelay = `${(idx * 50) + 100}ms`;
        li.innerHTML = `
            <svg class="w-4 h-4 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            <span class="truncate font-medium" title="${src}">${src}</span>
        `;
        sourceList.appendChild(li);
    });
}

function renderHistory() {
    // Populate Favorites
    favoritesSelect.innerHTML = '<option value="">-- Select a Favorite --</option>';
    (historyData.favorites || []).forEach(fav => {
        const opt = document.createElement('option');
        opt.value = fav;
        opt.textContent = fav;
        favoritesSelect.appendChild(opt);
    });

    // Populate Recent
    recentSelect.innerHTML = '<option value="">Choose Recent Target</option>';
    (historyData.history || []).forEach(rec => {
        const opt = document.createElement('option');
        opt.value = rec;
        opt.textContent = rec;
        recentSelect.appendChild(opt);
    });
}

async function addTargetToHistory(targetPath) {
    if (!targetPath) return;
    
    // Add to history (max 10), move to top if exists
    let history = historyData.history || [];
    history = history.filter(h => h !== targetPath);
    history.unshift(targetPath);
    if (history.length > 10) history = history.slice(0, 10);
    
    historyData.history = history;
    await window.api.saveHistory(historyData);
    renderHistory();
}

// Events
browseBtn.addEventListener('click', async () => {
    const dir = await window.api.chooseDirectory();
    if (dir) {
        targetInput.value = dir;
    }
});

favoritesSelect.addEventListener('change', (e) => {
    if (e.target.value) {
        targetInput.value = e.target.value;
        recentSelect.value = ""; // Reset the other dropdown
    }
});

recentSelect.addEventListener('change', (e) => {
    if (e.target.value) {
        targetInput.value = e.target.value;
        favoritesSelect.value = "";
    }
});

addFavoriteBtn.addEventListener('click', async () => {
    const val = targetInput.value.trim();
    if (!val) return;
    
    let favs = historyData.favorites || [];
    if (!favs.includes(val)) {
        favs.push(val);
        historyData.favorites = favs;
        await window.api.saveHistory(historyData);
        renderHistory();
        favoritesSelect.value = val;
    }
});

let currentLogLine = null;
let returnCarriage = false;

function appendLog(text, colorClass) {
    // Parse progress percentage (takes the last match in the chunk)
    const matches = [...text.matchAll(/(\d+)%/g)];
    if (matches.length > 0) {
        const pct = matches[matches.length - 1][1];
        progressBar.style.width = pct + '%';
        progressPercent.textContent = pct + '%';
    }
    
    // Parse state text
    if (text.includes('building file list')) {
        progressText.textContent = 'Building file list...';
    } else if (matches.length > 0 || text.includes('to-chk')) {
        progressText.textContent = 'Syncing files...';
    }

    const parts = text.split(/([\r\n])/);
    
    for (const part of parts) {
        if (!part) continue;
        
        if (!currentLogLine || currentLogLine.className !== colorClass) {
            currentLogLine = document.createElement('span');
            currentLogLine.className = colorClass;
            terminalOutput.appendChild(currentLogLine);
            returnCarriage = false;
        }
        
        if (part === '\n') {
            terminalOutput.appendChild(document.createElement('br'));
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
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

runBtn.addEventListener('click', async () => {
    const target = targetInput.value.trim();
    if (!target) {
        appendLog('\nError: Target directory is required.\n', 'text-red-500');
        return;
    }

    if (sources.length === 0) {
        appendLog('\nError: No valid source files selected.\n', 'text-red-500');
        return;
    }

    // Save target to history
    await addTargetToHistory(target);

    // Disable button, show loading
    runBtn.disabled = true;
    runBtn.classList.add('opacity-50', 'cursor-not-allowed');
    runBtn.innerHTML = `
        <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>Running...</span>
    `;

    // Reset Progress Bar state
    progressText.textContent = 'Preparing...';
    progressBar.style.width = '0%';
    progressPercent.textContent = '0%';
    progressPercent.style.opacity = '1';
    progressContainer.style.opacity = '1';

    // Clear previous logs
    terminalOutput.innerHTML = '';
    currentLogLine = null;
    returnCarriage = false;
    
    window.api.runRsync({
        sources: sources,
        target: target,
        compress: optCompress.checked,
        move: optMove.checked,
        delete: optDelete.checked,
        update: optUpdate.checked,
        dryrun: optDryrun.checked,
        progress: optProgress.checked,
        syncSeparately: optSyncSeparately.checked,
        checksum: optChecksum.checked,
        ignoreExisting: optIgnoreExisting.checked,
        hardLinks: optHardLinks.checked,
        pruneEmpty: optPruneEmpty.checked,
        inplace: optInplace.checked,
        xattrs: optXattrs.checked,
        acls: optAcls.checked
    });
});

// Run Init
init();
