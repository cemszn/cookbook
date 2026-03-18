/* ═══════════════════════════════════════════════════════════════
   utils.js — Shared utilities
   Loaded before all page-specific scripts.
═══════════════════════════════════════════════════════════════ */

// ── Theme init (runs immediately on every page) ─────────────────
(function () {
<<<<<<< HEAD
  const mq = window.matchMedia('(prefers-color-scheme: dark)');

  function applySystemTheme(e) {
    document.documentElement.classList.toggle('dark', e.matches);
  }

  applySystemTheme(mq);
  mq.addEventListener('change', applySystemTheme);
=======
  const saved = localStorage.getItem('theme');
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  if (saved === 'dark' || (!saved && mq.matches)) {
    document.documentElement.classList.add('dark');
  }
  // Follow system theme changes when the user hasn't set a manual preference
  mq.addEventListener('change', function (e) {
    if (!localStorage.getItem('theme')) {
      document.documentElement.classList.toggle('dark', e.matches);
    }
  });
>>>>>>> 566a7692bf87dbb1f9604bb3f8a70f0eecf91a00
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
