// ─── Cases – Firebase Firestore ────────────────────────────────────────────────
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
let cases = [];
let currentFilter = 'all';
let searchQuery = '';
let currentUID = null;
let currentUser = null;

// DOM Elements
const userNameEl = document.getElementById('userName');
const totalCasesEl = document.getElementById('totalCases');
const pendingCasesEl = document.getElementById('pendingCases');
const closedCasesEl = document.getElementById('closedCases');
const activeCasesEl = document.getElementById('activeCases');
const casesTableBodyEl = document.getElementById('casesTableBody');
const caseModal = document.getElementById('caseModal');
const caseDetailsModal = document.getElementById('caseDetailsModal');

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
    await loadCases();
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

  if (caseModal) {
    caseModal.addEventListener('click', (e) => {
      if (e.target === caseModal) closeCaseModal();
    });
  }

  if (caseDetailsModal) {
    caseDetailsModal.addEventListener('click', (e) => {
      if (e.target === caseDetailsModal) closeCaseDetailsModal();
    });
  }
}

// ─── Load cases from Firestore ──────────────────────────────────────────────
async function loadCases() {
  try {
    const q = query(
      collection(db, 'cases'),
      where('createdBy', '==', currentUID),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    cases = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error('Error loading cases:', err);
    cases = [];
  }
  renderCases();
}

// Render cases table
function renderCases() {
  casesTableBodyEl.innerHTML = '';
  const filtered = filterAndSearchCases();

  if (filtered.length === 0) {
    casesTableBodyEl.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: var(--gray-600); padding: 40px;">
          No cases found
        </td>
      </tr>
    `;
    updateStatistics();
    return;
  }

  filtered.forEach(caseItem => {
    const updatedAt = caseItem.updatedAt?.toDate ? caseItem.updatedAt.toDate().toLocaleDateString() : new Date(caseItem.updatedAt).toLocaleDateString();
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${caseItem.caseId || '—'}</td>
      <td><span class="status-badge">${caseItem.caseType || '—'}</span></td>
      <td>${caseItem.officer || '—'}</td>
      <td><span class="status-badge status-${(caseItem.status || '').toLowerCase().replace(' ', '-')}">${caseItem.status || 'Pending'}</span></td>
      <td>${updatedAt}</td>
      <td>
        <button class="action-btn primary" onclick="viewCaseDetails('${caseItem.id}')">View</button>
        <button class="action-btn secondary" onclick="editCase('${caseItem.id}')">Edit</button>
        <button class="action-btn danger" onclick="deleteCase('${caseItem.id}')">Delete</button>
      </td>
    `;
    casesTableBodyEl.appendChild(row);
  });

  updateStatistics();
}

// Filter and search cases
function filterAndSearchCases() {
  let filtered = [...cases];

  if (currentFilter !== 'all') {
    filtered = filtered.filter(caseItem => {
      if (currentFilter === 'active') {
        return caseItem.status !== 'Closed';
      } else {
        return (caseItem.status || '').toLowerCase() === currentFilter;
      }
    });
  }

  if (searchQuery.trim() !== '') {
    const queryStr = searchQuery.toLowerCase();
    filtered = filtered.filter(caseItem =>
      (caseItem.caseId || '').toLowerCase().includes(queryStr) ||
      (caseItem.caseType || '').toLowerCase().includes(queryStr) ||
      (caseItem.description || '').toLowerCase().includes(queryStr) ||
      (caseItem.officer || '').toLowerCase().includes(queryStr)
    );
  }

  return filtered;
}

// External filter calls
window.filterCases = function (filter) {
  currentFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
  if (event) event.target.classList.add('active');
  renderCases();
};

window.searchCases = function () {
  searchQuery = document.getElementById('caseSearch').value;
  renderCases();
};

// Update statistics
function updateStatistics() {
  if (totalCasesEl) totalCasesEl.textContent = cases.length;
  if (pendingCasesEl) pendingCasesEl.textContent = cases.filter(c => c.status === 'Pending').length;
  if (closedCasesEl) closedCasesEl.textContent = cases.filter(c => c.status === 'Closed').length;
  if (activeCasesEl) activeCasesEl.textContent = cases.filter(c => c.status !== 'Closed').length;
}

// Open case modal
window.openCaseModal = function () {
  caseModal.style.display = 'flex';
  setTimeout(() => caseModal.classList.add('active'), 10);
};

// Close case modal
window.closeCaseModal = function () {
  caseModal.classList.remove('active');
  setTimeout(() => {
    caseModal.style.display = 'none';
    document.getElementById('caseForm').reset();
    const submitBtn = document.querySelector('.modal-footer .primary-btn');
    if (submitBtn) {
      submitBtn.onclick = submitCase;
      submitBtn.textContent = 'Create Case';
    }
  }, 300);
};

// Submit case (create)
window.submitCase = async function () {
  const data = getFormData();
  if (!validateForm(data)) return;

  const caseId = 'CASE/' + new Date().getFullYear() + '/' + String(cases.length + 1).padStart(3, '0');
  const payload = {
    ...data,
    caseId: caseId,
    createdBy: currentUID,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  try {
    const docRef = await addDoc(collection(db, 'cases'), payload);
    cases.unshift({ id: docRef.id, ...payload, createdAt: new Date(), updatedAt: new Date() });
    renderCases();
    closeCaseModal();
    showNotification('Case created successfully!', 'success');
  } catch (err) {
    console.error('Error creating case:', err);
    showNotification('Failed to create case.', 'error');
  }
};

function getFormData() {
  return {
    caseType: document.getElementById('caseType').value,
    description: document.getElementById('caseDescription').value.trim(),
    status: document.getElementById('caseStatus').value,
    officer: document.getElementById('caseOfficer').value.trim(),
    priority: document.getElementById('casePriority').value
  };
}

function validateForm(data) {
  if (!data.caseType || !data.description || !data.officer) {
    showNotification('Please fill in required fields', 'error');
    return false;
  }
  return true;
}

// View case details
window.viewCaseDetails = function (id) {
  const caseItem = cases.find(c => c.id === id);
  if (!caseItem) return;

  const content = document.getElementById('caseDetailsContent');
  const createdDate = caseItem.createdAt?.toDate ? caseItem.createdAt.toDate().toLocaleString() : new Date(caseItem.createdAt).toLocaleString();
  const updatedDate = caseItem.updatedAt?.toDate ? caseItem.updatedAt.toDate().toLocaleString() : new Date(caseItem.updatedAt).toLocaleString();

  content.innerHTML = `
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
      <div class="detail-item"><div class="detail-label">Case ID</div><div class="detail-value">${caseItem.caseId}</div></div>
      <div class="detail-item"><div class="detail-label">Status</div><div class="detail-value"><span class="status-badge status-${(caseItem.status || '').toLowerCase().replace(' ', '-')}">${caseItem.status}</span></div></div>
      <div class="detail-item"><div class="detail-label">Priority</div><div class="detail-value"><span class="priority-badge priority-${(caseItem.priority || '').toLowerCase()}">${caseItem.priority}</span></div></div>
      <div class="detail-item"><div class="detail-label">Created</div><div class="detail-value">${createdDate}</div></div>
      <div class="detail-item"> <div class="detail-label">Updated</div><div class="detail-value">${updatedDate}</div></div>
      <div class="detail-item"><div class="detail-label">Case Type</div><div class="detail-value">${caseItem.caseType}</div></div>
    </div>
    <div style="margin-top:20px;padding:16px;background:var(--gray-100);border-radius:12px;border:1px solid var(--gray-200);">
      <h4 style="margin:0 0 12px 0;color:var(--gray-800);">Case Details</h4>
      <div class="detail-label">Description</div>
      <div class="detail-value" style="white-space:pre-line;margin-bottom:12px;">${caseItem.description}</div>
      <div class="detail-label">Assigned Officer</div>
      <div class="detail-value">${caseItem.officer}</div>
    </div>
  `;

  caseDetailsModal.style.display = 'flex';
  setTimeout(() => caseDetailsModal.classList.add('active'), 10);
};

window.closeCaseDetailsModal = function () {
  caseDetailsModal.classList.remove('active');
  setTimeout(() => { caseDetailsModal.style.display = 'none'; }, 300);
};

// Edit case
window.editCase = function (id) {
  const caseItem = cases.find(c => c.id === id);
  if (!caseItem) return;

  document.getElementById('caseType').value = caseItem.caseType;
  document.getElementById('caseDescription').value = caseItem.description;
  document.getElementById('caseStatus').value = caseItem.status;
  document.getElementById('caseOfficer').value = caseItem.officer;
  document.getElementById('casePriority').value = caseItem.priority;

  const submitBtn = document.querySelector('.modal-footer .primary-btn');
  if (submitBtn) {
    submitBtn.onclick = () => updateCaseRecord(id);
    submitBtn.textContent = 'Update Case';
  }

  openCaseModal();
};

async function updateCaseRecord(id) {
  const data = getFormData();
  if (!validateForm(data)) return;

  try {
    const docRef = doc(db, 'cases', id);
    await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });

    const index = cases.findIndex(c => c.id === id);
    if (index > -1) {
      cases[index] = { ...cases[index], ...data, updatedAt: new Date() };
    }
    renderCases();
    closeCaseModal();
    showNotification('Case updated successfully!', 'success');
  } catch (err) {
    console.error('Error updating case:', err);
    showNotification('Failed to update case.', 'error');
  }
}

// Delete case
window.deleteCase = async function (id) {
  if (!confirm('Are you sure you want to delete this case?')) return;
  try {
    await deleteDoc(doc(db, 'cases', id));
    cases = cases.filter(c => c.id !== id);
    renderCases();
    showNotification('Case deleted successfully!', 'success');
  } catch (err) {
    console.error('Error deleting case:', err);
    showNotification('Failed to delete case.', 'error');
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