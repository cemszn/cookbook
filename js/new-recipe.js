/* ═══════════════════════════════════════════════════════════════
   new-recipe.js — Add Recipe form
   Manages dynamic field lists and saves new recipes to Firestore.
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

// ── Swatch colour options ──────────────────────────────────────
const SWATCH_COLORS = [
  'fish', 'lemon', 'olive', 'caper',
  'herb', 'spice', 'meat', 'dairy', 'berry', 'citrus'
];

// ── Cloudinary config ─────────────────────────────────────────
// Replace these two values after creating your Cloudinary account.
// Dashboard → top-left cloud name  |  Settings → Upload → Upload presets
const CLOUDINARY_CLOUD_NAME   = 'dfmqt92eh';    // e.g. 'dxyz1abc2'
const CLOUDINARY_UPLOAD_PRESET = 'cookbook_unsigned'; // e.g. 'cookbook_unsigned'

// ── Edit mode ─────────────────────────────────────────────────
let editId            = null;   // set to recipe ID when editing an existing recipe
let selectedImageFile = null;   // File object chosen in the upload field
let existingImageUrl  = null;   // URL already stored when editing

// ── Counters (for unique IDs) ──────────────────────────────────
let kiCount    = 0;
let ingCount   = 0;
let stepCount  = 0;
let noteCount  = 0;
let nfExtCount = 0;

// ── IMAGE UPLOAD ───────────────────────────────────────────────
function handleImageSelect(input) {
  const file = input.files[0];
  if (file) setImagePreview(file);
}

function handleImageDrop(event) {
  event.preventDefault();
  document.getElementById('image-upload-area').classList.remove('drag-over');
  const file = event.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) setImagePreview(file);
}

function setImagePreview(file) {
  if (file.size > 5 * 1024 * 1024) {
    alert('Image must be smaller than 5 MB.');
    return;
  }
  selectedImageFile = file;
  const reader = new FileReader();
  reader.onload = e => {
    const preview = document.getElementById('image-preview');
    preview.src = e.target.result;
    preview.style.display = 'block';
    document.getElementById('image-upload-placeholder').style.display = 'none';
    document.getElementById('image-remove-btn').style.display = 'inline-flex';
  };
  reader.readAsDataURL(file);
}

function showExistingImage(url) {
  const preview = document.getElementById('image-preview');
  preview.src = url;
  preview.style.display = 'block';
  document.getElementById('image-upload-placeholder').style.display = 'none';
  document.getElementById('image-remove-btn').style.display = 'inline-flex';
}

function removeImage() {
  selectedImageFile = null;
  existingImageUrl  = null;
  const preview = document.getElementById('image-preview');
  preview.src = '';
  preview.style.display = 'none';
  document.getElementById('image-upload-placeholder').style.display = 'flex';
  document.getElementById('image-remove-btn').style.display = 'none';
  document.getElementById('f-image').value = '';
}

async function uploadImage(/* recipeId unused — Cloudinary generates its own public ID */) {
  if (!selectedImageFile) return existingImageUrl;

  const formData = new FormData();
  formData.append('file', selectedImageFile);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Cloudinary upload failed (${res.status})`);
  }

  const data = await res.json();
  return data.secure_url;
}

// ── KEY INGREDIENTS ────────────────────────────────────────────
function addKeyIngredient() {
  const list = document.getElementById('key-ingredients-list');
  if (list.children.length >= 4) {
    document.getElementById('add-key-ingredient').style.opacity = '0.4';
    document.getElementById('add-key-ingredient').style.pointerEvents = 'none';
    return;
  }
  const id = `ki-${kiCount++}`;
  const div = document.createElement('div');
  div.className = 'key-ingredient-block';
  div.id = id;
  div.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <span style="font-size:10px; letter-spacing:0.2em; text-transform:uppercase; color:var(--text-light);">
        Key Ingredient ${list.children.length + 1}
      </span>
      <button type="button" class="btn-remove" onclick="removeItem('${id}', 'key')">✕</button>
    </div>
    <div class="form-row two">
      <div class="form-field">
        <label>Ingredient Name</label>
        <input class="form-input ki-name" type="text"
          placeholder="e.g. White Fish" oninput="updateKiPreview('${id}')" />
      </div>
      <div class="form-field">
        <label>Role / Description</label>
        <input class="form-input ki-role" type="text"
          placeholder="e.g. Sea bass, bream or halibut" />
      </div>
    </div>
    <div class="form-field">
      <label>Colour</label>
      <div class="swatch-picker" id="${id}-swatches">
        ${SWATCH_COLORS.map((c, i) => `
          <div class="swatch-option ${c}${i === 0 ? ' selected' : ''}"
            data-color="${c}" onclick="selectSwatch('${id}', '${c}')"></div>
        `).join('')}
      </div>
    </div>
    <div class="key-ingredient-preview" id="${id}-preview">
      <div class="swatch-dot ${SWATCH_COLORS[0]}" id="${id}-preview-swatch"></div>
      <span class="key-ingredient-preview-name" id="${id}-preview-name">—</span>
    </div>`;
  list.appendChild(div);
}

function selectSwatch(blockId, color) {
  const container = document.getElementById(`${blockId}-swatches`);
  container.querySelectorAll('.swatch-option').forEach(el => {
    el.classList.toggle('selected', el.dataset.color === color);
  });
  const previewSwatch = document.getElementById(`${blockId}-preview-swatch`);
  previewSwatch.className = `swatch-dot ${color}`;
}

function updateKiPreview(blockId) {
  const block = document.getElementById(blockId);
  const name  = block.querySelector('.ki-name').value || '—';
  document.getElementById(`${blockId}-preview-name`).textContent = name;
}

// ── INGREDIENTS ────────────────────────────────────────────────
function addIngredient() {
  const list = document.getElementById('ingredients-list');
  const num  = list.children.length + 1;
  const id   = `ing-${ingCount++}`;
  const div  = document.createElement('div');
  div.className = 'dynamic-item';
  div.id = id;
  div.innerHTML = `
    <span class="dynamic-item-number">${num}</span>
    <div class="dynamic-item-fields">
      <input class="form-input narrow" type="text" placeholder="Amount" title="Amount (e.g. 2, ½, 200)" />
      <input class="form-input narrow" type="text" placeholder="Unit" title="Unit (e.g. tbsp, g, ml, cloves)" />
      <input class="form-input" type="text" placeholder="Ingredient name *" required />
      <input class="form-input" type="text" placeholder="Note (optional, e.g. finely chopped)" />
    </div>
    <button type="button" class="btn-remove" onclick="removeItem('${id}', 'ing')">✕</button>`;
  list.appendChild(div);
}

// ── STEPS ──────────────────────────────────────────────────────
function addStep() {
  const list = document.getElementById('steps-list');
  const num  = list.children.length + 1;
  const id   = `step-${stepCount++}`;
  const div  = document.createElement('div');
  div.className = 'dynamic-item';
  div.id = id;
  div.innerHTML = `
    <span class="dynamic-item-number">${num}</span>
    <div class="dynamic-item-fields" style="flex-direction:column;">
      <input class="form-input" type="text" placeholder="Step title * (e.g. Preheat the Oven)" required />
      <textarea class="form-textarea" placeholder="Step instructions *" required></textarea>
      <input class="form-input" type="text" placeholder="Tip (optional — shown as a highlighted callout)" />
    </div>
    <button type="button" class="btn-remove" onclick="removeItem('${id}', 'step')">✕</button>`;
  list.appendChild(div);
}

// ── NOTES ──────────────────────────────────────────────────────
function addNote() {
  const list = document.getElementById('notes-list');
  const num  = list.children.length + 1;
  const id   = `note-${noteCount++}`;
  const div  = document.createElement('div');
  div.className = 'dynamic-item';
  div.id = id;
  div.innerHTML = `
    <span class="dynamic-item-number">${num}</span>
    <div class="dynamic-item-fields">
      <textarea class="form-textarea" placeholder="Kitchen note ${num} — tip, substitution, or variation…"></textarea>
    </div>
    <button type="button" class="btn-remove" onclick="removeItem('${id}', 'note')">✕</button>`;
  list.appendChild(div);
}

// ── NUTRITION EXTRAS ───────────────────────────────────────────
function addNutritionExtra(data) {
  const list = document.getElementById('nf-extras-list');
  const num  = list.children.length + 1;
  const id   = `nf-ext-${nfExtCount++}`;
  const div  = document.createElement('div');
  div.className = 'dynamic-item';
  div.id = id;
  div.innerHTML = `
    <span class="dynamic-item-number">${num}</span>
    <div class="dynamic-item-fields">
      <input class="form-input" type="text" placeholder="Name (e.g. Vitamin D, Iron, Omega-3)"
        value="${data ? escFormVal(data.name) : ''}" />
      <input class="form-input narrow" type="text" placeholder="Value (e.g. 35%, High)"
        value="${data ? escFormVal(data.value) : ''}" />
    </div>
    <button type="button" class="btn-remove" onclick="removeItem('${id}', 'nfext')">✕</button>`;
  list.appendChild(div);
}

function escFormVal(str) {
  return (str || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ── REMOVE ITEM ────────────────────────────────────────────────
function removeItem(id, type) {
  const el = document.getElementById(id);
  if (el) el.remove();

  // Re-enable add key ingredient button if under 4
  if (type === 'key') {
    const list = document.getElementById('key-ingredients-list');
    const btn  = document.getElementById('add-key-ingredient');
    if (list.children.length < 4) {
      btn.style.opacity       = '1';
      btn.style.pointerEvents = 'auto';
    }
  }

  // Renumber remaining items
  const listId = type === 'key'   ? 'key-ingredients-list'
               : type === 'ing'   ? 'ingredients-list'
               : type === 'step'  ? 'steps-list'
               : type === 'nfext' ? 'nf-extras-list'
               :                    'notes-list';

  const list = document.getElementById(listId);
  if (!list) return;

  // Renumber visible number labels
  if (type !== 'key') {
    list.querySelectorAll('.dynamic-item-number').forEach((el, i) => {
      el.textContent = i + 1;
    });
  }
}

// ── EDIT MODE: load & pre-populate ────────────────────────────

function addKeyIngredientWithData(ki) {
  addKeyIngredient();
  const list  = document.getElementById('key-ingredients-list');
  const block = list.lastElementChild;
  const id    = block.id;
  block.querySelector('.ki-name').value = ki.name || '';
  block.querySelector('.ki-role').value = ki.role || '';
  updateKiPreview(id);
  if (ki.color) selectSwatch(id, ki.color);
}

function addIngredientWithData(ing) {
  addIngredient();
  const list   = document.getElementById('ingredients-list');
  const item   = list.lastElementChild;
  const inputs = item.querySelectorAll('.form-input');
  inputs[0].value = ing.amount || '';
  inputs[1].value = ing.unit   || '';
  inputs[2].value = ing.name   || '';
  inputs[3].value = ing.note   || '';
}

function addStepWithData(step) {
  addStep();
  const list  = document.getElementById('steps-list');
  const item  = list.lastElementChild;
  const title = item.querySelector('input[type="text"]');
  const body  = item.querySelector('textarea');
  const tip   = item.querySelectorAll('input[type="text"]')[1];
  title.value = step.title || '';
  body.value  = step.text  || '';
  if (tip) tip.value = step.tip || '';
}

function addNoteWithData(text) {
  addNote();
  const list = document.getElementById('notes-list');
  const item = list.lastElementChild;
  item.querySelector('textarea').value = text || '';
}

function populateForm(r) {
  // Basics
  document.getElementById('f-title').value       = r.title       || '';
  document.getElementById('f-subtitle').value    = r.subtitle    || '';
  document.getElementById('f-category').value    = r.category    || '';
  document.getElementById('f-description').value = r.description || '';
  document.getElementById('f-prep').value        = r.prepTime    ?? '';
  document.getElementById('f-cook').value        = r.cookTime    ?? '';
  document.getElementById('f-servings').value    = r.servings    ?? '';
  document.getElementById('f-difficulty').value  = r.difficulty  || '';
  document.getElementById('f-tags').value        = (r.tags || []).join(', ');

  // Clear seeded empty rows before populating
  document.getElementById('key-ingredients-list').innerHTML = '';
  document.getElementById('ingredients-list').innerHTML     = '';
  document.getElementById('steps-list').innerHTML           = '';
  document.getElementById('notes-list').innerHTML           = '';

  (r.keyIngredients || []).forEach(ki   => addKeyIngredientWithData(ki));
  (r.ingredients    || []).forEach(ing  => addIngredientWithData(ing));
  (r.steps          || []).forEach(step => addStepWithData(step));
  (r.notes          || []).forEach(note => addNoteWithData(note));

  // Image
  if (r.imageUrl) {
    existingImageUrl = r.imageUrl;
    showExistingImage(r.imageUrl);
  }

  // Nutrition
  const nf = r.nutrition || {};
  const nfSetVal = (id, val) => {
    const el = document.getElementById(id);
    if (el && val !== undefined && val !== null) el.value = val;
  };
  nfSetVal('nf-serving-size',   nf.servingSize);
  nfSetVal('nf-calories',       nf.calories);
  nfSetVal('nf-total-fat',      nf.totalFat);
  nfSetVal('nf-saturated-fat',  nf.saturatedFat);
  nfSetVal('nf-trans-fat',      nf.transFat);
  nfSetVal('nf-cholesterol',    nf.cholesterol);
  nfSetVal('nf-sodium',         nf.sodium);
  nfSetVal('nf-total-carb',     nf.totalCarb);
  nfSetVal('nf-fiber',          nf.dietaryFiber);
  nfSetVal('nf-total-sugars',   nf.totalSugars);
  nfSetVal('nf-protein',        nf.protein);
  document.getElementById('nf-extras-list').innerHTML = '';
  (nf.extras || []).forEach(ex => addNutritionExtra(ex));

  // Fall back to at least one empty row if nothing was loaded
  if (!r.ingredients || r.ingredients.length === 0) addIngredient();
  if (!r.steps       || r.steps.length       === 0) addStep();
}

async function loadForEdit(id) {
  try {
    const doc = await db.collection('recipes').doc(id).get();
    if (!doc.exists) {
      alert('Recipe not found — it may have been deleted.');
      window.location.href = 'index.html';
      return;
    }
    const r = { id: doc.id, ...doc.data() };

    // Switch UI to edit mode
    editId = id;
    document.getElementById('page-heading').textContent = 'Edit Recipe';
    document.title = `Edit: ${r.title} — Cookbook`;
    document.getElementById('submit-btn').lastChild.textContent = ' Update Recipe';

    // Back / Cancel both return to the recipe page, not the home page
    const recipeUrl = `recipe.html?id=${id}`;
    document.getElementById('back-btn').href   = recipeUrl;
    document.getElementById('cancel-btn').href = recipeUrl;
    document.getElementById('back-btn').textContent = '← Back to recipe';

    populateForm(r);
  } catch (err) {
    console.error(err);
    alert('Could not load recipe for editing.');
  }
}

// ── COLLECT FORM DATA ──────────────────────────────────────────
function collectFormData() {
  // Basics
  const title       = document.getElementById('f-title').value.trim();
  const subtitle    = document.getElementById('f-subtitle').value.trim();
  const category    = document.getElementById('f-category').value.trim();
  const description = document.getElementById('f-description').value.trim();
  const prepTime    = parseInt(document.getElementById('f-prep').value) || 0;
  const cookTime    = parseInt(document.getElementById('f-cook').value) || 0;
  const servings    = parseInt(document.getElementById('f-servings').value) || 2;
  const difficulty  = document.getElementById('f-difficulty').value;
  const tagsRaw     = document.getElementById('f-tags').value;
  const tags        = tagsRaw.split(',').map(t => t.trim()).filter(Boolean);

  // Key ingredients
  const keyIngredients = [];
  document.querySelectorAll('#key-ingredients-list .key-ingredient-block').forEach(block => {
    const name     = block.querySelector('.ki-name').value.trim();
    const role     = block.querySelector('.ki-role').value.trim();
    const selected = block.querySelector('.swatch-option.selected');
    const color    = selected ? selected.dataset.color : 'herb';
    if (name) keyIngredients.push({ name, role, color });
  });

  // Ingredients
  const ingredients = [];
  document.querySelectorAll('#ingredients-list .dynamic-item').forEach(item => {
    const inputs = item.querySelectorAll('.form-input');
    const amount = inputs[0]?.value.trim() || '';
    const unit   = inputs[1]?.value.trim() || '';
    const name   = inputs[2]?.value.trim() || '';
    const note   = inputs[3]?.value.trim() || '';
    if (name) ingredients.push({ amount, unit, name, note });
  });

  // Steps
  const steps = [];
  document.querySelectorAll('#steps-list .dynamic-item').forEach(item => {
    const titleEl    = item.querySelector('input[type="text"]');
    const textArea   = item.querySelector('textarea');
    const tipEl      = item.querySelectorAll('input[type="text"]')[1];
    const stepTitle  = titleEl?.value.trim()  || '';
    const stepText   = textArea?.value.trim() || '';
    const stepTip    = tipEl?.value.trim()    || '';
    if (stepTitle || stepText) steps.push({ title: stepTitle, text: stepText, tip: stepTip });
  });

  // Notes
  const notes = [];
  document.querySelectorAll('#notes-list .dynamic-item textarea').forEach(ta => {
    const val = ta.value.trim();
    if (val) notes.push(val);
  });

  // Nutrition
  const nfNum = id => { const v = parseFloat(document.getElementById(id)?.value); return isNaN(v) ? null : v; };
  const nfStr = id => document.getElementById(id)?.value.trim() || null;
  const nfExtras = [];
  document.querySelectorAll('#nf-extras-list .dynamic-item').forEach(item => {
    const inputs = item.querySelectorAll('.form-input');
    const name  = inputs[0]?.value.trim() || '';
    const value = inputs[1]?.value.trim() || '';
    if (name) nfExtras.push({ name, value });
  });
  const nutrition = {
    servingSize:   nfStr('nf-serving-size'),
    calories:      nfNum('nf-calories'),
    totalFat:      nfNum('nf-total-fat'),
    saturatedFat:  nfNum('nf-saturated-fat'),
    transFat:      nfNum('nf-trans-fat'),
    cholesterol:   nfNum('nf-cholesterol'),
    sodium:        nfNum('nf-sodium'),
    totalCarb:     nfNum('nf-total-carb'),
    dietaryFiber:  nfNum('nf-fiber'),
    totalSugars:   nfNum('nf-total-sugars'),
    protein:       nfNum('nf-protein'),
    extras:        nfExtras
  };
  // Only include nutrition in the payload if at least calories was entered
  const hasNutrition = nutrition.calories !== null;

  return { title, subtitle, category, description, prepTime, cookTime,
           servings, difficulty, tags, keyIngredients, ingredients, steps, notes,
           ...(hasNutrition ? { nutrition } : {}) };
}

async function resolveImageUrl() {
  if (selectedImageFile) return await uploadImage();
  return existingImageUrl || null;
}

// ── VALIDATE ──────────────────────────────────────────────────
function validate(data) {
  if (!data.title)            return 'Please add a recipe title.';
  if (!data.description)      return 'Please add a description.';
  if (!data.prepTime && data.prepTime !== 0) return 'Please add a prep time.';
  if (!data.cookTime && data.cookTime !== 0) return 'Please add a cook time.';
  if (!data.servings)         return 'Please add the number of servings.';
  if (!data.difficulty)       return 'Please select a difficulty level.';
  if (data.ingredients.length === 0) return 'Please add at least one ingredient.';
  if (data.steps.length === 0)       return 'Please add at least one method step.';
  return null;
}

// ── SUBMIT ─────────────────────────────────────────────────────
async function submitRecipe(e) {
  e.preventDefault();

  const statusEl  = document.getElementById('form-status');
  const submitBtn = document.getElementById('submit-btn');
  const spinner   = document.getElementById('submit-spinner');

  statusEl.textContent = '';
  statusEl.className   = 'form-status';

  const data = collectFormData();
  const err  = validate(data);

  if (err) {
    statusEl.textContent = err;
    statusEl.className   = 'form-status error';
    return;
  }

  // Loading state
  submitBtn.disabled      = true;
  spinner.style.display   = 'inline-block';

  try {
    let recipeId;

    if (editId) {
      recipeId = editId;
      statusEl.textContent = selectedImageFile ? 'Uploading image… (1/2)' : 'Saving…';
      let imageUrl = null;
      let imageWarn = null;
      try {
        imageUrl = await resolveImageUrl();
      } catch (imgErr) {
        console.warn('Image upload failed:', imgErr);
        imageWarn = 'Recipe saved, but the image could not be uploaded. Check your Firebase Storage rules.';
      }

      statusEl.textContent = selectedImageFile ? 'Saving recipe… (2/2)' : 'Saving…';
      await db.collection('recipes').doc(recipeId).set({
        ...data,
        ...(imageUrl ? { imageUrl } : { imageUrl: null }),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      if (imageWarn) {
        spinner.style.display  = 'none';
        submitBtn.disabled     = false;
        statusEl.textContent   = imageWarn;
        statusEl.className     = 'form-status error';
        return;
      }
      window.location.href = `recipe.html?id=${recipeId}`;

    } else {
      // ── Create new recipe — create doc first to get an ID for the image path ──
      statusEl.textContent = 'Saving recipe…';
      const docRef = await db.collection('recipes').add({
        ...data,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      recipeId = docRef.id;

      if (selectedImageFile) {
        statusEl.textContent = 'Uploading image… (2/2)';
        let imageUrl = null;
        let imageWarn = null;
        try {
          imageUrl = await uploadImage(recipeId);
        } catch (imgErr) {
          console.warn('Image upload failed:', imgErr);
          imageWarn = 'Recipe saved, but the image could not be uploaded. Check your Firebase Storage rules.';
        }
        if (imageUrl) await docRef.update({ imageUrl });

        if (imageWarn) {
          spinner.style.display  = 'none';
          submitBtn.disabled     = false;
          statusEl.textContent   = imageWarn;
          statusEl.className     = 'form-status error';
          return;
        }
      }

      window.location.href = `recipe.html?id=${recipeId}`;
    }

  } catch (err) {
    console.error(err);
    submitBtn.disabled     = false;
    spinner.style.display  = 'none';
    statusEl.textContent   = 'Error saving recipe. Check your Firebase config and try again.';
    statusEl.className     = 'form-status error';
  }
}

// ── Init ───────────────────────────────────────────────────────
// If ?id= is present we're editing an existing recipe; otherwise
// seed the form with one empty ingredient row and one empty step.
(function () {
  const id = new URLSearchParams(window.location.search).get('id');
  if (id) {
    loadForEdit(id);
  } else {
    addIngredient();
    addStep();
  }
})();
