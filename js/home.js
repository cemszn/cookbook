/* ═══════════════════════════════════════════════════════════════
   home.js — Homepage logic
   Loads all recipes from Firestore and renders the recipe grid.
═══════════════════════════════════════════════════════════════ */

// ── State ──────────────────────────────────────────────────────
let allRecipes = [];

// ── Load Recipes ───────────────────────────────────────────────
async function loadRecipes() {
  const grid = document.getElementById('recipe-grid');
  try {
    const snapshot = await db.collection('recipes').orderBy('createdAt', 'desc').get();
    allRecipes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderGrid(allRecipes);
  } catch (err) {
    console.error('Error loading recipes:', err);
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <div class="empty-state-title">Couldn't load recipes</div>
        <div class="empty-state-sub">Check your Firebase configuration in js/firebase-config.js and ensure Firestore is enabled.</div>
      </div>`;
  }
}

// ── Render Grid ────────────────────────────────────────────────
function renderGrid(recipes) {
  const grid = document.getElementById('recipe-grid');

  if (recipes.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📖</div>
        <div class="empty-state-title">No recipes yet</div>
        <div class="empty-state-sub">Start building your cookbook by adding your first recipe.</div>
        <a href="new-recipe.html" class="btn-new-recipe">${feather.toSvg('plus')} Add your first recipe</a>
      </div>`;
    return;
  }

  grid.innerHTML = recipes.map(r => recipeCardHTML(r)).join('');
}

// ── Recipe Card HTML ───────────────────────────────────────────
function recipeCardHTML(r) {
  const firstSwatch = (r.keyIngredients && r.keyIngredients[0])
    ? r.keyIngredients[0].color
    : 'herb';

  const totalTime = (r.prepTime || 0) + (r.cookTime || 0);

  const tagsHTML = (r.tags || []).slice(0, 3).map(t =>
    `<span class="card-tag">${escHtml(t)}</span>`
  ).join('');

  const headerHTML = r.imageUrl ? `
    <div class="card-hero">
      <div class="card-image-wrap">
        <img class="card-image" src="${escHtml(r.imageUrl)}" alt="${escHtml(r.title || '')}">
      </div>
      <div class="card-image-overlay">
        <span class="card-category">${escHtml(r.category || '')}</span>
      </div>
    </div>
    <div class="card-title">${escHtml(r.title || 'Untitled')}</div>` : `
    <div class="card-top">
      <div class="card-swatch swatch-dot ${escHtml(firstSwatch)}"></div>
      <span class="card-category">${escHtml(r.category || '')}</span>
    </div>
    <div class="card-title">${escHtml(r.title || 'Untitled')}</div>`;

  return `
    <a class="recipe-card" href="recipe.html?id=${r.id}">
      ${headerHTML}
      ${r.subtitle ? `<div class="card-subtitle">${escHtml(r.subtitle)}</div>` : ''}
      <div class="card-description">${escHtml(r.description || '')}</div>
      <div class="card-meta">
        <div class="card-meta-item">
          <span class="card-meta-label">Total Time</span>
          <span class="card-meta-value">${totalTime} <span class="card-meta-unit">min</span></span>
        </div>
        <div class="card-meta-item">
          <span class="card-meta-label">Serves</span>
          <span class="card-meta-value">${r.servings || '—'}</span>
        </div>
        <div class="card-meta-item">
          <span class="card-meta-label">Difficulty</span>
          <span class="card-meta-value card-meta-value--small">${escHtml(r.difficulty || '—')}</span>
        </div>
      </div>
      ${tagsHTML ? `<div class="card-tags">${tagsHTML}</div>` : ''}
    </a>`;
}

// ── Search / Filter ────────────────────────────────────────────
function _filterRecipesImpl() {
  const query = document.getElementById('search-input').value.toLowerCase().trim();
  if (!query) {
    renderGrid(allRecipes);
    return;
  }
  const filtered = allRecipes.filter(r => {
    const searchable = [
      r.title, r.subtitle, r.category, r.description,
      ...(r.tags || []),
      ...(r.keyIngredients || []).map(ki => ki.name)
    ].join(' ').toLowerCase();
    return searchable.includes(query);
  });
  renderGrid(filtered);
}

const filterRecipes = debounce(_filterRecipesImpl, 250);

// ── Card navigation transition ─────────────────────────────────
document.getElementById('recipe-grid').addEventListener('click', e => {
  const card = e.target.closest('.recipe-card');
  if (!card) return;
  e.preventDefault();
  const href = card.getAttribute('href');

  const veil = document.createElement('div');
  veil.id = 'page-veil';
  veil.style.opacity = '0';
  document.body.appendChild(veil);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    veil.style.opacity = '1';
  }));
  setTimeout(() => { window.location.href = href; }, 320);
});

// ── Init ───────────────────────────────────────────────────────
loadRecipes();
