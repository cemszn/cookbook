/* ═══════════════════════════════════════════════════════════════
   auth.js — Email/Password Sign-In via Firebase Auth
   Handles auth state, toolbox pill UI, and data-auth elements.
═══════════════════════════════════════════════════════════════ */

const auth = firebase.auth();

// ── Sign in / Sign out ─────────────────────────────────────────
function signInWithEmail(email, password) {
  return auth.signInWithEmailAndPassword(email, password);
}

function signOutUser() {
  auth.signOut().then(() => {
    window.location.href = 'index.html';
  });
}

// ── Update toolbox auth pill ────────────────────────────────────
function _updateAuthPill(user) {
  const pill = document.getElementById('auth-pill');
  if (!pill) return;

  if (user) {
    pill.innerHTML = `${feather.icons['log-out'].toSvg({ width: 20, height: 20 })} <span class="auth-label">Sign Out</span>`;
    pill.title = `Signed in as ${user.email} — click to sign out`;
    pill.setAttribute('aria-label', `Signed in as ${user.email}. Click to sign out.`);
    pill.onclick = signOutUser;
  } else {
    pill.innerHTML = `${feather.icons['log-in'].toSvg({ width: 20, height: 20 })} <span class="auth-label">Sign In</span>`;
    pill.title = 'Sign in';
    pill.setAttribute('aria-label', 'Sign in');
    pill.onclick = () => { window.location.href = 'login.html'; };
  }
}

// ── Show/hide elements by auth state ───────────────────────────
function _updateAuthElements(user) {
  document.querySelectorAll('[data-auth="show"]').forEach(el => {
    el.style.display = user ? '' : 'none';
  });
  document.querySelectorAll('[data-auth="hide"]').forEach(el => {
    el.style.display = user ? 'none' : '';
  });
}

// ── Auth state listener ─────────────────────────────────────────
auth.onAuthStateChanged(user => {
  _updateAuthPill(user);
  _updateAuthElements(user);
  if (typeof onAuthStateUpdate === 'function') {
    onAuthStateUpdate(user);
  }
});
