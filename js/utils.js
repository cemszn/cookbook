/* ═══════════════════════════════════════════════════════════════
   utils.js — Shared utilities
   Loaded before all page-specific scripts.
═══════════════════════════════════════════════════════════════ */

// ── Theme init (runs immediately on every page) ─────────────────
(function () {
  const mq = window.matchMedia('(prefers-color-scheme: dark)');

  function applySystemTheme(e) {
    document.documentElement.classList.toggle('dark', e.matches);
  }

  applySystemTheme(mq);
  mq.addEventListener('change', applySystemTheme);
})();

// ── Theme toggle (called from onclick in all three HTML files) ──
function toggleTheme() {
  document.documentElement.classList.toggle('dark');
}

// ── HTML escaping (used in template strings across home/recipe) ─
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Debounce ────────────────────────────────────────────────────
function debounce(fn, delay) {
  let timer;
  return function () {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, arguments), delay);
  };
}
