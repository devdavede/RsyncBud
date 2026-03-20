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
const runBtn = document.getElementById('run-btn');
const terminalOutput = document.getElementById('terminal-output');

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
            <span>Start Rsync</span>
        `;
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

function appendLog(text, colorClass) {
    const span = document.createElement('span');
    span.className = colorClass;
    span.textContent = text;
    terminalOutput.appendChild(span);
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

    // Clear previous logs
    terminalOutput.innerHTML = '';
    
    window.api.runRsync({
        sources: sources,
        target: target,
        compress: optCompress.checked,
        move: optMove.checked,
        delete: optDelete.checked,
        update: optUpdate.checked,
        dryrun: optDryrun.checked,
        progress: optProgress.checked
    });
});

// Run Init
init();
