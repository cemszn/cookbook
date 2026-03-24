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
  var btn  = document.getElementById('toolbox-menu-btn');
  if (!menu) return;
  var isOpen = menu.classList.toggle('open');
  if (btn) btn.setAttribute('aria-expanded', String(isOpen));
}
function closeToolboxMenu() {
  var menu = document.getElementById('toolbox-menu');
  var btn  = document.getElementById('toolbox-menu-btn');
  if (menu) menu.classList.remove('open');
  if (btn) btn.setAttribute('aria-expanded', 'false');
}
document.addEventListener('click', function (e) {
  if (!e.target.closest('.toolbox-right')) closeToolboxMenu();
});

// ── Book header animation (shared — recipe + home pages) ────────
function animateBookHeader() {
  const theEl      = document.querySelector('.book-logotype-main em');
  const shimmerEl  = document.querySelector('.logotype-shimmer');
  const ruleEl     = document.querySelector('.book-header-rule');
  const greetingEl = document.querySelector('.book-greeting');
  if (!theEl || !shimmerEl) return gsap.timeline();

  shimmerEl.style.animationPlayState = 'paused';

  gsap.set(theEl,     { clipPath: 'inset(0 102% 0 0 round 2px)', opacity: 0 });
  gsap.set(shimmerEl, { clipPath: 'inset(0 102% 0 0 round 2px)', opacity: 0 });
  if (ruleEl)     gsap.set(ruleEl,     { scaleX: 0 });
  if (greetingEl) gsap.set(greetingEl, { opacity: 0, y: 6 });

  const tl = gsap.timeline({ delay: 0.08 });

  // "The" — clips in left to right
  tl.to(theEl, {
    clipPath: 'inset(0 0% 0 0 round 2px)', opacity: 0.55,
    duration: 0.65, ease: 'power2.inOut',
    onComplete() { gsap.set(theEl, { clearProps: 'clipPath' }); }
  });

  // "Cookbook" — clips in left to right, slightly overlapping
  tl.to(shimmerEl, {
    clipPath: 'inset(0 0% 0 0 round 2px)', opacity: 1,
    duration: 1.1, ease: 'power2.inOut',
    onComplete() {
      gsap.set(shimmerEl, { clearProps: 'clipPath,opacity' });
      // Restart the CSS animation fresh with a delay so the first shimmer
      // doesn't fire immediately after the GSAP entrance
      shimmerEl.style.animation = 'none';
      requestAnimationFrame(function () {
        shimmerEl.style.animation = 'logotype-shimmer 14s ease-out 3s infinite';
      });
    }
  }, '-=0.2');

  // Rule — expands from centre
  if (ruleEl) {
    tl.to(ruleEl, { scaleX: 1, duration: 0.65, ease: 'power2.inOut' }, '-=0.45');
  }

  // Greeting — fades up after the rule
  if (greetingEl) {
    tl.to(greetingEl, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', clearProps: 'all' }, '-=0.3');
  }

  return tl;
}

// ── Debounce ────────────────────────────────────────────────────
function debounce(fn, delay) {
  let timer;
  return function () {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, arguments), delay);
  };
}
