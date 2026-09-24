window.RsyncBud = window.RsyncBud || {};

(function () {
  const { dom, state, history, sync } = RsyncBud;

  const FALLBACK_LOGO_SVG =
    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAyNCAyNCIgc3Ryb2tlPSIjM0I4MkY2IiBzdHJva2Utd2lkdGg9IjIiPjxwYXRoIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgZD0iTTggN3Y4YTIgMiAwIDAwMiAyaDZNOCA3VjVhMiAyIDAgMDEyLTJoNC41ODZhMSAxIDAgMDEuNzA3LjI5M2w0LjQxNCA0LjQxNGExIDEgMCAwMS4yOTMuNzA3VjE1YTIgMiAwIDAxLTIgMmgtMk04IDdINmEyIDIgMCAwMC0yIDJ2MTBhMiAyIDAgMDAyIDJoOGEyIDIgMCAwMDItMnYtMiIvPjwvc3ZnPg==';

  function renderSources() {
    dom.sourceList.innerHTML = '';
    if (state.sources.length === 0) {
      dom.sourceList.innerHTML = '<li class="text-gray-500 italic">No files selected. Try passing files via command line.</li>';
      return;
    }
    state.sources.forEach((src, idx) => {
      const li = document.createElement('li');
      li.className = 'flex items-center space-x-2 text-gray-300 animated-list-item';
      li.style.animationDelay = `${idx * 50 + 100}ms`;
      li.innerHTML = `
            <svg class="w-4 h-4 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            <span class="truncate font-medium" title="${src}">${src}</span>
        `;
      dom.sourceList.appendChild(li);
    });
  }

  async function init() {
    dom.appLogo.addEventListener('error', () => {
      dom.appLogo.src = FALLBACK_LOGO_SVG;
    }, { once: true });

    state.sources = await window.api.getSources();
    renderSources();

    state.historyData = await window.api.getHistory();
    history.renderHistory();

    if (state.historyData.history && state.historyData.history.length > 0) {
      dom.targetInput.value = state.historyData.history[0];
    }

    history.initHistoryUi();
    sync.initSyncListeners();
  }

  init();
})();
