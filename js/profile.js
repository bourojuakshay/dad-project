// ─── Profile – Firebase Firestore ─────────────────────────────────────────────
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
  getFirestore, doc, getDoc, updateDoc,
  collection, query, where, getDocs
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

// DOM Elements
const userNameEl = document.getElementById('userName');
const fullNameEl = document.getElementById('fullName');
const rankEl = document.getElementById('rank');
const badgeIdEl = document.getElementById('badgeId');
const stationEl = document.getElementById('station');
const districtEl = document.getElementById('district');
const departmentEl = document.getElementById('department');
const joinDateEl = document.getElementById('joinDate');
const statusEl = document.getElementById('status');
const phoneNumberEl = document.getElementById('phoneNumber');
const emailEl = document.getElementById('email');
const serviceDurationEl = document.getElementById('serviceDuration');
const totalDutiesEl = document.getElementById('totalDuties');
const activeCasesEl = document.getElementById('activeCases');
const solvedCasesEl = document.getElementById('solvedCases');
const profilePhotoEl = document.getElementById('profilePhoto');
const editSection = document.getElementById('editSection');
const editBtnText = document.getElementById('editBtnText');

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = 'index.html';
      return;
    }
    currentUID = user.uid;
    await loadProfileData();
    setupEventListeners();
    setActiveNav();
  });
});

async function loadProfileData() {
  try {
    const userSnap = await getDoc(doc(db, 'users', currentUID));
    if (userSnap.exists()) {
      currentUser = userSnap.data();
      renderProfile();
      updateStats();
    }
  } catch (err) {
    console.error('Error loading profile:', err);
  }
}

function renderProfile() {
  if (!currentUser) return;
  const u = currentUser;
  if (userNameEl) userNameEl.textContent = u.fullName;
  if (fullNameEl) fullNameEl.textContent = u.fullName;
  if (rankEl) rankEl.textContent = u.rank || 'Constable';
  if (badgeIdEl) badgeIdEl.textContent = u.badgeId || '—';
  if (stationEl) stationEl.textContent = u.station || '—';
  if (districtEl) districtEl.textContent = u.district || '—';
  if (departmentEl) departmentEl.textContent = u.department || '—';
  if (joinDateEl) joinDateEl.textContent = u.joinDate || '—';
  if (statusEl) {
    statusEl.textContent = u.status || 'Active';
    statusEl.className = 'meta-value status-' + (u.status || 'active').toLowerCase().replace(' ', '-');
  }
  if (phoneNumberEl) phoneNumberEl.textContent = u.phoneNumber || '—';
  if (emailEl) emailEl.textContent = u.email;

  const joinDateObj = new Date(u.joinDate || u.createdAt || Date.now());
  const diff = new Date() - joinDateObj;
  const y = Math.floor(diff / 31536000000), m = Math.floor((diff % 31536000000) / 2592000000);
  if (serviceDurationEl) serviceDurationEl.textContent = `${y} years ${m} months`;

  const savedPhoto = localStorage.getItem('constableProfilePhoto');
  if (savedPhoto && profilePhotoEl) profilePhotoEl.src = savedPhoto;
}

async function updateStats() {
  try {
    const q = query(collection(db, 'cases'), where('createdBy', '==', currentUID));
    const snap = await getDocs(q);
    const cases = snap.docs.map(d => d.data());
    if (activeCasesEl) activeCasesEl.textContent = cases.filter(c => c.status !== 'Closed').length;
    if (solvedCasesEl) solvedCasesEl.textContent = cases.filter(c => c.status === 'Closed').length;
    if (totalDutiesEl) {
      const days = Math.floor((new Date() - new Date(currentUser.joinDate)) / 86400000);
      totalDutiesEl.textContent = Math.max(0, Math.floor(days * 0.8));
    }
  } catch (err) { console.error('Stats error:', err); }
}

// ─── Edit Profile ──────────────────────────────────────────────────────────────
window.toggleEditMode = function () {
  if (editSection.style.display === 'block') {
    editSection.style.display = 'none';
    editBtnText.textContent = 'Edit Profile';
  } else {
    enterEditMode();
  }
};

function enterEditMode() {
  const u = currentUser;
  document.getElementById('editFullName').value = u.fullName;
  document.getElementById('editBadgeId').value = u.badgeId || '';
  document.getElementById('editRank').value = u.rank || 'Constable';
  document.getElementById('editStation').value = u.station || '';
  document.getElementById('editDistrict').value = u.district || '';
  document.getElementById('editDepartment').value = u.department || '';
  document.getElementById('editPhoneNumber').value = u.phoneNumber || '';
  document.getElementById('editEmail').value = u.email;
  document.getElementById('editStatus').value = u.status || 'Active';

  editSection.style.display = 'block';
  editBtnText.textContent = 'Cancel Edit';
}

window.saveProfileChanges = async function (e) {
  e.preventDefault();
  const payload = {
    fullName: document.getElementById('editFullName').value.trim(),
    badgeId: document.getElementById('editBadgeId').value.trim(),
    rank: document.getElementById('editRank').value,
    station: document.getElementById('editStation').value.trim(),
    district: document.getElementById('editDistrict').value.trim(),
    department: document.getElementById('editDepartment').value.trim(),
    phoneNumber: document.getElementById('editPhoneNumber').value.trim(),
    status: document.getElementById('editStatus').value
  };

  try {
    await updateDoc(doc(db, 'users', currentUID), payload);
    currentUser = { ...currentUser, ...payload };
    renderProfile();
    editSection.style.display = 'none';
    editBtnText.textContent = 'Edit Profile';
    showNotification('Profile updated successfully!', 'success');
  } catch (err) {
    console.error('Update profile error:', err);
    showNotification('Failed to update profile.', 'error');
  }
};

// ─── Profile Photo ───────────────────────────────────────────────────────────
window.updateProfilePhoto = function (event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    profilePhotoEl.src = e.target.result;
    localStorage.setItem('constableProfilePhoto', e.target.result);
    showNotification('Photo updated!', 'success');
  };
  reader.readAsDataURL(file);
};

window.resetPhoto = function () {
  const def = 'https://via.placeholder.com/200x200/1a365d/ffffff?text=Constable';
  profilePhotoEl.src = def;
  localStorage.removeItem('constableProfilePhoto');
  showNotification('Photo reset', 'info');
};

// ─── Utils / Nav / SOS / Logout ──────────────────────────────────────────────
function setupEventListeners() {
  const sbTog = document.getElementById('sidebarToggle'), sb = document.getElementById('sidebar'), ov = document.getElementById('overlay');
  if (sbTog) sbTog.addEventListener('click', () => { sb.classList.toggle('active'); ov.classList.toggle('active'); });
  if (ov) ov.addEventListener('click', () => { sb.classList.remove('active'); ov.classList.remove('active'); });
}

function setActiveNav() {
  const p = window.location.pathname.split('/').pop();
  const l = document.querySelector(`.nav-link[href="${p}"]`);
  if (l) l.classList.add('active');
}

window.triggerSOS = function () { alert(`🚨 SOS ALERT\nOfficer: ${currentUser?.fullName}`); if (confirm('Call 112?')) window.open('tel:112', '_self'); };
window.logout = async function () { if (!confirm('Logout?')) return; await signOut(auth); sessionStorage.clear(); localStorage.removeItem('constableCurrentUser'); window.location.href = 'index.html'; };
window.showNotifications = function () { alert('No new notifications.'); };

function showNotification(message, type = 'info') {
  const n = document.createElement('div');
  const bg = type === 'success' ? '#38a169' : '#1a365d';
  Object.assign(n.style, { position: 'fixed', bottom: '20px', right: '20px', background: bg, color: 'white', padding: '15px 20px', borderRadius: '8px', zIndex: '2000', opacity: '0', transition: 'all 0.3s ease' });
  n.textContent = message;
  document.body.appendChild(n);
  setTimeout(() => n.style.opacity = '1', 10);
  setTimeout(() => { n.style.opacity = '0'; setTimeout(() => n.remove(), 300); }, 3000);
}