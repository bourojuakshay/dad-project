// ─── Complaints – Firebase Firestore ─────────────────────────────────────────
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

let complaints = [];
let currentFilter = 'all';
let searchQuery = '';
let currentUID = null;
let currentUser = null;

// ─── DOM ──────────────────────────────────────────────────────────────────────
const userNameEl = document.getElementById('userName');
const totalComplaintsEl = document.getElementById('totalComplaints');
const pendingComplaintsEl = document.getElementById('pendingComplaints');
const resolvedComplaintsEl = document.getElementById('resolvedComplaints');
const urgentComplaintsEl = document.getElementById('urgentComplaints');
const complaintsTableBodyEl = document.getElementById('complaintsTableBody');
const complaintModal = document.getElementById('complaintModal');
const complaintDetailsModal = document.getElementById('complaintDetailsModal');

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  onAuthStateChanged(auth, async (user) => {
    if (!user) { window.location.href = 'index.html'; return; }
    currentUID = user.uid;
    const stored = sessionStorage.getItem('constableCurrentUser') || localStorage.getItem('constableCurrentUser');
    currentUser = stored ? JSON.parse(stored) : { uid: user.uid, email: user.email };
    if (userNameEl) userNameEl.textContent = currentUser.fullName || currentUser.email;

    setupSidebar();
    setupModalEvents();
    setActiveNav();
    await loadComplaints();
  });
});

function setupSidebar() {
  const sb = document.getElementById('sidebar');
  const tog = document.getElementById('sidebarToggle');
  const ov = document.getElementById('overlay');
  if (tog) tog.addEventListener('click', () => { sb.classList.toggle('active'); ov.classList.toggle('active'); });
  if (ov) ov.addEventListener('click', () => { sb.classList.remove('active'); ov.classList.remove('active'); });
}

function setupModalEvents() {
  if (complaintModal) complaintModal.addEventListener('click', (e) => { if (e.target === complaintModal) closeComplaintModal(); });
  if (complaintDetailsModal) complaintDetailsModal.addEventListener('click', (e) => { if (e.target === complaintDetailsModal) closeComplaintDetailsModal(); });
}

// ─── Load Complaints from Firestore ──────────────────────────────────────────
async function loadComplaints() {
  try {
    const q = query(
      collection(db, 'complaints'),
      where('createdBy', '==', currentUID),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    complaints = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error('Load complaints error:', err);
    complaints = [];
  }
  renderComplaints();
}

// ─── Render ───────────────────────────────────────────────────────────────────
function renderComplaints() {
  complaintsTableBodyEl.innerHTML = '';
  const filtered = filterAndSearch();

  if (filtered.length === 0) {
    complaintsTableBodyEl.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;color:#718096">No complaints found</td></tr>`;
    updateStats();
    return;
  }

  filtered.forEach(c => {
    const createdAt = c.createdAt?.toDate ? c.createdAt.toDate().toLocaleDateString('en-IN') : (c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN') : '—');
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${c.id.slice(0, 8).toUpperCase()}</td>
      <td>${c.complainantName || '—'}</td>
      <td><span class="status-badge">${c.category || '—'}</span></td>
      <td>${createdAt}</td>
      <td><span class="status-badge status-${(c.status || '').toLowerCase()}">${c.status || '—'}</span></td>
      <td><span class="priority-badge priority-${(c.priority || '').toLowerCase()}">${c.priority || '—'}</span></td>
      <td>
        <button class="action-btn primary" onclick="viewComplaintDetails('${c.id}')">View</button>
        <button class="action-btn danger" onclick="deleteComplaint('${c.id}')">Delete</button>
      </td>`;
    complaintsTableBodyEl.appendChild(row);
  });
  updateStats();
}

function filterAndSearch() {
  let list = [...complaints];
  if (currentFilter !== 'all') {
    list = list.filter(c => currentFilter === 'urgent' ? c.priority === 'Urgent' : (c.status || '').toLowerCase() === currentFilter);
  }
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    list = list.filter(c =>
      (c.complainantName || '').toLowerCase().includes(q) ||
      (c.category || '').toLowerCase().includes(q) ||
      (c.description || '').toLowerCase().includes(q)
    );
  }
  return list;
}

function updateStats() {
  if (totalComplaintsEl) totalComplaintsEl.textContent = complaints.length;
  if (pendingComplaintsEl) pendingComplaintsEl.textContent = complaints.filter(c => c.status === 'Pending').length;
  if (resolvedComplaintsEl) resolvedComplaintsEl.textContent = complaints.filter(c => c.status === 'Resolved').length;
  if (urgentComplaintsEl) urgentComplaintsEl.textContent = complaints.filter(c => c.priority === 'Urgent').length;
}

// ─── Modal ────────────────────────────────────────────────────────────────────
window.openComplaintModal = function () {
  complaintModal.style.display = 'flex';
  setTimeout(() => complaintModal.classList.add('active'), 10);
};

window.closeComplaintModal = function () {
  complaintModal.classList.remove('active');
  setTimeout(() => { complaintModal.style.display = 'none'; document.getElementById('complaintForm').reset(); }, 300);
};

window.closeComplaintDetailsModal = function () {
  complaintDetailsModal.classList.remove('active');
  setTimeout(() => { complaintDetailsModal.style.display = 'none'; }, 300);
};

// ─── Submit Complaint to Firestore ────────────────────────────────────────────
window.submitComplaint = async function () {
  const data = {
    complainantName: document.getElementById('complainantName').value.trim(),
    complainantPhone: document.getElementById('complainantPhone').value.trim(),
    complainantAddress: document.getElementById('complainantAddress').value.trim(),
    category: document.getElementById('complaintCategory').value,
    description: document.getElementById('complaintDescription').value.trim(),
    priority: document.getElementById('complaintPriority').value,
    location: document.getElementById('complaintLocation').value.trim(),
    status: 'Pending',
    createdBy: currentUID,
    createdAt: serverTimestamp()
  };

  if (!data.complainantName || !data.category || !data.description) {
    showNotification('Please fill in all required fields', 'error'); return;
  }

  try {
    const ref = await addDoc(collection(db, 'complaints'), data);
    complaints.unshift({ id: ref.id, ...data, createdAt: new Date() });
    renderComplaints();
    closeComplaintModal();
    showNotification('Complaint submitted successfully!', 'success');
  } catch (err) {
    console.error('Submit error:', err);
    showNotification('Failed to submit complaint', 'error');
  }
};

// ─── View Details ─────────────────────────────────────────────────────────────
window.viewComplaintDetails = function (id) {
  const c = complaints.find(x => x.id === id);
  if (!c) return;
  const content = document.getElementById('complaintDetailsContent');
  content.innerHTML = `
    <div class="complaint-details">
      <div class="detail-item"><div class="detail-label">ID</div><div class="detail-value">${c.id}</div></div>
      <div class="detail-item"><div class="detail-label">Status</div><div class="detail-value"><span class="status-badge status-${(c.status || '').toLowerCase()}">${c.status}</span></div></div>
      <div class="detail-item"><div class="detail-label">Priority</div><div class="detail-value"><span class="priority-badge priority-${(c.priority || '').toLowerCase()}">${c.priority}</span></div></div>
      <div class="detail-item"><div class="detail-label">Category</div><div class="detail-value">${c.category}</div></div>
      <div class="detail-item"><div class="detail-label">Complainant</div><div class="detail-value">${c.complainantName}</div></div>
      <div class="detail-item"><div class="detail-label">Phone</div><div class="detail-value">${c.complainantPhone}</div></div>
      <div class="detail-item" style="grid-column:1/-1"><div class="detail-label">Description</div><div class="detail-value" style="white-space:pre-line">${c.description}</div></div>
      <div class="detail-item"><div class="detail-label">Location</div><div class="detail-value">${c.location || 'Not specified'}</div></div>
    </div>`;
  complaintDetailsModal.style.display = 'flex';
  setTimeout(() => complaintDetailsModal.classList.add('active'), 10);
};

// ─── Delete ───────────────────────────────────────────────────────────────────
window.deleteComplaint = async function (id) {
  if (!confirm('Delete this complaint?')) return;
  try {
    await deleteDoc(doc(db, 'complaints', id));
    complaints = complaints.filter(c => c.id !== id);
    renderComplaints();
    showNotification('Complaint deleted', 'success');
  } catch (err) {
    console.error('Delete error:', err);
    showNotification('Failed to delete', 'error');
  }
};

// ─── Filter / Search ──────────────────────────────────────────────────────────
window.filterComplaints = function (filter) {
  currentFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  renderComplaints();
};
window.searchComplaints = function () { searchQuery = document.getElementById('complaintSearch').value; renderComplaints(); };
window.updateComplaintStatus = function () { closeComplaintDetailsModal(); };

// ─── Nav ──────────────────────────────────────────────────────────────────────
function setActiveNav() {
  const page = window.location.pathname.split('/').pop();
  const link = document.querySelector(`.nav-link[href="${page}"]`);
  if (link) link.classList.add('active');
}

// ─── SOS / Logout / Notifications ────────────────────────────────────────────
window.triggerSOS = function () { alert(`🚨 SOS ALERT\nOfficer: ${currentUser?.fullName}\nTime: ${new Date().toLocaleString()}`); if (confirm('Call 112?')) window.open('tel:112', '_self'); };
window.logout = async function () { if (!confirm('Logout?')) return; await signOut(auth); sessionStorage.clear(); localStorage.removeItem('constableCurrentUser'); window.location.href = 'index.html'; };
window.showNotifications = function () { alert('No new notifications.'); };

// ─── Toast ────────────────────────────────────────────────────────────────────
function showNotification(message, type = 'info') {
  const n = document.createElement('div');
  Object.assign(n.style, { position: 'fixed', bottom: '20px', right: '20px', background: type === 'success' ? '#38a169' : '#e53e3e', color: 'white', padding: '14px 20px', borderRadius: '10px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', zIndex: '9999', opacity: '0', transform: 'translateY(20px)', transition: 'all 0.3s ease', fontFamily: 'Inter,sans-serif', fontWeight: '500' });
  n.textContent = message;
  document.body.appendChild(n);
  setTimeout(() => { n.style.opacity = '1'; n.style.transform = 'translateY(0)'; }, 10);
  setTimeout(() => { n.style.opacity = '0'; setTimeout(() => n.remove(), 300); }, 3000);
}