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

// ── Page transition veil ──────────────────────────────────────────
const VEIL_STYLE = 'position:fixed;inset:0;background:var(--cream);z-index:9998;pointer-events:none;transition:opacity 0.3s ease;';

function createVeil(opacity) {
  const existing = document.getElementById('page-veil');
  if (existing) existing.remove();
  const veil = document.createElement('div');
  veil.id = 'page-veil';
  veil.style.cssText = VEIL_STYLE + 'opacity:' + opacity + ';';
  document.body.appendChild(veil);
  return veil;
}

function fadeOutVeil() {
  const veil = document.getElementById('page-veil');
  if (!veil) return;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    veil.style.opacity = '0';
  }));
}

// Safari bfcache: animate in when navigating back/forward
window.addEventListener('pageshow', function (e) {
  if (e.persisted) {
    const veil = createVeil(1);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      veil.style.opacity = '0';
      setTimeout(() => veil.remove(), 350);
    }));
  }
});

// ── Debounce ────────────────────────────────────────────────────
function debounce(fn, delay) {
  let timer;
  return function () {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, arguments), delay);
  };
}
