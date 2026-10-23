/**
 * Paxi Toolbox - main entry point
 * Responsibilities: tool render scheduling, event binding, app initialization
 */

// ============================================================
// Tool rendering (secondary page)
// ============================================================
function renderTool(tool, prevTool) {
  const main = document.getElementById('mainContent');

  // Cleanup previous tool
  if (prevTool && window.TOOL_REGISTRY && window.TOOL_REGISTRY[prevTool]) {
    if (typeof window.TOOL_REGISTRY[prevTool].beforeUnmount === 'function') {
      window.TOOL_REGISTRY[prevTool].beforeUnmount();
    }
  }

  let content = '';

  if (window.TOOL_REGISTRY && window.TOOL_REGISTRY[tool] && typeof window.TOOL_REGISTRY[tool].render === 'function') {
    content = window.TOOL_REGISTRY[tool].render();
  } else {
    content = '<p style="color:var(--text-muted);text-align:center;padding:20px;">Loading...</p>';
  }

  main.innerHTML = `
    <div class="back-bar" onclick="navigateBack()">${t('back')}</div>
    ${content}
  `;

  bindToolEvents(tool);

  if (window.TOOL_REGISTRY && window.TOOL_REGISTRY[tool]) {
    if (typeof window.TOOL_REGISTRY[tool].onMount === 'function') {
      window.TOOL_REGISTRY[tool].onMount();
    }
  }
}

function bindToolEvents(tool) {
  if (window.TOOL_REGISTRY && window.TOOL_REGISTRY[tool] && typeof window.TOOL_REGISTRY[tool].bind === 'function') {
    window.TOOL_REGISTRY[tool].bind();
  }
  // onMount is already called uniformly in renderTool; do not repeat here
}

// ============================================================
// Initialization
// ============================================================
function initApp() {
  updateHeaderUI();
  renderHome();
  checkWalletInjection();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// ============================================================
// Add delete to LANG.common
// ============================================================
if (typeof LANG !== 'undefined') {
  if (LANG.en && LANG.en.common) LANG.en.common.delete = 'Delete';
}
