/**
 * storage.js — Mission Control Layout Persistence
 * CR-MC-UI-HARDENING Phase 2
 *
 * Saves/restores panel sizes, collapsed state, and fullwidth state
 * using browser localStorage.
 */

(function(window) {
  'use strict';

  const STORAGE_KEY = 'mission_control_layout';

  // Panel IDs and their data-panel-id attribute values
  const PANEL_IDS = [
    'panel-active-work',
    'panel-blocked-work',
    'panel-operator-guidance',
    'panel-founder-decisions',
    'panel-insights',
    'panel-opportunity-discovery',
    'panel-momentum',
    'panel-operator-impact',
    'panel-agent-activity',
    'panel-workstream-flow',
    'panel-venture-pipeline'
  ];

  let _saveTimer = null;

  /**
   * Load the saved layout from localStorage.
   * @returns {Object} layout state
   */
  function loadLayout() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { panels: {}, lastUpdated: null };
      return JSON.parse(raw);
    } catch (e) {
      console.warn('[MC-STORAGE] Failed to load layout:', e.message);
      return { panels: {}, lastUpdated: null };
    }
  }

  /**
   * Collect current panel states and save to localStorage.
   * Debounced — call freely, saves after 1s idle.
   */
  function saveLayout() {
    if (_saveTimer) clearTimeout(_saveTimer);
    _saveTimer = setTimeout(function() {
      const layout = { panels: {}, lastUpdated: new Date().toISOString() };
      PANEL_IDS.forEach(function(panelId) {
        const el = document.getElementById(panelId);
        if (!el) return;
        layout.panels[panelId] = {
          width:     el.offsetWidth  || null,
          height:    el.offsetHeight || null,
          collapsed: el.classList.contains('mc-collapsed'),
          fullwidth: el.classList.contains('mc-fullwidth')
        };
      });
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
      } catch (e) {
        console.warn('[MC-STORAGE] Failed to save layout:', e.message);
      }
    }, 1000);
  }

  /**
   * Restore layout from localStorage on page load.
   * Sets sizes and classes on each panel element.
   */
  function restoreLayout() {
    const layout = loadLayout();
    if (!layout.panels) return;

    PANEL_IDS.forEach(function(panelId) {
      const state = layout.panels[panelId];
      if (!state) return;
      const el = document.getElementById(panelId);
      if (!el) return;

      // Restore size (only if non-trivial values saved)
      if (state.width  && state.width  > 50)  el.style.width  = state.width  + 'px';
      if (state.height && state.height > 50)  el.style.height = state.height + 'px';

      // Restore collapsed state
      if (state.collapsed) {
        el.classList.add('mc-collapsed');
        const body = el.querySelector('.mc-panel-body');
        if (body) body.style.display = 'none';
        const btn = el.querySelector('[data-action="collapse"]');
        if (btn) btn.textContent = '+';
      }

      // Restore fullwidth state
      if (state.fullwidth) {
        el.classList.add('mc-fullwidth');
        const dashboard = document.getElementById('mc-dashboard-grid');
        if (dashboard) dashboard.classList.add('mc-single-panel-mode');
        // Hide siblings
        PANEL_IDS.forEach(function(sid) {
          if (sid !== panelId) {
            const sibling = document.getElementById(sid);
            if (sibling) sibling.style.display = 'none';
          }
        });
      }
    });
  }

  /**
   * Clear saved layout (reset to defaults).
   */
  function clearLayout() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (_e) {}
  }

  // Expose API
  window.MCStorage = {
    saveLayout:    saveLayout,
    restoreLayout: restoreLayout,
    clearLayout:   clearLayout,
    loadLayout:    loadLayout,
    PANEL_IDS:     PANEL_IDS
  };

})(window);
