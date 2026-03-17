/* ═══════════════════════════════════════════════════════════════
   home.js — Homepage logic
   Loads all recipes from Firestore and renders the recipe grid.
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
        <a href="new-recipe.html" class="btn-new-recipe">＋ Add your first recipe</a>
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

  return `
    <a class="recipe-card" href="recipe.html?id=${r.id}">
      <div class="card-top">
        <div class="card-swatch swatch-dot ${escHtml(firstSwatch)}"></div>
        <span class="card-category">${escHtml(r.category || '')}</span>
      </div>
      <div class="card-title">${escHtml(r.title || 'Untitled')}</div>
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
          <span class="card-meta-value" style="font-size:14px;">${escHtml(r.difficulty || '—')}</span>
        </div>
      </div>
      ${tagsHTML ? `<div class="card-tags">${tagsHTML}</div>` : ''}
    </a>`;
}

// ── Search / Filter ────────────────────────────────────────────
function filterRecipes() {
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

// ── Utility ────────────────────────────────────────────────────
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Init ───────────────────────────────────────────────────────
loadRecipes();
