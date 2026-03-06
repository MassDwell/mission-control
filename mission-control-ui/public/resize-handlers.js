/**
 * Panel Resize Handlers — CR-MC-UI-HARDENING
 * Implements drag-to-resize for all panels with localStorage persistence
 */

(function(window) {
  'use strict';

  const LAYOUT_KEY = 'mc_3mode_layout';
  const CURRENT_MODE_KEY = 'mc_current_mode';

  let resizingPanel = null;
  let startX = 0;
  let startY = 0;
  let startWidth = 0;
  let startHeight = 0;

  const MIN_WIDTH = 300;
  const MIN_HEIGHT = 200;

  /**
   * Get all panel IDs
   */
  function getAllPanelIds() {
    return [
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
  }

  /**
   * Handle resize start (mousedown on handle)
   */
  function onResizeStart(e) {
    // Only handle left mouse button
    if (e.button !== 0) return;

    const panel = e.target.closest('.mc-panel');
    if (!panel || panel.classList.contains('mc-collapsed') || panel.classList.contains('mc-fullwidth')) {
      return;
    }

    resizingPanel = panel;
    startX = e.clientX;
    startY = e.clientY;
    startWidth = panel.offsetWidth;
    startHeight = panel.offsetHeight;

    panel.classList.add('mc-panel-resizing');
    document.body.classList.add('mc-resizing');

    document.addEventListener('mousemove', onResizeMove);
    document.addEventListener('mouseup', onResizeEnd);

    e.preventDefault();
  }

  /**
   * Handle resize move (mousemove while dragging)
   */
  function onResizeMove(e) {
    if (!resizingPanel) return;

    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    const newWidth = Math.max(MIN_WIDTH, startWidth + deltaX);
    const newHeight = Math.max(MIN_HEIGHT, startHeight + deltaY);

    resizingPanel.style.width = newWidth + 'px';
    resizingPanel.style.height = newHeight + 'px';

    e.preventDefault();
  }

  /**
   * Handle resize end (mouseup)
   */
  function onResizeEnd(e) {
    if (!resizingPanel) return;

    resizingPanel.classList.remove('mc-panel-resizing');
    document.body.classList.remove('mc-resizing');

    // Save layout to localStorage
    saveLayout();

    document.removeEventListener('mousemove', onResizeMove);
    document.removeEventListener('mouseup', onResizeEnd);

    resizingPanel = null;

    e.preventDefault();
  }

  /**
   * Save current panel layout to localStorage
   */
  function saveLayout() {
    const currentMode = localStorage.getItem(CURRENT_MODE_KEY) || 'operator';
    let layout = {};

    try {
      const raw = localStorage.getItem(LAYOUT_KEY);
      layout = JSON.parse(raw) || {};
    } catch(_e) {}

    layout[currentMode] = layout[currentMode] || {};

    getAllPanelIds().forEach(function(panelId) {
      const el = document.getElementById(panelId);
      if (!el) return;

      layout[currentMode][panelId] = {
        width:     el.style.width     || null,
        height:    el.style.height    || null,
        collapsed: el.classList.contains('mc-collapsed'),
        fullwidth: el.classList.contains('mc-fullwidth')
      };
    });

    try {
      localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout));
      console.log('[RESIZE-HANDLERS] Layout saved for mode:', currentMode);
    } catch(err) {
      console.warn('[RESIZE-HANDLERS] Failed to save layout:', err.message);
    }
  }

  /**
   * Initialize resize handlers on all panels
   */
  function initializeResizing() {
    console.log('[RESIZE-HANDLERS] Initializing resize handlers...');

    getAllPanelIds().forEach(function(panelId) {
      const panel = document.getElementById(panelId);
      if (!panel) return;

      // Remove any existing listeners to prevent duplicates
      const handleEl = panel.querySelector('[data-resize-handle]');
      if (handleEl) {
        handleEl.removeEventListener('mousedown', onResizeStart);
      }

      // Use ::after pseudo-element as handle (attach listener to panel itself for bottom-right)
      panel.removeEventListener('mousedown', onResizeStart);

      // Attach listener specifically to the resize handle area (bottom-right corner)
      panel.addEventListener('mousedown', function(e) {
        // Only trigger if mousedown is near the bottom-right corner (last 18px)
        const rect = panel.getBoundingClientRect();
        const isBottomRight = 
          (e.clientX >= rect.right - 18) && 
          (e.clientY >= rect.bottom - 18);

        if (isBottomRight) {
          onResizeStart(e);
        }
      });
    });

    console.log('[RESIZE-HANDLERS] Resize handlers initialized');
  }

  /**
   * Add CSS for resizing feedback
   */
  function addResizingStyles() {
    if (document.getElementById('resize-handlers-style')) return;

    const style = document.createElement('style');
    style.id = 'resize-handlers-style';
    style.textContent = `
      .mc-panel-resizing {
        opacity: 0.95;
        box-shadow: 0 0 12px rgba(59, 130, 246, 0.4);
        border-color: var(--accent-blue, #3b82f6) !important;
      }

      body.mc-resizing {
        user-select: none;
        cursor: nwse-resize;
      }

      body.mc-resizing * {
        cursor: nwse-resize !important;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Expose API globally
   */
  window.ResizeHandlers = {
    initializeResizing: initializeResizing,
    saveLayout: saveLayout
  };

  /**
   * Initialize on DOM ready
   */
  function init() {
    addResizingStyles();
    initializeResizing();
    console.log('[RESIZE-HANDLERS] Module initialized');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(window);
