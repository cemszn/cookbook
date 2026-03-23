/* ═══════════════════════════════════════════════════════════════
   home.js — Homepage logic
   Loads all recipes from Firestore and renders the recipe grid.
═══════════════════════════════════════════════════════════════ */

// ── State ──────────────────────────────────────────────────────
let allRecipes = [];
let featuredRecipeId = null;

// ── Load Recipes ───────────────────────────────────────────────
async function loadRecipes() {
  const grid = document.getElementById('recipe-grid');
  try {
    const snapshot = await db.collection('recipes').orderBy('createdAt', 'desc').get();
    allRecipes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderFeaturedCard(allRecipes);
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

// ── Featured Card ──────────────────────────────────────────────
function renderFeaturedCard(recipes) {
  if (!recipes.length) return;
  const r = recipes[Math.floor(Math.random() * recipes.length)];
  featuredRecipeId = r.id;
  document.getElementById('featured-recipe-container').innerHTML = featuredCardHTML(r);
}

function featuredCardHTML(r) {
  const totalTime = (r.prepTime || 0) + (r.cookTime || 0);

  const clipHTML = `<span class="featured-clip-label">Featured</span>`;

  const imageSide = r.imageUrl ? `
    <div class="featured-card-image-side">
      <img src="${escHtml(r.imageUrl)}" alt="${escHtml(r.title || '')}">
    </div>` : (() => {
      const firstColor = (r.keyIngredients && r.keyIngredients[0]) ? r.keyIngredients[0].color : 'herb';
      return `
    <div class="featured-card-image-side featured-card-image-side--swatch">
      <div class="featured-card-swatch-bg">
        <div class="swatch-dot ${escHtml(firstColor)} featured-card-swatch-dot"></div>
      </div>
    </div>`;
    })();

  const ingredients = (r.keyIngredients || []).slice(0, 4);
  const ingredientsHTML = ingredients.length ? `
    <div class="featured-ingredients">
      ${ingredients.map(ki => `
        <div class="featured-ingredient">
          <div class="swatch-dot ${escHtml(ki.color || 'herb')}"></div>
          <span class="featured-ingredient-name">${escHtml(ki.name || '')}</span>
        </div>`).join('')}
    </div>` : '';

  const tagsHTML = (r.tags || []).slice(0, 4).map(t =>
    `<span class="card-tag">${escHtml(t)}</span>`
  ).join('');

  return `
    <a class="featured-card" href="recipe.html?id=${r.id}">
      ${clipHTML}
      ${imageSide}
      <div class="featured-card-content">
        <span class="card-category featured-card-category">${escHtml(r.category || '')}</span>
        <div class="featured-card-title">${escHtml(r.title || 'Untitled')}</div>
        ${r.subtitle ? `<div class="featured-card-subtitle">${escHtml(r.subtitle)}</div>` : ''}
        <div class="featured-card-description">${escHtml(r.description || '')}</div>
        ${ingredientsHTML}
        <div class="card-meta featured-card-meta">
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
      </div>
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
document.getElementById('featured-recipe-container').addEventListener('click', e => {
  const card = e.target.closest('.featured-card');
  if (!card) return;
  e.preventDefault();
  const href = card.getAttribute('href');
  const veil = createVeil(0);
  requestAnimationFrame(() => requestAnimationFrame(() => { veil.style.opacity = '1'; }));
  setTimeout(() => { window.location.href = href; }, 320);
});

document.getElementById('recipe-grid').addEventListener('click', e => {
  const card = e.target.closest('.recipe-card');
  if (!card) return;
  e.preventDefault();
  const href = card.getAttribute('href');

  const veil = createVeil(0);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    veil.style.opacity = '1';
  }));
  setTimeout(() => { window.location.href = href; }, 320);
});

// ── Init ───────────────────────────────────────────────────────
loadRecipes();
