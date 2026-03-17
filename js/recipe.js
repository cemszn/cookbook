/* ═══════════════════════════════════════════════════════════════
   recipe.js — Single recipe page
   Loads one recipe from Firestore by URL param ?id=...
   and renders the full page including cook mode.
═══════════════════════════════════════════════════════════════ */

// ── Theme ──────────────────────────────────────────────────────
(function () {
  if (localStorage.getItem('theme') === 'dark') {
    document.documentElement.classList.add('dark');
  }
})();

function toggleTheme() {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

function toolboxBack() {
  const overlay = document.getElementById('cook-overlay');
  if (overlay && overlay.classList.contains('active')) {
    closeCookMode();
  } else {
    history.back();
  }
}

function toggleToolboxMenu(e) {
  e.stopPropagation();
  document.getElementById('toolbox-menu').classList.toggle('open');
}

function closeToolboxMenu() {
  document.getElementById('toolbox-menu').classList.remove('open');
}

document.addEventListener('click', function(e) {
  if (!e.target.closest('.toolbox-right')) closeToolboxMenu();
});

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
    document.title = `${recipe.title} — Cookbook`;
  } catch (err) {
    console.error(err);
    showError('Could not load recipe. Check your Firebase config.');
  }
}

function showError(msg) {
  document.getElementById('recipe-page').innerHTML = `
<div class="empty-state" style="padding:80px 0;">
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
      <div class="book-logotype-main">Cookbook</div>
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
        <span class="meta-value" style="font-size:18px;">${escHtml(r.difficulty || '—')}</span>
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
function renderIngredients() {
  if (!recipe) return;
  const ratio     = servings / baseServings;
  const container = document.getElementById('ingredients-list');
  if (!container) return;

  container.innerHTML = (recipe.ingredients || []).map((ing, i) => {
    const scaled    = parseFloat(ing.amount || 0) * ratio;
    const amtStr    = formatAmount(scaled);
    const isChecked = checkedSet.has(i);
    return `
      <div class="ingredient-item${isChecked ? ' checked' : ''}">
        <input type="checkbox" class="ingredient-checkbox"
          ${isChecked ? 'checked' : ''}
          onchange="toggleIngredient(${i}, this)">
        <span class="ingredient-amount">${amtStr}${ing.unit ? ' ' + escHtml(ing.unit) : ''}</span>
        <span class="ingredient-name">${escHtml(ing.name)}${ing.note
          ? `<br><span class="ingredient-note">${escHtml(ing.note)}</span>`
          : ''}</span>
      </div>`;
  }).join('');

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
      ? `<div class="nf-bar-wrap"${indent ? ` style="margin-left:${indent}px"` : ''}>
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

function setupCookMode() {
  cookSteps = recipe.steps || [];
  document.getElementById('cook-recipe-name').innerHTML =
    `<strong>${escHtml(recipe.title)}</strong>${recipe.subtitle ? ' · ' + escHtml(recipe.subtitle) : ''}`;
  document.getElementById('cook-done-sub').textContent =
    `Your ${recipe.title} is ready. Serve immediately and enjoy.`;
  buildDots();
}

function buildDots() {
  const container = document.getElementById('cook-dots');
  container.innerHTML = cookSteps.map((_, i) =>
    `<div class="cook-dot" id="cook-dot-${i}"></div>`
  ).join('');
}

function updateDots() {
  cookSteps.forEach((_, i) => {
    const dot = document.getElementById(`cook-dot-${i}`);
    if (!dot) return;
    dot.className = 'cook-dot' +
      (i < cookIndex ? ' done' : i === cookIndex ? ' active' : '');
  });
}

function showCookStep() {
  const wrap     = document.getElementById('cook-step-wrap');
  const doneWrap = document.getElementById('cook-done-wrap');

  if (cookIndex >= cookSteps.length) {
    // Done screen
    wrap.classList.remove('visible');
    doneWrap.classList.add('visible');
    document.getElementById('cook-next').textContent = 'Finish';
    document.getElementById('cook-next').disabled = false;
    document.getElementById('cook-prev').disabled = false;
    return;
  }

  doneWrap.classList.remove('visible');
  wrap.classList.remove('visible');

  setTimeout(() => {
    const step = cookSteps[cookIndex];
    document.getElementById('cook-step-numeral').textContent =
      String(cookIndex + 1).padStart(2, '0');
    document.getElementById('cook-step-title').textContent  = step.title || '';
    document.getElementById('cook-step-label').textContent  =
      `Step ${cookIndex + 1} of ${cookSteps.length}`;
    document.getElementById('cook-step-body').textContent   = step.text || '';

    const tipEl = document.getElementById('cook-step-tip');
    if (step.tip) {
      tipEl.textContent    = step.tip;
      tipEl.style.display  = 'inline-block';
    } else {
      tipEl.style.display  = 'none';
    }

    document.getElementById('cook-prev').disabled = cookIndex === 0;
    document.getElementById('cook-next').disabled = false;
    document.getElementById('cook-next').textContent =
      cookIndex === cookSteps.length - 1 ? 'Finish →' : 'Next →';

    wrap.classList.add('visible');
    updateDots();
  }, 120);
}

function cookNext() {
  if (cookIndex >= cookSteps.length) {
    closeCookMode(); return;
  }
  cookIndex++;
  showCookStep();
}

function cookPrev() {
  if (cookIndex > 0) { cookIndex--; showCookStep(); }
}

function toggleCookMode() {
  const overlay  = document.getElementById('cook-overlay');
  const isActive = overlay.classList.toggle('active');

  if (isActive) {
    cookIndex = 0;
    showCookStep();
    document.getElementById('cook-done-wrap').classList.remove('visible');
  }
}

function closeCookMode() {
  document.getElementById('cook-overlay').classList.remove('active');
  timerReset();
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
    btn.textContent = '▶';
  } else {
    timerInterval = setInterval(() => {
      timerSeconds++;
      document.getElementById('cook-timer-digits').textContent = formatTime(timerSeconds);
    }, 1000);
    timerRunning = true;
    btn.textContent = '⏸';
  }
}

function timerReset() {
  clearInterval(timerInterval);
  timerRunning  = false;
  timerSeconds  = 0;
  document.getElementById('cook-timer-digits').textContent = '00:00:00';
  document.getElementById('cook-timer-start').textContent  = '▶';
}

function formatTime(s) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map(n => String(n).padStart(2, '0')).join(':');
}

// ── Utility ────────────────────────────────────────────────────
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Edit ───────────────────────────────────────────────────────
function editRecipe() {
  const id = getRecipeId();
  if (id) window.location.href = `new-recipe.html?id=${id}`;
}

// ── Init ───────────────────────────────────────────────────────
loadRecipe();
