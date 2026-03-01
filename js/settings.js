// ─── Settings – Firebase Logic ──────────────────────────────────────────────
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, updatePassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyByqlrBrUqv5twev84RtpNLNh0EakUTi8c",
  authDomain: "police-port.firebaseapp.com",
  projectId: "police-port",
  storageBucket: "police-port.firebasestorage.app",
  messagingSenderId: "602535462028",
  appId: "1:602535462028:web:8446bbee4c1e0b988ba7a9"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUID = null, currentUser = null;

// DOM
const userNameEl = document.getElementById('userName');
const darkModeToggle = document.getElementById('darkModeToggle');
const autoLogoutSelect = document.getElementById('autoLogoutSelect');

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  onAuthStateChanged(auth, async (user) => {
    if (!user) { window.location.href = 'index.html'; return; }
    currentUID = user.uid;
    const stored = sessionStorage.getItem('constableCurrentUser') || localStorage.getItem('constableCurrentUser');
    currentUser = stored ? JSON.parse(stored) : { uid: user.uid, email: user.email };
    if (userNameEl) userNameEl.textContent = currentUser.fullName || currentUser.email;

    setupEventListeners();
    loadSettings();
    setActiveNav();
  });
});

function setupEventListeners() {
  const sbTog = document.getElementById('sidebarToggle'), sb = document.getElementById('sidebar'), ov = document.getElementById('overlay');
  if (sbTog) sbTog.addEventListener('click', () => { sb.classList.toggle('active'); ov.classList.toggle('active'); });
  if (ov) ov.addEventListener('click', () => { sb.classList.remove('active'); ov.classList.remove('active'); });
}

function loadSettings() {
  const dark = localStorage.getItem('constableDarkMode') === 'true';
  if (darkModeToggle) darkModeToggle.checked = dark;
  if (dark) document.body.classList.add('dark');

  const al = localStorage.getItem('constableAutoLogout') || '15';
  if (autoLogoutSelect) autoLogoutSelect.value = al;
}

window.toggleDarkMode = function () {
  const enabled = darkModeToggle.checked;
  localStorage.setItem('constableDarkMode', enabled);
  document.body.classList.toggle('dark', enabled);
};

window.setAutoLogout = function () {
  localStorage.setItem('constableAutoLogout', autoLogoutSelect.value);
  showNotification('Auto-logout preference saved', 'success');
};

window.changePassword = async function (e) {
  e.preventDefault();
  const newPass = document.getElementById('newPassword').value;
  const confPass = document.getElementById('confirmNewPassword').value;
  if (newPass !== confPass) { showNotification('Passwords do not match', 'error'); return; }
  try {
    await updatePassword(auth.currentUser, newPass);
    showNotification('Password updated!', 'success');
    document.getElementById('passwordForm').style.display = 'none';
  } catch (err) {
    showNotification('Error: ' + err.message, 'error');
  }
};

window.backupData = async function () {
  showNotification('Generating backup...', 'info');
  const q = query(collection(db, 'firs'), where('createdBy', '==', currentUID));
  const snap = await getDocs(q);
  const data = snap.docs.map(d => d.data());
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'constable_backup.json'; a.click();
  showNotification('Backup exported', 'success');
};

// ─── Nav / SOS / Logout ──────────────────────────────────────────────────────
function setActiveNav() {
  const p = window.location.pathname.split('/').pop();
  const l = document.querySelector(`.nav-link[href="${p}"]`);
  if (l) l.classList.add('active');
}

window.triggerSOS = function () { alert(`🚨 SOS ALERT\nOfficer: ${currentUser?.fullName}`); if (confirm('Call 112?')) window.open('tel:112', '_self'); };
window.logout = async function () { if (!confirm('Logout?')) return; await signOut(auth); sessionStorage.clear(); localStorage.removeItem('constableCurrentUser'); window.location.href = 'index.html'; };

function showNotification(message, type = 'info') {
  const n = document.createElement('div');
  const bg = type === 'success' ? '#38a169' : '#1a365d';
  Object.assign(n.style, { position: 'fixed', bottom: '20px', right: '20px', background: bg, color: 'white', padding: '15px 20px', borderRadius: '8px', zIndex: '2000', opacity: '0', transition: 'all 0.3s ease' });
  n.textContent = message;
  document.body.appendChild(n);
  setTimeout(() => n.style.opacity = '1', 10);
  setTimeout(() => { n.style.opacity = '0'; setTimeout(() => n.remove(), 300); }, 3000);
}