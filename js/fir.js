// ─── FIRs – Firebase Firestore ────────────────────────────────────────────────
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
  getFirestore, collection, query, where,
  getDocs, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp, orderBy
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

// Global Variables
let firs = [];
let currentFilter = 'all';
let searchQuery = '';
let currentUID = null;
let currentUser = null;

// DOM Elements
const userNameEl = document.getElementById('userName');
const totalFIRsEl = document.getElementById('totalFIRs');
const pendingFIRsEl = document.getElementById('pendingFIRs');
const registeredFIRsEl = document.getElementById('registeredFIRs');
const urgentFIRsEl = document.getElementById('urgentFIRs');
const firTableBodyEl = document.getElementById('firTableBody');
const firModal = document.getElementById('firModal');
const firDetailsModal = document.getElementById('firDetailsModal');

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = 'index.html';
      return;
    }
    currentUID = user.uid;
    const stored = sessionStorage.getItem('constableCurrentUser') || localStorage.getItem('constableCurrentUser');
    currentUser = stored ? JSON.parse(stored) : { uid: user.uid, email: user.email };
    if (userNameEl) userNameEl.textContent = currentUser.fullName || currentUser.email;

    setupEventListeners();
    setActiveNav();
    await loadFIRs();
  });
});

// Set up event listeners
function setupEventListeners() {
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');

  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.toggle('active');
      overlay.classList.toggle('active');
    });
  }

  if (overlay) {
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('active');
      overlay.classList.remove('active');
    });
  }

  window.addEventListener('resize', () => {
    if (window.innerWidth > 1024) {
      sidebar.classList.remove('active');
      overlay.classList.remove('active');
    }
  });

  if (firModal) {
    firModal.addEventListener('click', (e) => {
      if (e.target === firModal) closeFIRModal();
    });
  }

  if (firDetailsModal) {
    firDetailsModal.addEventListener('click', (e) => {
      if (e.target === firDetailsModal) closeFIRDetailsModal();
    });
  }
}

// ─── Load FIRs from Firestore ────────────────────────────────────────────────
async function loadFIRs() {
  try {
    const q = query(
      collection(db, 'firs'),
      where('createdBy', '==', currentUID),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    firs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error('Error loading FIRs:', err);
    firs = [];
  }
  renderFIRs();
}

// Render FIRs table
function renderFIRs() {
  firTableBodyEl.innerHTML = '';
  const filtered = filterAndSearchFIRs();

  if (filtered.length === 0) {
    firTableBodyEl.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: var(--gray-600); padding: 40px;">
          No FIRs found
        </td>
      </tr>
    `;
    updateStatistics();
    return;
  }

  filtered.forEach(fir => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${fir.firNumber || '—'}</td>
      <td>${fir.complainantName || '—'}</td>
      <td><span class="status-badge">${fir.offenceType || '—'}</span></td>
      <td>${fir.dateOfIncident || '—'}</td>
      <td><span class="status-badge status-${(fir.status || '').toLowerCase()}">${fir.status || 'Registered'}</span></td>
      <td>
        <button class="action-btn primary" onclick="viewFIRDetails('${fir.id}')">View</button>
        <button class="action-btn secondary" onclick="editFIR('${fir.id}')">Edit</button>
        <button class="action-btn danger" onclick="deleteFIR('${fir.id}')">Delete</button>
      </td>
    `;
    firTableBodyEl.appendChild(row);
  });

  updateStatistics();
}

// Filter and search FIRs
function filterAndSearchFIRs() {
  let filtered = [...firs];

  if (currentFilter !== 'all') {
    filtered = filtered.filter(fir => {
      if (currentFilter === 'urgent') {
        return fir.priority === 'Urgent';
      } else {
        return (fir.status || '').toLowerCase() === currentFilter;
      }
    });
  }

  if (searchQuery.trim() !== '') {
    const queryStr = searchQuery.toLowerCase();
    filtered = filtered.filter(fir =>
      (fir.firNumber || '').toLowerCase().includes(queryStr) ||
      (fir.complainantName || '').toLowerCase().includes(queryStr) ||
      (fir.offenceType || '').toLowerCase().includes(queryStr) ||
      (fir.incidentDescription || '').toLowerCase().includes(queryStr) ||
      (fir.incidentLocation || '').toLowerCase().includes(queryStr)
    );
  }

  return filtered;
}

// External filter calls
window.filterFIRs = function (filter) {
  currentFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
  if (event) event.target.classList.add('active');
  renderFIRs();
};

window.searchFIRs = function () {
  searchQuery = document.getElementById('firSearch').value;
  renderFIRs();
};

// Update statistics
function updateStatistics() {
  if (totalFIRsEl) totalFIRsEl.textContent = firs.length;
  if (pendingFIRsEl) pendingFIRsEl.textContent = firs.filter(f => f.status === 'Pending').length;
  if (registeredFIRsEl) registeredFIRsEl.textContent = firs.filter(f => f.status === 'Registered').length;
  if (urgentFIRsEl) urgentFIRsEl.textContent = firs.filter(f => f.priority === 'Urgent').length;
}

// Open FIR modal
window.openFIRModal = function () {
  firModal.style.display = 'flex';
  setTimeout(() => firModal.classList.add('active'), 10);
};

// Close FIR modal
window.closeFIRModal = function () {
  firModal.classList.remove('active');
  setTimeout(() => {
    firModal.style.display = 'none';
    document.getElementById('firForm').reset();
    const submitBtn = document.querySelector('.modal-footer .primary-btn');
    if (submitBtn) {
      submitBtn.onclick = submitFIR;
      submitBtn.textContent = 'Register FIR';
    }
  }, 300);
};

// Submit FIR
window.submitFIR = async function () {
  const data = getFormData();
  if (!validateForm(data)) return;

  const firNumber = generateFIRNumber();
  const payload = {
    ...data,
    firNumber: firNumber,
    status: 'Registered',
    createdBy: currentUID,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  try {
    const docRef = await addDoc(collection(db, 'firs'), payload);
    firs.unshift({ id: docRef.id, ...payload, createdAt: new Date(), updatedAt: new Date() });
    renderFIRs();
    closeFIRModal();
    showNotification('FIR registered successfully!', 'success');
  } catch (err) {
    console.error('Error submitting FIR:', err);
    showNotification('Failed to register FIR.', 'error');
  }
};

function getFormData() {
  return {
    complainantName: document.getElementById('complainantName').value.trim(),
    complainantAge: parseInt(document.getElementById('complainantAge').value),
    complainantGender: document.getElementById('complainantGender').value,
    complainantOccupation: document.getElementById('complainantOccupation').value.trim(),
    complainantAddress: document.getElementById('complainantAddress').value.trim(),
    complainantPhone: document.getElementById('complainantPhone').value.trim(),
    complainantAadhaar: document.getElementById('complainantAadhaar').value.trim(),
    offenceType: document.getElementById('offenceType').value,
    dateOfIncident: document.getElementById('firDate').value,
    timeOfIncident: document.getElementById('firTime').value,
    incidentLocation: document.getElementById('incidentLocation').value.trim(),
    incidentDescription: document.getElementById('incidentDescription').value.trim(),
    accusedDetails: document.getElementById('accusedDetails').value.trim(),
    witnessDetails: document.getElementById('witnessDetails').value.trim(),
    propertyDetails: document.getElementById('propertyDetails').value.trim(),
    estimatedValue: parseInt(document.getElementById('estimatedValue').value) || 0,
    recoveryStatus: document.getElementById('recoveryStatus').value,
    priority: document.getElementById('firPriority').value
  };
}

function validateForm(data) {
  if (!data.complainantName || !data.complainantAge || !data.complainantGender ||
    !data.complainantOccupation || !data.complainantAddress || !data.complainantPhone ||
    !data.offenceType || !data.dateOfIncident || !data.timeOfIncident ||
    !data.incidentLocation || !data.incidentDescription) {
    showNotification('Please fill in all required fields', 'error');
    return false;
  }
  return true;
}

// Generate FIR number
function generateFIRNumber() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `FIR/${year}/${month}${day}${random}`;
}

// View FIR details
window.viewFIRDetails = function (firId) {
  const fir = firs.find(f => f.id === firId);
  if (!fir) return;

  const content = document.getElementById('firDetailsContent');
  const createdDate = fir.createdAt?.toDate ? fir.createdAt.toDate().toLocaleString() : new Date(fir.createdAt).toLocaleString();
  const updatedDate = fir.updatedAt?.toDate ? fir.updatedAt.toDate().toLocaleString() : new Date(fir.updatedAt).toLocaleString();

  content.innerHTML = `
    <div class="fir-details">
      <div class="detail-item"><div class="detail-label">FIR Number</div><div class="detail-value">${fir.firNumber}</div></div>
      <div class="detail-item"><div class="detail-label">Status</div><div class="detail-value"><span class="status-badge status-${(fir.status || '').toLowerCase()}">${fir.status}</span></div></div>
      <div class="detail-item"><div class="detail-label">Priority</div><div class="detail-value"><span class="priority-badge priority-${(fir.priority || '').toLowerCase()}">${fir.priority}</span></div></div>
      <div class="detail-item"><div class="detail-label">Created</div><div class="detail-value">${createdDate}</div></div>
      <div class="detail-item"><div class="detail-label">Offence Type</div><div class="detail-value">${fir.offenceType}</div></div>
    </div>
    <div style="margin-top:20px;padding:16px;background:var(--gray-100);border-radius:12px;border:1px solid var(--gray-200);">
      <h4 style="margin:0 0 12px 0;color:var(--gray-800);">Complainant Information</h4>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div><div class="detail-label">Name</div><div class="detail-value">${fir.complainantName}</div></div>
        <div><div class="detail-label">Age</div><div class="detail-value">${fir.complainantAge}</div></div>
        <div><div class="detail-label">Gender</div><div class="detail-value">${fir.complainantGender}</div></div>
        <div><div class="detail-label">Occupation</div><div class="detail-value">${fir.complainantOccupation}</div></div>
      </div>
      <div style="margin-top:12px;"><div class="detail-label">Address</div><div class="detail-value" style="white-space:pre-line;">${fir.complainantAddress}</div></div>
    </div>
    <div style="margin-top:20px;padding:16px;background:var(--gray-100);border-radius:12px;border:1px solid var(--gray-200);">
      <h4 style="margin:0 0 12px 0;color:var(--gray-800);">Incident Details</h4>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div><div class="detail-label">Date</div><div class="detail-value">${fir.dateOfIncident}</div></div>
        <div><div class="detail-label">Time</div><div class="detail-value">${fir.timeOfIncident}</div></div>
      </div>
      <div style="margin-top:12px;"><div class="detail-label">Location</div><div class="detail-value">${fir.incidentLocation}</div></div>
      <div style="margin-top:12px;"><div class="detail-label">Description</div><div class="detail-value" style="white-space:pre-line;">${fir.incidentDescription}</div></div>
    </div>
  `;

  firDetailsModal.style.display = 'flex';
  setTimeout(() => firDetailsModal.classList.add('active'), 10);
};

window.closeFIRDetailsModal = function () {
  firDetailsModal.classList.remove('active');
  setTimeout(() => { firDetailsModal.style.display = 'none'; }, 300);
};

// Edit FIR
window.editFIR = function (firId) {
  const fir = firs.find(f => f.id === firId);
  if (!fir) return;

  document.getElementById('complainantName').value = fir.complainantName;
  document.getElementById('complainantAge').value = fir.complainantAge;
  document.getElementById('complainantGender').value = fir.complainantGender;
  document.getElementById('complainantOccupation').value = fir.complainantOccupation;
  document.getElementById('complainantAddress').value = fir.complainantAddress;
  document.getElementById('complainantPhone').value = fir.complainantPhone;
  document.getElementById('complainantAadhaar').value = fir.complainantAadhaar;
  document.getElementById('offenceType').value = fir.offenceType;
  document.getElementById('firDate').value = fir.dateOfIncident;
  document.getElementById('firTime').value = fir.timeOfIncident;
  document.getElementById('incidentLocation').value = fir.incidentLocation;
  document.getElementById('incidentDescription').value = fir.incidentDescription;
  document.getElementById('accusedDetails').value = fir.accusedDetails;
  document.getElementById('witnessDetails').value = fir.witnessDetails;
  document.getElementById('propertyDetails').value = fir.propertyDetails;
  document.getElementById('estimatedValue').value = fir.estimatedValue;
  document.getElementById('recoveryStatus').value = fir.recoveryStatus;
  document.getElementById('firPriority').value = fir.priority;

  const submitBtn = document.querySelector('.modal-footer .primary-btn');
  if (submitBtn) {
    submitBtn.onclick = () => updateFIRRecord(firId);
    submitBtn.textContent = 'Update FIR';
  }

  openFIRModal();
};

async function updateFIRRecord(firId) {
  const data = getFormData();
  if (!validateForm(data)) return;

  try {
    const docRef = doc(db, 'firs', firId);
    await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });

    const index = firs.findIndex(f => f.id === firId);
    if (index > -1) {
      firs[index] = { ...firs[index], ...data, updatedAt: new Date() };
    }
    renderFIRs();
    closeFIRModal();
    showNotification('FIR updated successfully!', 'success');
  } catch (err) {
    console.error('Error updating FIR:', err);
    showNotification('Failed to update FIR.', 'error');
  }
}

// Delete FIR
window.deleteFIR = async function (firId) {
  if (!confirm('Are you sure you want to delete this FIR?')) return;
  try {
    await deleteDoc(doc(db, 'firs', firId));
    firs = firs.filter(f => f.id !== firId);
    renderFIRs();
    showNotification('FIR deleted successfully!', 'success');
  } catch (err) {
    console.error('Error deleting FIR:', err);
    showNotification('Failed to delete FIR.', 'error');
  }
};

// Nav
function setActiveNav() {
  const page = window.location.pathname.split('/').pop();
  const link = document.querySelector(`.nav-link[href="${page}"]`);
  if (link) link.classList.add('active');
}

// SOS / Logout
window.triggerSOS = function () {
  alert(`🚨 SOS ALERT\nOfficer: ${currentUser?.fullName}\nTime: ${new Date().toLocaleString()}`);
  if (confirm('Call emergency services?')) window.open('tel:112', '_self');
};

window.logout = async function () {
  if (!confirm('Logout?')) return;
  await signOut(auth);
  sessionStorage.clear();
  localStorage.removeItem('constableCurrentUser');
  window.location.href = 'index.html';
};

window.showNotifications = function () { alert('No new notifications.'); };

// Toast
function showNotification(message, type = 'info') {
  const n = document.createElement('div');
  const bg = type === 'success' ? '#38a169' : (type === 'error' ? '#e53e3e' : '#1a365d');
  Object.assign(n.style, {
    position: 'fixed', bottom: '20px', right: '20px',
    background: bg, color: 'white', padding: '15px 20px',
    borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    zIndex: '2000', opacity: '0', transform: 'translateY(20px)',
    transition: 'all 0.3s ease'
  });
  n.textContent = message;
  document.body.appendChild(n);
  setTimeout(() => { n.style.opacity = '1'; n.style.transform = 'translateY(0)'; }, 10);
  setTimeout(() => {
    n.style.opacity = '0';
    n.style.transform = 'translateY(20px)';
    setTimeout(() => n.remove(), 300);
  }, 3000);
}