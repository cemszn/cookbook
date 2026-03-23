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
const VEIL_STYLE = 'position:fixed;inset:0;background:var(--cream);z-index:9998;pointer-events:none;';

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
  gsap.to(veil, { opacity: 0, duration: 0.5, ease: 'power2.out', onComplete: () => veil.remove() });
}

function navigateWithVeil(href) {
  const veil = createVeil(0);
  gsap.to(veil, { opacity: 1, duration: 0.3, ease: 'power2.in' });
  setTimeout(() => { window.location.href = href; }, 320);
}

// Safari bfcache: animate in when navigating back/forward
window.addEventListener('pageshow', function (e) {
  if (e.persisted) {
    const veil = createVeil(1);
    gsap.to(veil, { opacity: 0, duration: 0.45, ease: 'power2.out', delay: 0.05, onComplete: () => veil.remove() });
  }
});

// ── Toolbox mobile menu (shared across pages with hamburger) ────
function toggleToolboxMenu(e) {
  e.stopPropagation();
  var menu = document.getElementById('toolbox-menu');
  if (menu) menu.classList.toggle('open');
}
function closeToolboxMenu() {
  var menu = document.getElementById('toolbox-menu');
  if (menu) menu.classList.remove('open');
}
document.addEventListener('click', function (e) {
  if (!e.target.closest('.toolbox-right')) closeToolboxMenu();
});

// ── Debounce ────────────────────────────────────────────────────
function debounce(fn, delay) {
  let timer;
  return function () {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, arguments), delay);
  };
}
