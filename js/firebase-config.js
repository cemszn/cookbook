// ─────────────────────────────────────────────────────────────
//  FIREBASE CONFIGURATION
//  Using the compat CDN SDK (loaded via <script> tags in HTML).
// ─────────────────────────────────────────────────────────────

const firebaseConfig = {
  apiKey:            "AIzaSyBxbNLZFAKBmjx8YctpsIMdc-RhU-qLIJY",
  authDomain:        "cookbook-413b9.firebaseapp.com",
  projectId:         "cookbook-413b9",
  storageBucket:     "cookbook-413b9.firebasestorage.app",
  messagingSenderId: "1089285452083",
  appId:             "1:1089285452083:web:e75f89b48b52fe92110e46"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
