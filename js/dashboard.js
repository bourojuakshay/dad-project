// ─── Dashboard – Firebase Firestore ──────────────────────────────────────────
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
  getFirestore, collection, query, where,
  getDocs, addDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

let currentUser = null;
let currentUID = null;

// ─── DOM ──────────────────────────────────────────────────────────────────────
const userNameEl = document.getElementById('userName');
const greetingEl = document.getElementById('greetingName');
const currentDateEl = document.getElementById('currentDate');
const currentTimeEl = document.getElementById('currentTime');
const currentLocEl = document.getElementById('currentLocation');
const statFIR = document.getElementById('statFIR');
const statCases = document.getElementById('statCases');
const statLocations = document.getElementById('statLocations');
const statPhotos = document.getElementById('statPhotos');
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
const overlayEl = document.getElementById('overlay');

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = 'index.html';
      return;
    }
    currentUID = user.uid;
    // Load from session/local storage for instant render
    const stored = sessionStorage.getItem('constableCurrentUser') || localStorage.getItem('constableCurrentUser');
    currentUser = stored ? JSON.parse(stored) : { uid: user.uid, email: user.email, fullName: user.email.split('@')[0] };

    loadUserData();
    updateStats();
    updateTime();
    setInterval(updateTime, 1000);
    getCurrentLocation();
    setActiveNav();
    setupEventListeners();
  });
});

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function setupEventListeners() {
  if (sidebarToggle) sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('active');
    overlayEl.classList.toggle('active');
  });
  if (overlayEl) overlayEl.addEventListener('click', () => {
    sidebar.classList.remove('active');
    overlayEl.classList.remove('active');
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth > 1024) {
      sidebar.classList.remove('active');
      overlayEl.classList.remove('active');
    }
  });
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 1024) {
        sidebar.classList.remove('active');
        overlayEl.classList.remove('active');
      }
    });
  });
}

// ─── User display ─────────────────────────────────────────────────────────────
function loadUserData() {
  if (!currentUser) return;
  const name = currentUser.fullName || currentUser.email || 'Constable';
  if (userNameEl) userNameEl.textContent = name;
  if (greetingEl) greetingEl.textContent = name.split(' ')[0];
}

// ─── Stats from Firestore ─────────────────────────────────────────────────────
async function updateStats() {
  if (!currentUID) return;
  try {
    const firsQ = query(collection(db, 'firs'), where('createdBy', '==', currentUID));
    const casesQ = query(collection(db, 'cases'), where('createdBy', '==', currentUID));
    const compQ = query(collection(db, 'complaints'), where('createdBy', '==', currentUID));

    const [firsSnap, casesSnap, compSnap] = await Promise.all([
      getDocs(firsQ), getDocs(casesQ), getDocs(compQ)
    ]);

    if (statFIR) statFIR.textContent = firsSnap.size;
    if (statCases) statCases.textContent = casesSnap.size;
    if (statPhotos) statPhotos.textContent = compSnap.size;
    if (statLocations) statLocations.textContent = '—';
  } catch (err) {
    console.error('Stats error:', err);
  }
}

// ─── Time & Date ──────────────────────────────────────────────────────────────
function updateTime() {
  const now = new Date();
  if (currentDateEl) currentDateEl.textContent = now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  if (currentTimeEl) currentTimeEl.textContent = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
}

// ─── Location ─────────────────────────────────────────────────────────────────
function getCurrentLocation() {
  if (!navigator.geolocation) {
    if (currentLocEl) currentLocEl.textContent = 'Geolocation not supported';
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const lat = pos.coords.latitude.toFixed(6);
      const lon = pos.coords.longitude.toFixed(6);
      if (currentLocEl) currentLocEl.textContent = `Lat: ${lat}, Lon: ${lon}`;
    },
    () => { if (currentLocEl) currentLocEl.textContent = 'Location unavailable'; },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

// ─── Navigation ───────────────────────────────────────────────────────────────
function setActiveNav() {
  const page = window.location.pathname.split('/').pop();
  const link = document.querySelector(`.nav-link[href="${page}"]`);
  if (link) link.classList.add('active');
}

// ─── SOS ─────────────────────────────────────────────────────────────────────
window.triggerSOS = function () {
  const msg = `🚨 SOS ALERT 🚨\n\nOfficer: ${currentUser?.fullName}\nBadge: ${currentUser?.badgeId}\nTime: ${new Date().toLocaleString()}`;
  alert(msg);
  if (confirm('Call emergency services (112)?')) window.open('tel:112', '_self');
};

// ─── Logout ───────────────────────────────────────────────────────────────────
window.logout = async function () {
  if (!confirm('Are you sure you want to logout?')) return;
  await signOut(auth);
  sessionStorage.clear();
  localStorage.removeItem('constableCurrentUser');
  localStorage.removeItem('firebaseUID');
  window.location.href = 'index.html';
};

window.showNotifications = function () { alert('No new notifications.'); };