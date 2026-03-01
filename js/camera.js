// ─── Camera – Firebase Logic ───────────────────────────────────────────────
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

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

// Global Variables
let cameraStream = null, photos = [], selectedPhotos = new Set();
let currentUID = null, currentUser = null;

// DOM
const userNameEl = document.getElementById('userName');
const cameraPreview = document.getElementById('cameraPreview');
const cameraCanvas = document.getElementById('cameraCanvas');
const cameraOverlay = document.getElementById('cameraOverlay');
const photoCountEl = document.getElementById('photoCount');
const photosGrid = document.getElementById('photosGrid');

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  onAuthStateChanged(auth, async (user) => {
    if (!user) { window.location.href = 'index.html'; return; }
    currentUID = user.uid;
    const stored = sessionStorage.getItem('constableCurrentUser') || localStorage.getItem('constableCurrentUser');
    currentUser = stored ? JSON.parse(stored) : { uid: user.uid, email: user.email };
    if (userNameEl) userNameEl.textContent = currentUser.fullName || currentUser.email;

    setupEventListeners();
    loadPhotos();
    setActiveNav();
  });
});

function setupEventListeners() {
  const sbTog = document.getElementById('sidebarToggle'), sb = document.getElementById('sidebar'), ov = document.getElementById('overlay');
  if (sbTog) sbTog.addEventListener('click', () => { sb.classList.toggle('active'); ov.classList.toggle('active'); });
  if (ov) ov.addEventListener('click', () => { sb.classList.remove('active'); ov.classList.remove('active'); });
}

// ─── Camera Logic ────────────────────────────────────────────────────────────
window.startCamera = async function () {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    cameraStream = stream;
    cameraPreview.srcObject = stream;
    document.getElementById('startCameraBtn').disabled = true;
    document.getElementById('stopCameraBtn').disabled = false;
    document.getElementById('captureBtn').disabled = false;
    showNotification('Camera active', 'success');
  } catch (err) {
    showNotification('Camera error: ' + err.message, 'error');
  }
};

window.stopCamera = function () {
  if (cameraStream) { cameraStream.getTracks().forEach(t => t.stop()); cameraStream = null; cameraPreview.srcObject = null; }
  document.getElementById('startCameraBtn').disabled = false;
  document.getElementById('stopCameraBtn').disabled = true;
  document.getElementById('captureBtn').disabled = true;
};

window.capturePhoto = function () {
  if (!cameraStream) return;
  cameraCanvas.width = cameraPreview.videoWidth;
  cameraCanvas.height = cameraPreview.videoHeight;
  cameraCanvas.getContext('2d').drawImage(cameraPreview, 0, 0);
  const data = cameraCanvas.toDataURL('image/jpeg', 0.8);
  const photo = { id: Date.now().toString(), dataURL: data, timestamp: new Date().toISOString() };
  photos.unshift(photo);
  savePhotos();
  renderPhotos();
  cameraOverlay.style.opacity = '1';
  setTimeout(() => cameraOverlay.style.opacity = '0', 100);
  showNotification('Captured', 'success');
};

function loadPhotos() {
  const saved = localStorage.getItem('constablePhotos');
  if (saved) photos = JSON.parse(saved);
  renderPhotos();
}

function savePhotos() {
  localStorage.setItem('constablePhotos', JSON.stringify(photos));
  if (photoCountEl) photoCountEl.textContent = photos.length;
}

function renderPhotos() {
  if (!photosGrid) return;
  photosGrid.innerHTML = '';
  photos.forEach(p => {
    const d = document.createElement('div');
    d.className = 'photo-card';
    d.innerHTML = `<img src="${p.dataURL}" class="photo-thumbnail">
      <div class="photo-meta">
        <div class="photo-date">${new Date(p.timestamp).toLocaleString()}</div>
        <button class="photo-action-btn danger" onclick="event.stopPropagation(); window.deletePhoto('${p.id}')">Delete</button>
      </div>`;
    photosGrid.appendChild(d);
  });
  if (photoCountEl) photoCountEl.textContent = photos.length;
}

window.deletePhoto = function (id) {
  if (!confirm('Delete photo?')) return;
  photos = photos.filter(p => p.id !== id);
  savePhotos();
  renderPhotos();
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