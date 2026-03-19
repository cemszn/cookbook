/* ═══════════════════════════════════════════════════════════════
   utils.js — Shared utilities
   Loaded before all page-specific scripts.
═══════════════════════════════════════════════════════════════ */

// ── Theme init (runs immediately on every page) ─────────────────
(function () {
  const mq = window.matchMedia('(prefers-color-scheme: dark)');

  // If no manual override, keep in sync with system preference
  if (!localStorage.getItem('theme')) {
    mq.addEventListener('change', function (e) {
      if (!localStorage.getItem('theme')) {
        document.documentElement.classList.toggle('dark', e.matches);
      }
    });
  }
})();

// ── Theme toggle (called from onclick in all three HTML files) ──
function toggleTheme() {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
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

// ── Feather icons ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
  if (typeof feather !== 'undefined') feather.replace();
});

// ── Debounce ────────────────────────────────────────────────────
function debounce(fn, delay) {
  let timer;
  return function () {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, arguments), delay);
  };
}
