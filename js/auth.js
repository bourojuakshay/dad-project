// ─── Firebase Auth ────────────────────────────────────────────────────────────
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyByqlrBrUqv5twev84RtpNLNh0EakUTi8c",
  authDomain: "police-port.firebaseapp.com",
  projectId: "police-port",
  storageBucket: "police-port.firebasestorage.app",
  messagingSenderId: "602535462028",
  appId: "1:602535462028:web:8446bbee4c1e0b988ba7a9",
  measurementId: "G-QXLKY8KMKL"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ─── Tab switching ────────────────────────────────────────────────────────────
function switchTab(tabName) {
  const loginTab = document.getElementById('loginTab');
  const signupTab = document.getElementById('signupTab');
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  clearErrors();

  if (tabName === 'login') {
    loginTab.classList.add('active');
    signupTab.classList.remove('active');
    loginForm.classList.add('active');
    signupForm.classList.remove('active');
  } else {
    loginTab.classList.remove('active');
    signupTab.classList.add('active');
    loginForm.classList.remove('active');
    signupForm.classList.add('active');
  }
}
window.switchTab = switchTab;

// ─── Toggle Password ──────────────────────────────────────────────────────────
function togglePassword(inputId) {
  const input = document.getElementById(inputId);
  const button = input.nextElementSibling;
  if (input.type === 'password') {
    input.type = 'text';
    button.textContent = '🙈';
  } else {
    input.type = 'password';
    button.textContent = '👁️';
  }
}
window.togglePassword = togglePassword;

// ─── Error helpers ────────────────────────────────────────────────────────────
function clearErrors() {
  const le = document.getElementById('loginError');
  const se = document.getElementById('signupError');
  if (le) le.textContent = '';
  if (se) se.textContent = '';
}

function showError(elementId, message) {
  const el = document.getElementById(elementId);
  if (el) { el.textContent = message; el.style.color = '#e53e3e'; }
}

function showSuccess(elementId, message) {
  const el = document.getElementById(elementId);
  if (el) { el.textContent = message; el.style.color = '#38a169'; }
}

// ─── Login ────────────────────────────────────────────────────────────────────
async function handleLogin(e) {
  e.preventDefault();
  clearErrors();

  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const rememberMe = document.getElementById('rememberMe').checked;

  if (!email || !password) {
    showError('loginError', 'Please fill in all fields');
    return;
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    // Fetch user profile from Firestore
    const userSnap = await getDoc(doc(db, 'users', uid));
    const userData = userSnap.exists() ? userSnap.data() : { uid, email, fullName: email.split('@')[0] };

    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem('constableCurrentUser', JSON.stringify(userData));
    storage.setItem('firebaseUID', uid);

    // Ensure profile photo fallback exists
    if (!localStorage.getItem('constableProfilePhoto')) {
      localStorage.setItem('constableProfilePhoto',
        'https://ui-avatars.com/api/?name=' + encodeURIComponent(userData.fullName || 'Constable') + '&background=1a365d&color=fff&size=200');
    }

    window.location.href = 'security.html';
  } catch (error) {
    console.error('Login error:', error);
    switch (error.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        showError('loginError', 'Invalid email or password');
        break;
      case 'auth/too-many-requests':
        showError('loginError', 'Too many attempts. Please try again later.');
        break;
      default:
        showError('loginError', 'Login failed. Please try again.');
    }
  }
}
window.handleLogin = handleLogin;

// ─── Signup ───────────────────────────────────────────────────────────────────
async function handleSignup(e) {
  e.preventDefault();
  clearErrors();

  const fullName = document.getElementById('fullName').value.trim();
  const badgeId = document.getElementById('badgeId').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const phoneNumber = document.getElementById('phoneNumber').value.trim();
  const password = document.getElementById('signupPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const agreeTerms = document.getElementById('agreeTerms').checked;

  // Validation
  if (!fullName || !badgeId || !email || !phoneNumber || !password || !confirmPassword) {
    showError('signupError', 'Please fill in all fields');
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showError('signupError', 'Please enter a valid email address');
    return;
  }
  if (!/^[6-9]\d{9}$/.test(phoneNumber)) {
    showError('signupError', 'Please enter a valid 10-digit phone number');
    return;
  }
  if (password.length < 6) {
    showError('signupError', 'Password must be at least 6 characters');
    return;
  }
  if (password !== confirmPassword) {
    showError('signupError', 'Passwords do not match');
    return;
  }
  if (!agreeTerms) {
    showError('signupError', 'You must agree to the Terms & Conditions');
    return;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    // Save user profile to Firestore
    const userData = {
      uid,
      email,
      fullName,
      badgeId,
      phoneNumber,
      role: 'constable',
      rank: 'Constable',
      station: 'Not set',
      district: 'Not set',
      department: 'General',
      status: 'Active',
      joinDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    };

    await setDoc(doc(db, 'users', uid), userData);

    sessionStorage.setItem('constableCurrentUser', JSON.stringify(userData));
    sessionStorage.setItem('firebaseUID', uid);

    const avatarUrl = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(fullName) + '&background=1a365d&color=fff&size=200';
    localStorage.setItem('constableProfilePhoto', avatarUrl);

    showSuccess('signupError', 'Account created! Redirecting...');
    setTimeout(() => { window.location.href = 'security.html'; }, 1500);
  } catch (error) {
    console.error('Signup error:', error);
    switch (error.code) {
      case 'auth/email-already-in-use':
        showError('signupError', 'Email already registered. Please login instead.');
        break;
      case 'auth/weak-password':
        showError('signupError', 'Password is too weak. Use at least 6 characters.');
        break;
      default:
        showError('signupError', 'Registration failed. Please try again.');
    }
  }
}
window.handleSignup = handleSignup;

// ─── Auth state check ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      // Already logged in — redirect to dashboard
      window.location.href = 'dashboard.html';
    }
  });
});
