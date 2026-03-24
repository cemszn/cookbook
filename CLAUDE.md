# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# The Cookbook — Project Instructions

## Architecture

**No build process.** This is a static site — vanilla JS, vanilla CSS, no npm, no bundler. To develop locally, open any `.html` file in a browser or run `python -m http.server`.

**Four pages:**
- `index.html` + `js/home.js` — Recipe grid, search, featured recipe
- `recipe.html` + `js/recipe.js` — Single recipe view, cook mode, servings scaling
- `new-recipe.html` + `js/new-recipe.js` — Create/edit form, image upload
- `login.html` — Firebase email/password authentication

**Shared files:**
- `js/firebase-config.js` — Firebase credentials and SDK initialization
- `js/auth.js` — `onAuthStateChanged()` listener; shows/hides elements via `data-auth="show|hide"` attributes
- `js/utils.js` — Theme toggle, page transition (`navigateWithVeil()`), `debounce()`
- `css/styles.css` — All styles; ~70+ CSS custom properties; dark mode via `html.dark` selector

**Data layer:** Firebase Firestore (compat SDK 9.23.0). Recipes live at `/recipes/{docId}`. Images are uploaded to Cloudinary (unsigned preset `cookbook_unsigned`, cloud `dfmqt92eh`) and the URL is stored in Firestore.

**Firestore recipe schema:**
```
title, subtitle, category, description, prepTime, cookTime, servings, difficulty,
imageUrl, tags[], keyIngredients[{name, role, color}],
ingredients[{amount, unit, name, note, category}],
steps[{title, text, tip}], notes[], nutrition{...}, createdAt, updatedAt
```

**Recipe ID** is passed between pages via `?id=` query param.

**External dependencies (all via CDN, no install needed):**
- Firebase 9.23.0 compat (Auth + Firestore)
- GSAP 3.12.5 (animations)
- Lottie 5.12.2 (`assets/loading.json`, `assets/cooking.json`)
- Feather Icons (replaced at runtime via `feather.replace()`)
- Google Fonts: Cormorant Garamond, DM Sans

**Cache busting:** CSS/JS files use manual `?v=N` query strings. Bump the version number when making changes to cached files.

## CSS Conventions

All design tokens are CSS custom properties at the top of `styles.css`. Key ones:
- Colors: `--cream`, `--green-deep`, `--sea`, `--lemon`
- Dark mode counterparts under `html.dark`
- Type scale: `--text-3xl` through `--text-2xs`
- Shadows, border radii, spacing defined as variables

Class naming is BEM-lite: `recipe-card`, `card-title`, `card-meta`. Dark mode always handled via `html.dark` ancestor selector, not `prefers-color-scheme` media query.

## JavaScript Conventions

- XSS prevention: always pass user/db content through `escHtml()` (defined in `utils.js`) before inserting into HTML
- State is module-level globals (`allRecipes`, `recipe`, `servings`, etc.) — no state management library
- Page navigation uses `navigateWithVeil()` for the fade transition; don't use `window.location.href` directly for internal navigation
- Auth guard at top of protected pages: redirect to `/login.html` if no user

---

## Design Context

### Users
A private cookbook for personal or family use — not public-facing. The people using it know each other. They open it on a phone propped on the kitchen counter with floury hands, on an iPad browsing from the couch, at a desktop when writing a new recipe, and as an installed PWA on their home screen. The experience must work beautifully across all of these contexts, but the phone-in-kitchen scenario deserves the most care: large touch targets, scannable type, minimal friction.

The "job to be done" shifts by moment:
- **Browsing**: Discovery, deciding what to cook tonight
- **Cooking**: Step-by-step focus, no distractions, hands busy
- **Editing**: Careful, deliberate, desk-like task

### Brand Personality
**Rich · Indulgent · Craft**

This is a premium culinary journal, not an app. It should feel like a beautifully bound recipe book that happens to be digital — something you'd find on a marble countertop next to a copper pan. The tone is intimate and personal (this is *their* cookbook), tactile and considered (every detail noticed), never clinical or transactional.

Emotional goals: warmth, pride of ownership, quiet delight, the pleasure of cooking well.

### Aesthetic Direction
**Visual tone**: Deep forest greens and warm cream — earthy, grounded, organic. Not trendy. The palette: `#1e3828` deep green, `#f7f2ea` cream, sea blue accent, lemon gold.

**Typography**: Cormorant Garamond (light, elegant serif) paired with DM Sans (clean, functional). The serif for anything *crafted*; the sans for anything *clear*.

**Texture & depth**: Layered shadows, subtle gradients, inset highlights. Slightly three-dimensional — like paper and ink.

**Motion**: Slow and intentional. Smooth entrance animations, gentle slide transitions. Nothing snappy.

**Dark mode**: First-class. The inverted palette (deep blacks with light greens) is equally beautiful.

**References**: Kinfolk magazine, Ottolenghi cookbooks, Aesop product pages, Sonos app.

**Anti-references**: Allrecipes, Linear/Notion dashboards, Instagram feeds, MyFitnessPal.

### Design Principles

1. **Craft over convenience** — Every detail should feel deliberate. Generous whitespace, considered typography, unhurried transitions.

2. **Context-aware hierarchy** — Browsing (imagery, titles), cooking (enormous text, one thing at a time), editing (focused form). Let the context dictate the layout.

3. **Touch-first, not touch-only** — Touch targets 44px minimum, critical actions within thumb reach, no hover-dependent information. Desktop enhancements are additive.

4. **Intimacy over scale** — Personal cookbook, not a platform. Warmth > efficiency. Personal > generic.

5. **Silence is a feature** — No badges, no notifications, no engagement nudges. White space is calm, not empty.
