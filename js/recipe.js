/* ═══════════════════════════════════════════════════════════════
   recipe.js — Single recipe page
   Loads one recipe from Firestore by URL param ?id=...
   and renders the full page including cook mode.
═══════════════════════════════════════════════════════════════ */

function toolboxBack() {
  const overlay = document.getElementById('cook-overlay');
  if (overlay && overlay.classList.contains('active')) {
    closeCookMode();
  } else {
    history.back();
  }
}

// ── Globals ────────────────────────────────────────────────────
let recipe         = null;
let servings       = 2;
let baseServings   = 2;
const checkedSet   = new Set();

// ── Get recipe ID from URL ─────────────────────────────────────
function getRecipeId() {
  return new URLSearchParams(window.location.search).get('id');
}

// ── Load recipe ────────────────────────────────────────────────
async function loadRecipe() {
  const id = getRecipeId();
  if (!id) {
    showError('No recipe ID provided.');
    return;
  }
  try {
    const doc = await db.collection('recipes').doc(id).get();
    if (!doc.exists) {
      showError('Recipe not found.');
      return;
    }
    recipe = { id: doc.id, ...doc.data() };
    servings     = recipe.servings || 2;
    baseServings = recipe.servings || 2;
    renderPage();
    fadeOutVeil();
    document.title = `${recipe.title} — The Cookbook`;
    // Staggered entrance for recipe page sections
    gsap.from(['#recipe-page .hero', '#recipe-page .info-grid', '#recipe-page .two-col'], {
      opacity: 0, y: 22, duration: 0.65, stagger: 0.1, ease: 'power2.out', delay: 0.18, clearProps: 'all'
    });
  } catch (err) {
    console.error(err);
    showError('Could not load recipe. Check your Firebase config.');
  }
}

function showError(msg) {
  document.title = 'The Cookbook';
  fadeOutVeil();
  document.getElementById('recipe-page').innerHTML = `
    <div class="empty-state empty-state--no-hpad">
      <div class="empty-state-icon">⚠️</div>
      <div class="empty-state-title">Oops</div>
      <div class="empty-state-sub">${escHtml(msg)}</div>
    </div>`;
}

// ── Render full page ───────────────────────────────────────────
function renderPage() {
  const r = recipe;
  const swatchesHTML = (r.keyIngredients || []).map(ki => `
    <div class="info-cell swatch-cell">
      <div class="swatch-dot ${escHtml(ki.color || 'herb')}"></div>
      <span class="swatch-name">${escHtml(ki.name)}</span>
      <span class="swatch-role">${escHtml(ki.role || '')}</span>
    </div>`).join('');

  // Pad to 4 swatches for the grid
  const padCount = Math.max(0, 4 - (r.keyIngredients || []).length);
  const padHTML  = '<div class="info-cell swatch-cell"></div>'.repeat(padCount);

  const notesHTML = (r.notes || []).map((note, i) => `
    <li>
      <span class="note-icon">${i + 1}</span>
      <span class="note-text">${escHtml(note)}</span>
    </li>`).join('');

  const nfHTML = buildNutritionCard(r.nutrition);

  const tagsHTML = (r.tags || []).map(t =>
    `<span class="footer-tag">${escHtml(t)}</span>`
  ).join('');

  const page = document.getElementById('recipe-page');
  page.innerHTML = `
    <header class="book-header">
      <div class="book-logotype-main"><em>The</em> <span class="logotype-shimmer">Cookbook</span></div>
      <div class="book-header-rule"></div>
    </header>

    <section class="hero">
      <div class="hero-top">
        <div class="hero-image-col">
          <div class="dish-image-wrap">
            ${r.imageUrl
              ? `<img src="${escHtml(r.imageUrl)}" class="dish-image" alt="${escHtml(r.title)}" />`
              : `<div class="dish-emoji">🍽️</div>`}
          </div>
        </div>
        <div class="hero-text">
          <div class="recipe-chapter">${escHtml(r.category || '')}</div>
          <h1 class="recipe-title">${escHtml(r.title || '')}</h1>
          ${r.subtitle ? `<div class="recipe-subtitle">${escHtml(r.subtitle)}</div>` : ''}
          <p class="recipe-description">${escHtml(r.description || '')}</p>
        </div>
      </div>
    </section>

    <div class="info-grid">
      ${swatchesHTML}${padHTML}
      <div class="info-cell">
        <span class="meta-label">Prep Time</span>
        <span class="meta-value">${r.prepTime || 0} <span class="meta-unit">min</span></span>
      </div>
      <div class="info-cell">
        <span class="meta-label">Cook Time</span>
        <span class="meta-value">${r.cookTime || 0} <span class="meta-unit">min</span></span>
      </div>
      <div class="info-cell">
        <span class="meta-label">Servings</span>
        <span class="meta-value" id="meta-servings-display">${servings}</span>
      </div>
      <div class="info-cell">
        <span class="meta-label">Difficulty</span>
        <span class="meta-value meta-value--small">${escHtml(r.difficulty || '—')}</span>
      </div>
    </div>

    <div class="two-col">
      <!-- INGREDIENTS -->
      <div class="ingredients-col">
        <div class="section-heading"><h2>Ingredients</h2></div>
        <div class="servings-toggle">
          <button class="servings-btn" onclick="changeServings(-1)">−</button>
          <span class="servings-count" id="servings-count">${servings}</span>
          <span class="servings-toggle-label">Servings</span>
          <button class="servings-btn" onclick="changeServings(1)">+</button>
        </div>
        <div id="ingredients-list"></div>
        <button class="reminders-btn" onclick="exportToReminders()" title="Export to Apple Reminders">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          Export to Reminders
        </button>
      </div>

      <!-- STEPS -->
      <div class="steps-col">
        <div class="section-heading"><h2>Method</h2></div>
        <div id="steps-list"></div>
      </div>
    </div>

    ${(notesHTML || nfHTML) ? `
    <div class="notes-nutrition-row${nfHTML ? ' has-nutrition' : ''}">
      ${notesHTML ? `
      <section class="notes-section">
        <div class="notes-card">
          <div class="notes-card-title">Kitchen Notes</div>
          <div class="notes-card-subtitle">Tips &amp; variations</div>
          <ul class="notes-list">${notesHTML}</ul>
        </div>
      </section>` : '<div></div>'}
      ${nfHTML ? `<section class="nutrition-section">${nfHTML}</section>` : ''}
    </div>` : ''}

    ${tagsHTML ? `
    <footer class="recipe-footer">
      <div class="footer-tags">${tagsHTML}</div>
    </footer>` : ''}
  `;

  renderIngredients();
  renderSteps();
  setupCookMode();
}

// ── Ingredients ────────────────────────────────────────────────
function groupIngredientsByCategory(ingredients) {
  const groups = [];
  const map = new Map();
  for (const ing of ingredients) {
    const cat = ing.category || '';
    if (!map.has(cat)) {
      const group = { category: cat, items: [] };
      map.set(cat, group);
      groups.push(group);
    }
    map.get(cat).items.push(ing);
  }
  return groups;
}

function buildIngredientHTML(ingredients, ratio) {
  const groups = groupIngredientsByCategory(ingredients);
  const hasCategories = !(groups.length === 1 && groups[0].category === '');
  let globalIndex = 0;
  let html = '';

  for (const group of groups) {
    if (hasCategories) {
      html += `<div class="ingredient-group">`;
      if (group.category) {
        html += `<div class="ingredient-group-title">${escHtml(group.category)}</div>`;
      }
    }
    for (const ing of group.items) {
      const i = globalIndex++;
      const scaled    = parseAmount(ing.amount) * ratio;
      const amtStr    = formatAmount(scaled);
      const isChecked = checkedSet.has(i);
      html += `
        <div class="ingredient-item${isChecked ? ' checked' : ''}">
          <input type="checkbox" class="ingredient-checkbox"
            ${isChecked ? 'checked' : ''}
            onchange="toggleIngredient(${i}, this)">
          <span class="ingredient-amount">${amtStr}${ing.unit ? ' ' + escHtml(ing.unit) : ''}</span>
          <span class="ingredient-name">${escHtml(ing.name)}${ing.note
            ? `<br><span class="ingredient-note">${escHtml(ing.note)}</span>`
            : ''}</span>
        </div>`;
    }
    if (hasCategories) html += `</div>`;
  }
  return html;
}

function renderIngredients() {
  if (!recipe) return;
  const ratio     = servings / baseServings;
  const container = document.getElementById('ingredients-list');
  if (!container) return;

  container.innerHTML = buildIngredientHTML(recipe.ingredients || [], ratio);

  // keep servings counter in sync
  const sc = document.getElementById('servings-count');
  if (sc) sc.textContent = servings;
  const ms = document.getElementById('meta-servings-display');
  if (ms) ms.textContent = servings;
}

function renderSteps() {
  if (!recipe) return;
  const container = document.getElementById('steps-list');
  if (!container) return;

  container.innerHTML = (recipe.steps || []).map((step, i) => `
    <div class="step">
      <div class="step-number"><span>${i + 1}</span></div>
      <div class="step-content">
        <div class="step-title">${escHtml(step.title || '')}</div>
        <p class="step-text">${escHtml(step.text || '')}</p>
        ${step.tip ? `<div class="step-tip">${escHtml(step.tip)}</div>` : ''}
      </div>
    </div>`).join('');
}

function changeServings(delta) {
  servings = Math.max(1, servings + delta);
  renderIngredients();
}

function toggleIngredient(index, el) {
  const item = el.closest('.ingredient-item');
  if (el.checked) { checkedSet.add(index);    item.classList.add('checked'); }
  else            { checkedSet.delete(index);  item.classList.remove('checked'); }
}

function parseAmount(str) {
  if (!str) return 0;
  const fracs = { '¼': 0.25, '½': 0.5, '¾': 0.75, '⅓': 0.33, '⅔': 0.67,
                  '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875 };
  const s = str.trim();
  // Check if string contains a unicode fraction character
  const fracChar = Object.keys(fracs).find(ch => s.includes(ch));
  if (fracChar) {
    // Extract leading whole number if present (e.g. "2 ½" or "2½")
    const wholeMatch = s.match(/^(\d+)\s*/);
    const whole = wholeMatch ? parseInt(wholeMatch[1]) : 0;
    return whole + fracs[fracChar];
  }
  // Plain number
  const num = parseFloat(s);
  return isNaN(num) ? 0 : num;
}

function formatAmount(val) {
  const fractions = { 0.25: '¼', 0.5: '½', 0.75: '¾', 0.33: '⅓', 0.67: '⅔' };
  if (!val) return '0';
  if (Number.isInteger(val)) return String(val);
  const whole = Math.floor(val);
  const dec   = parseFloat((val - whole).toFixed(2));
  const frac  = fractions[dec] || dec.toFixed(1);
  return whole > 0 ? `${whole} ${frac}` : frac;
}

// ── Nutrition Card ─────────────────────────────────────────────
function buildNutritionCard(nf) {
  if (!nf || nf.calories === null || nf.calories === undefined) return '';

  // Daily value reference amounts
  const DV = { totalFat: 78, saturatedFat: 20, cholesterol: 300,
               sodium: 2300, totalCarb: 275, dietaryFiber: 28, protein: 50 };

  const pct = (val, ref) => {
    if (val === null || val === undefined || !ref) return null;
    return Math.round((val / ref) * 100);
  };

  const nfRow = (label, amount, unit, dvPct, barClass, indent, bold) => {
    const nameEl = bold
      ? `<span class="nf-bold">${label}</span>`
      : label;
    const indentClass = indent ? ' indent' : '';
    const bar = barClass && dvPct !== null
      ? `<div class="nf-bar-wrap${indent ? ' nf-bar-wrap--indent' : ''}">
           <div class="nf-bar ${barClass}" style="width:${Math.min(dvPct, 100)}%"></div>
         </div>` : '';
    return `
      <div class="nf-row${indentClass}">
        <div class="nf-name">${nameEl}${amount !== null && amount !== undefined
          ? ` <span class="nf-amount">${amount}${unit}</span>` : ''}</div>
      </div>${bar}`;
  };

  const extrasHTML = (nf.extras || []).length > 0 ? `
    <div class="nf-vitamins">
      ${(nf.extras || []).map(ex => `
        <div class="nf-vit-cell">
          <span class="nf-vit-name">${escHtml(ex.name)}</span>
          <span class="nf-vit-val">${escHtml(ex.value)}</span>
        </div>`).join('')}
    </div>` : '';

  return `
    <div class="nf-card">
      <div class="nf-title">Nutrition Facts</div>
      <div class="nf-subtitle">Per serving${nf.servingSize ? ' &nbsp;·&nbsp; ' + escHtml(nf.servingSize) : ''}</div>
      <div class="nf-calories-block">
        <div><div class="nf-calories-label">Calories</div></div>
        <div class="nf-calories-val">${nf.calories}</div>
      </div>
      ${nfRow('Total Fat',          nf.totalFat,      'g',  pct(nf.totalFat,     DV.totalFat),     'bar-olive', 0,  true)}
      ${nfRow('Saturated Fat',      nf.saturatedFat,  'g',  pct(nf.saturatedFat, DV.saturatedFat), 'bar-olive', 16, false)}
      ${nfRow('<em>Trans</em> Fat', nf.transFat,      'g',  null,                                   null,        16, false)}
      ${nfRow('Cholesterol',        nf.cholesterol,   'mg', pct(nf.cholesterol,  DV.cholesterol),  'bar-sea',   0,  true)}
      ${nfRow('Sodium',             nf.sodium,        'mg', pct(nf.sodium,       DV.sodium),       'bar-sea',   0,  true)}
      ${nfRow('Total Carbohydrate', nf.totalCarb,     'g',  pct(nf.totalCarb,    DV.totalCarb),    'bar-lemon', 0,  true)}
      ${nfRow('Dietary Fiber',      nf.dietaryFiber,  'g',  pct(nf.dietaryFiber, DV.dietaryFiber), 'bar-green', 16, false)}
      ${nfRow('Total Sugars',       nf.totalSugars,   'g',  null,                                   null,        16, false)}
      ${nfRow('Protein',            nf.protein,       'g',  pct(nf.protein,      DV.protein),      'bar-teal',  0,  true)}
      ${extrasHTML}
    </div>`;
}

// ══════════════════════════════════════════════════════════════
// COOK MODE
// ══════════════════════════════════════════════════════════════
let cookSteps  = [];
let cookIndex  = 0;
let cookDots   = [];

function setupCookMode() {
  cookSteps = recipe.steps || [];
  document.getElementById('cook-recipe-name').innerHTML =
    `<strong>${escHtml(recipe.title)}</strong>`;
  buildDots();
  initSwipeGesture();
}

// ── Swipe gesture navigation ────────────────────────────────────
let _swipeInitialized = false;
function initSwipeGesture() {
  if (_swipeInitialized) return;
  _swipeInitialized = true;

  const overlay = document.getElementById('cook-overlay');
  let startX = 0, startY = 0, isHorizontal = null;

  overlay.addEventListener('touchstart', e => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    isHorizontal = null;
  }, { passive: true });

  overlay.addEventListener('touchmove', e => {
    // Don't interfere with ingredients sheet scrolling
    const sheet = document.getElementById('cook-ingredients-sheet');
    if (sheet && sheet.classList.contains('open')) return;

    const dx = e.touches[0].clientX - startX;
    const dy = e.touches[0].clientY - startY;

    // Determine swipe direction on first significant movement
    if (isHorizontal === null && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) {
      isHorizontal = Math.abs(dx) > Math.abs(dy);
    }
    // Lock out scroll for horizontal swipes
    if (isHorizontal) e.preventDefault();
  }, { passive: false });

  overlay.addEventListener('touchend', e => {
    const sheet = document.getElementById('cook-ingredients-sheet');
    if (sheet && sheet.classList.contains('open')) return;

    const dx = e.changedTouches[0].clientX - startX;
    const dy = e.changedTouches[0].clientY - startY;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 2) {
      if (dx < 0) cookNext();
      else cookPrev();
    }
  }, { passive: true });
}

function buildDots() {
  const container = document.getElementById('cook-dots');
  const total = cookSteps.length;
  container.innerHTML = cookSteps.map((_, i) =>
    `<div class="cook-dot" id="cook-dot-${i}" role="listitem" aria-label="Step ${i + 1} of ${total}"></div>`
  ).join('');
  cookDots = Array.from(container.children);
}

function updateDots() {
  const total = cookSteps.length;
  cookDots.forEach((dot, i) => {
    dot.className = 'cook-dot' +
      (i < cookIndex ? ' done' : i === cookIndex ? ' active' : '');
    dot.setAttribute('aria-label', `Step ${i + 1} of ${total}${i < cookIndex ? ' (done)' : i === cookIndex ? ' (current)' : ''}`);
    if (i === cookIndex) {
      dot.setAttribute('aria-current', 'step');
    } else {
      dot.removeAttribute('aria-current');
    }
  });
}

let cookDirection = 'left';

function _applyStepContent() {
  const step = cookSteps[cookIndex];
  const total = cookSteps.length;
  document.getElementById('cook-step-numeral').textContent =
    String(cookIndex + 1).padStart(2, '0');
  document.getElementById('cook-step-title').textContent  = step.title || '';
  document.getElementById('cook-step-label').textContent  =
    `Step ${cookIndex + 1} of ${total}`;
  document.getElementById('cook-step-body').textContent   = step.text || '';

  const tipEl = document.getElementById('cook-step-tip');
  if (step.tip) {
    tipEl.textContent = step.tip;
    tipEl.classList.add('is-visible');
  } else {
    tipEl.classList.remove('is-visible');
    tipEl.textContent = '';
  }

  document.getElementById('cook-prev').disabled = cookIndex === 0;
  document.getElementById('cook-next').disabled = false;
  document.getElementById('cook-next').innerHTML =
    cookIndex === total - 1
      ? '<span class="btn-label">Finish </span>' + feather.toSvg('arrow-right')
      : '<span class="btn-label">Next </span>' + feather.toSvg('arrow-right');

  // Announce step to screen readers via the live region
  const live = document.getElementById('cook-step-live');
  if (live) {
    live.textContent = '';
    requestAnimationFrame(() => {
      live.textContent = `Step ${cookIndex + 1} of ${total}: ${step.title || ''}. ${step.text || ''}`;
    });
  }
}

function showCookStep(skipAnimation) {
  const wrap = document.getElementById('cook-step-wrap');

  if (skipAnimation) {
    _applyStepContent();
    gsap.set(wrap, { opacity: 1, x: 0 });
    updateDots();
    return;
  }

  const outX = cookDirection === 'left' ? -60 : 60;
  const inX  = cookDirection === 'left' ? 60 : -60;

  gsap.to(wrap, {
    x: outX, opacity: 0, duration: 0.2, ease: 'power2.in',
    onComplete() {
      if (cookIndex >= cookSteps.length) { showCelebration(); return; }
      _applyStepContent();
      updateDots();
      gsap.fromTo(wrap, { x: inX, opacity: 0 }, { x: 0, opacity: 1, duration: 0.3, ease: 'power3.out' });
    }
  });
}

function cookNext() {
  if (cookIndex >= cookSteps.length) { closeCookMode(); return; }
  cookDirection = 'left';
  cookIndex++;
  showCookStep();
}

function cookPrev() {
  if (cookIndex > 0) {
    cookDirection = 'right';
    cookIndex--;
    showCookStep();
  }
}

// ── Wake Lock ──────────────────────────────────────────────────
let _wakeLock = null;

async function acquireWakeLock() {
  if (!('wakeLock' in navigator)) return;
  try { _wakeLock = await navigator.wakeLock.request('screen'); } catch (_) {}
}

function releaseWakeLock() {
  if (_wakeLock) { _wakeLock.release(); _wakeLock = null; }
}

// Re-acquire after tab becomes visible again (wake lock is released on hide)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' &&
      document.getElementById('cook-overlay')?.classList.contains('active')) {
    acquireWakeLock();
  }
});

// ── Keyboard handling for cook mode and celebration ─────────────
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') {
    const cel = document.getElementById('cook-celebration');
    if (cel && cel.classList.contains('active')) { closeCelebration(); return; }
    const overlay = document.getElementById('cook-overlay');
    if (overlay && overlay.classList.contains('active')) { closeCookMode(); return; }
  }
  const overlay = document.getElementById('cook-overlay');
  if (!overlay || !overlay.classList.contains('active')) return;
  const sheet = document.getElementById('cook-ingredients-sheet');
  if (sheet && sheet.classList.contains('open')) return;
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); cookNext(); }
  if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   { e.preventDefault(); cookPrev(); }
});

function toggleCookMode() {
  const overlay = document.getElementById('cook-overlay');
  if (overlay.classList.contains('active')) { closeCookMode(); return; }

  document.body.style.overflow = 'hidden';
  cookIndex = 0;
  cookDirection = 'left';
  acquireWakeLock();

  // Prepare step content before revealing
  _applyStepContent();
  updateDots();

  // Set starting state before class change (prevents flash)
  const wrap = document.getElementById('cook-step-wrap');
  gsap.killTweensOf([overlay, wrap]);
  gsap.set(overlay, { opacity: 0, scale: 0.97 });
  gsap.set(wrap, { opacity: 0, y: 12 });

  overlay.classList.add('active'); // CSS applies display:flex now

  const tl = gsap.timeline();
  tl.to(overlay, { opacity: 1, scale: 1, duration: 0.5, ease: 'power3.out' })
    .from('#cook-topbar',    { opacity: 0, y: -18, duration: 0.38, ease: 'power2.out', clearProps: 'all' }, '-=0.3')
    .from('#cook-bottombar', { opacity: 0, y:  18, duration: 0.38, ease: 'power2.out', clearProps: 'all' }, '<')
    .to(wrap, { opacity: 1, y: 0, duration: 0.32, ease: 'power2.out' }, '-=0.12');
}

function closeCookMode() {
  const overlay = document.getElementById('cook-overlay');
  if (!overlay.classList.contains('active')) return;

  const cel = document.getElementById('cook-celebration');
  if (cel) cel.classList.remove('active');
  if (_lottieInstance) { _lottieInstance.destroy(); _lottieInstance = null; }
  closeCookIngredients();
  timerReset();
  releaseWakeLock();

  gsap.killTweensOf(overlay);
  gsap.to(overlay, {
    opacity: 0, scale: 0.97, duration: 0.3, ease: 'power2.in',
    onComplete: () => {
      overlay.classList.remove('active');
      gsap.set(overlay, { clearProps: 'opacity,scale' });
      document.body.style.overflow = '';
    }
  });
}

// ── Timer ──────────────────────────────────────────────────────
let timerInterval = null;
let timerSeconds  = 0;
let timerRunning  = false;

function timerToggle() {
  const btn = document.getElementById('cook-timer-start');
  if (timerRunning) {
    clearInterval(timerInterval);
    timerRunning = false;
    btn.innerHTML = feather.toSvg('play');
  } else {
    timerInterval = setInterval(() => {
      timerSeconds++;
      document.getElementById('cook-timer-digits').textContent = formatTime(timerSeconds);
    }, 1000);
    timerRunning = true;
    btn.innerHTML = feather.toSvg('pause');
  }
}

function timerReset() {
  clearInterval(timerInterval);
  timerRunning  = false;
  timerSeconds  = 0;
  document.getElementById('cook-timer-digits').textContent = '00:00:00';
  document.getElementById('cook-timer-start').innerHTML  = feather.toSvg('play');
}

function formatTime(s) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map(n => String(n).padStart(2, '0')).join(':');
}

// ── Cook Ingredients Sheet ─────────────────────────────────────
function renderCookIngredients() {
  const body = document.getElementById('cook-ingredients-body');
  if (!body || !recipe) return;
  const ratio = servings / baseServings;
  body.innerHTML = buildIngredientHTML(recipe.ingredients || [], ratio);
}

function toggleCookIngredients() {
  const sheet    = document.getElementById('cook-ingredients-sheet');
  const backdrop = document.getElementById('cook-ingredients-backdrop');
  if (sheet.classList.contains('open')) {
    closeCookIngredients();
  } else {
    renderCookIngredients();
    sheet.classList.add('open');
    backdrop.classList.add('open');
  }
}

function closeCookIngredients() {
  const sheet    = document.getElementById('cook-ingredients-sheet');
  const backdrop = document.getElementById('cook-ingredients-backdrop');
  if (!sheet.classList.contains('open')) return;
  sheet.classList.remove('open');
  sheet.classList.add('closing');
  backdrop.classList.remove('open');
  setTimeout(() => sheet.classList.remove('closing'), 280);
}

// ── Celebration screen ─────────────────────────────────────────
let _lottieInstance = null;

function showCelebration() {
  const cel = document.getElementById('cook-celebration');
  if (!cel) return;
  document.getElementById('cook-celebration-sub').textContent =
    recipe ? `Your ${recipe.title} is ready. Serve immediately and enjoy.` : '';
  cel.classList.add('active');

  const container = document.getElementById('cook-lottie');
  if (window.lottie && container) {
    if (_lottieInstance) { _lottieInstance.destroy(); _lottieInstance = null; }
    container.innerHTML = '';
    _lottieInstance = lottie.loadAnimation({
      container,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      path: 'assets/cooking.json'
    });
  }
}

function closeCelebration() {
  const cel = document.getElementById('cook-celebration');
  if (cel) cel.classList.remove('active');
  if (_lottieInstance) { _lottieInstance.destroy(); _lottieInstance = null; }
  closeCookMode();
}

// ── Export to Reminders ────────────────────────────────────────
function exportToReminders() {
  if (!recipe) return;
  const ratio = servings / baseServings;
  const lines = (recipe.ingredients || []).map(ing => {
    const scaled = parseAmount(ing.amount) * ratio;
    const amtStr = formatAmount(scaled);
    const parts = [amtStr, ing.unit, ing.name].filter(Boolean);
    return parts.join(' ');
  });
  const text = encodeURIComponent(lines.join('\n'));
  window.location.href = `shortcuts://run-shortcut?name=Cookbook%20Grocery%20List&input=text&text=${text}`;
}

// ── Print ──────────────────────────────────────────────────────
function printRecipe() {
  if (!recipe) return;
  const r = recipe;
  const ratio = servings / baseServings;

  // Ingredients (no checkboxes)
  const groups = groupIngredientsByCategory(r.ingredients || []);
  const hasCategories = !(groups.length === 1 && groups[0].category === '');
  let ingredientsHTML = '';
  for (const group of groups) {
    if (hasCategories && group.category) {
      ingredientsHTML += `<div class="print-ing-group-title">${escHtml(group.category)}</div>`;
    }
    for (const ing of group.items) {
      const scaled = parseAmount(ing.amount) * ratio;
      const amtStr = formatAmount(scaled);
      ingredientsHTML += `
        <div class="print-ing-item">
          <span class="print-ing-amount">${amtStr}${ing.unit ? ' ' + escHtml(ing.unit) : ''}</span>
          <span class="print-ing-name">${escHtml(ing.name)}${ing.note ? `, <em>${escHtml(ing.note)}</em>` : ''}</span>
        </div>`;
    }
  }

  // Steps
  const stepsHTML = (r.steps || []).map((step, i) => `
    <div class="print-step">
      <div class="print-step-num">${i + 1}</div>
      <div class="print-step-content">
        ${step.title ? `<div class="print-step-title">${escHtml(step.title)}</div>` : ''}
        <p class="print-step-text">${escHtml(step.text || '')}</p>
        ${step.tip ? `<div class="print-step-tip">${escHtml(step.tip)}</div>` : ''}
      </div>
    </div>`).join('');

  // Notes
  const notesHTML = (r.notes || []).length > 0 ? `
    <section class="print-notes">
      <h3>Kitchen Notes</h3>
      <ul>${(r.notes || []).map(n => `<li>${escHtml(n)}</li>`).join('')}</ul>
    </section>` : '';


  const printedOn = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const layout = document.getElementById('print-layout');
  layout.innerHTML = `
    <div class="print-page">
      <header class="print-header">
        <div class="print-logotype"><em>The</em> Cookbook</div>
        ${r.category ? `<div class="print-chapter">${escHtml(r.category)}</div>` : ''}
        <h1 class="print-title">${escHtml(r.title || '')}</h1>
        ${r.subtitle ? `<div class="print-subtitle">${escHtml(r.subtitle)}</div>` : ''}
        <div class="print-header-bottom">
          ${r.description ? `<p class="print-description">${escHtml(r.description)}</p>` : '<div></div>'}
          <div class="print-meta-bar">
            ${r.prepTime ? `<div class="print-meta-item"><span class="print-meta-label">Prep</span><span class="print-meta-val">${r.prepTime} min</span></div>` : ''}
            ${r.cookTime ? `<div class="print-meta-item"><span class="print-meta-label">Cook</span><span class="print-meta-val">${r.cookTime} min</span></div>` : ''}
            <div class="print-meta-item"><span class="print-meta-label">Servings</span><span class="print-meta-val">${servings}</span></div>
            ${r.difficulty ? `<div class="print-meta-item"><span class="print-meta-label">Difficulty</span><span class="print-meta-val">${escHtml(r.difficulty)}</span></div>` : ''}
          </div>
        </div>
      </header>

      <div class="print-body">
        <div class="print-ingredients-col">
          <h2>Ingredients</h2>
          ${ingredientsHTML}
        </div>
        <div class="print-steps-col">
          <h2>Method</h2>
          ${stepsHTML}
        </div>
      </div>

      ${notesHTML}

      <footer class="print-footer">The Cookbook &middot; ${printedOn}</footer>
    </div>
  `;

  window.print();
}

// ── Edit ───────────────────────────────────────────────────────
function editRecipe() {
  const id = getRecipeId();
  if (id) window.location.href = `new-recipe.html?id=${id}`;
}

// ── Init ───────────────────────────────────────────────────────
loadRecipe();

window.addEventListener('beforeunload', function () {
  if (timerInterval) clearInterval(timerInterval);
  document.removeEventListener('click', _onDocumentClick);
});
