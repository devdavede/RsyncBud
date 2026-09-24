window.RsyncBud = window.RsyncBud || {};

(function () {
  const { dom, state } = RsyncBud;

  function renderHistory() {
    dom.favoritesSelect.innerHTML = '<option value="">-- Select a Favorite --</option>';
    (state.historyData.favorites || []).forEach((fav) => {
      const opt = document.createElement('option');
      opt.value = fav;
      opt.textContent = fav;
      dom.favoritesSelect.appendChild(opt);
    });

    dom.recentSelect.innerHTML = '<option value="">Choose Recent Target</option>';
    (state.historyData.history || []).forEach((rec) => {
      const opt = document.createElement('option');
      opt.value = rec;
      opt.textContent = rec;
      dom.recentSelect.appendChild(opt);
    });
  }

  async function addTargetToHistory(targetPath) {
    if (!targetPath) return;

    // Add to history (max 10), move to top if exists
    let history = state.historyData.history || [];
    history = history.filter((h) => h !== targetPath);
    history.unshift(targetPath);
    if (history.length > 10) history = history.slice(0, 10);

    state.historyData.history = history;
    await window.api.saveHistory(state.historyData);
    renderHistory();
  }

  function initHistoryUi() {
    dom.favoritesSelect.addEventListener('change', (e) => {
      if (e.target.value) {
        dom.targetInput.value = e.target.value;
        dom.recentSelect.value = '';
      }
    });

    dom.recentSelect.addEventListener('change', (e) => {
      if (e.target.value) {
        dom.targetInput.value = e.target.value;
        dom.favoritesSelect.value = '';
      }
    });

    dom.addFavoriteBtn.addEventListener('click', async () => {
      const val = dom.targetInput.value.trim();
      if (!val) return;

      const favs = state.historyData.favorites || [];
      if (!favs.includes(val)) {
        favs.push(val);
        state.historyData.favorites = favs;
        await window.api.saveHistory(state.historyData);
        renderHistory();
        dom.favoritesSelect.value = val;
      }
    });
  }

  RsyncBud.history = { renderHistory, addTargetToHistory, initHistoryUi };
})();
