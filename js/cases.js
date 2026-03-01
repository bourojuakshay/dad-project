// Cases JavaScript Logic

// Global Variables
let cases = [];
let currentFilter = 'all';
let searchQuery = '';

// DOM Elements
const userName = document.getElementById('userName');
const totalCases = document.getElementById('totalCases');
const pendingCases = document.getElementById('pendingCases');
const closedCases = document.getElementById('closedCases');
const activeCases = document.getElementById('activeCases');
const casesTableBody = document.getElementById('casesTableBody');
const caseModal = document.getElementById('caseModal');
const caseDetailsModal = document.getElementById('caseDetailsModal');

// Initialize Cases Page
document.addEventListener('DOMContentLoaded', function () {
  // Check authentication
  checkAuth();

  // Set up event listeners
  setupEventListeners();

  // Load user data
  loadUserData();

  // Load cases
  loadCases();

  // Update statistics
  updateStatistics();

  // Set active navigation
  setActiveNav();
});

// Check if user is authenticated
function checkAuth() {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    window.location.href = 'index.html';
    return;
  }
}

// Get current user from storage
function getCurrentUser() {
  let user = sessionStorage.getItem('constableCurrentUser');
  if (!user) {
    user = localStorage.getItem('constableCurrentUser');
  }
  return user ? JSON.parse(user) : null;
}

// Set up event listeners
function setupEventListeners() {
  // Sidebar toggle
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');

  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', function () {
      sidebar.classList.toggle('active');
      overlay.classList.toggle('active');
    });
  }

  if (overlay) {
    overlay.addEventListener('click', function () {
      sidebar.classList.remove('active');
      overlay.classList.remove('active');
    });
  }

  // Close sidebar when window is resized to desktop
  window.addEventListener('resize', function () {
    if (window.innerWidth > 1024) {
      sidebar.classList.remove('active');
      overlay.classList.remove('active');
    }
  });

  // Modal events
  caseModal.addEventListener('click', function (e) {
    if (e.target === caseModal) {
      closeCaseModal();
    }
  });

  caseDetailsModal.addEventListener('click', function (e) {
    if (e.target === caseDetailsModal) {
      closeCaseDetailsModal();
    }
  });
}

// Load user data
function loadUserData() {
  const user = getCurrentUser();
  if (user) {
    userName.textContent = user.fullName;
  }
}

// Load cases from Backend
async function loadCases() {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (!token) return;

  try {
    const response = await fetch('/api/cases', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      cases = await response.json();
    } else {
      cases = [];
    }
  } catch (error) {
    console.error('Error loading cases:', error);
    cases = [];
  }

  renderCases();
}

// Removed saveCases and createSampleCases logic as persistence is now handled by the backend.

// Render cases table
function renderCases() {
  casesTableBody.innerHTML = '';

  const filteredCases = filterAndSearchCases();

  if (filteredCases.length === 0) {
    casesTableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: var(--gray-600); padding: 40px;">
          No cases found
        </td>
      </tr>
    `;
    return;
  }

  filteredCases.forEach(caseItem => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${caseItem.caseId}</td>
      <td><span class="status-badge">${caseItem.caseType}</span></td>
      <td>${caseItem.officer}</td>
      <td><span class="status-badge status-${caseItem.status.toLowerCase().replace(' ', '-')}">${caseItem.status}</span></td>
      <td>${new Date(caseItem.updatedAt).toLocaleDateString()}</td>
      <td>
        <button class="action-btn primary" onclick="viewCaseDetails('${caseItem.id}')">View</button>
        <button class="action-btn secondary" onclick="editCase('${caseItem.id}')">Edit</button>
        <button class="action-btn danger" onclick="deleteCase('${caseItem.id}')">Delete</button>
      </td>
    `;
    casesTableBody.appendChild(row);
  });

  updateStatistics();
}

// Filter and search cases
function filterAndSearchCases() {
  let filtered = cases;

  // Filter by status
  if (currentFilter !== 'all') {
    filtered = filtered.filter(caseItem => {
      if (currentFilter === 'active') {
        return caseItem.status !== 'Closed';
      } else {
        return caseItem.status.toLowerCase() === currentFilter;
      }
    });
  }

  // Search
  if (searchQuery.trim() !== '') {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(caseItem =>
      caseItem.caseId.toLowerCase().includes(query) ||
      caseItem.caseType.toLowerCase().includes(query) ||
      caseItem.description.toLowerCase().includes(query) ||
      caseItem.officer.toLowerCase().includes(query)
    );
  }

  // Sort by date (newest first)
  filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return filtered;
}

// Filter cases
function filterCases(filter) {
  currentFilter = filter;

  // Update filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');

  renderCases();
}

// Search cases
function searchCases() {
  searchQuery = document.getElementById('caseSearch').value;
  renderCases();
}

// Update statistics
function updateStatistics() {
  totalCases.textContent = cases.length;

  const pending = cases.filter(c => c.status === 'Pending').length;
  const closed = cases.filter(c => c.status === 'Closed').length;
  const active = cases.filter(c => c.status !== 'Closed').length;

  pendingCases.textContent = pending;
  closedCases.textContent = closed;
  activeCases.textContent = active;
}

// Open case modal
function openCaseModal() {
  caseModal.style.display = 'flex';
  setTimeout(() => {
    caseModal.classList.add('active');
  }, 10);
}

// Close case modal
function closeCaseModal() {
  caseModal.classList.remove('active');
  setTimeout(() => {
    caseModal.style.display = 'none';
    document.getElementById('caseForm').reset();
  }, 300);
}

// Submit case update
async function submitCase() {
  const formData = new FormData();
  formData.append('firId', document.getElementById('caseType').value); // Using caseType as FIR ID placeholder for this UI
  formData.append('remarks', document.getElementById('caseDescription').value);

  // Validation
  if (!formData.get('firId') || !formData.get('remarks')) {
    showNotification('Please fill in required fields', 'error');
    return;
  }

  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  try {
    const response = await fetch('/api/cases', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (response.ok) {
      const newCase = await response.json();

      // Ensure UI mock mappings (this maps backend case schema back to frontend table requirements)
      newCase.caseId = 'CASE/' + new Date().getFullYear() + '/' + String(cases.length + 1).padStart(3, '0');
      newCase.caseType = 'Follow-up';
      newCase.status = document.getElementById('caseStatus').value || 'Pending';
      newCase.priority = document.getElementById('casePriority').value || 'Normal';
      newCase.officer = document.getElementById('caseOfficer').value || 'Self';
      newCase.description = document.getElementById('caseDescription').value;
      newCase.updatedAt = newCase.createdAt;

      cases.unshift(newCase);
      renderCases();
      closeCaseModal();
      showNotification('Case updated successfully!', 'success');
    } else {
      showNotification('Failed to submit case update.', 'error');
    }
  } catch (error) {
    console.error('Submit error:', error);
    showNotification('Network error.', 'error');
  }
}

// View case details
function viewCaseDetails(caseId) {
  const caseItem = cases.find(c => c.id === caseId);
  if (!caseItem) return;

  const content = document.getElementById('caseDetailsContent');
  content.innerHTML = `
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
      <div class="detail-item">
        <div class="detail-label">Case ID</div>
        <div class="detail-value">${caseItem.caseId}</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Status</div>
        <div class="detail-value">
          <span class="status-badge status-${caseItem.status.toLowerCase().replace(' ', '-')}">${caseItem.status}</span>
        </div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Priority</div>
        <div class="detail-value">
          <span class="priority-badge priority-${caseItem.priority.toLowerCase()}">${caseItem.priority}</span>
        </div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Created</div>
        <div class="detail-value">${new Date(caseItem.createdAt).toLocaleString()}</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Updated</div>
        <div class="detail-value">${new Date(caseItem.updatedAt).toLocaleString()}</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Case Type</div>
        <div class="detail-value">${caseItem.caseType}</div>
      </div>
    </div>
    
    <div style="margin-top: 20px; padding: 16px; background: var(--gray-100); border-radius: 12px; border: 1px solid var(--gray-200);">
      <h4 style="margin: 0 0 12px 0; color: var(--gray-800);">Case Details</h4>
      <div class="detail-label">Description</div>
      <div class="detail-value" style="white-space: pre-line; margin-bottom: 12px;">${caseItem.description}</div>
      <div class="detail-label">Assigned Officer</div>
      <div class="detail-value">${caseItem.officer}</div>
    </div>
  `;

  caseDetailsModal.style.display = 'flex';
  setTimeout(() => {
    caseDetailsModal.classList.add('active');
  }, 10);
}

// Close case details modal
function closeCaseDetailsModal() {
  caseDetailsModal.classList.remove('active');
  setTimeout(() => {
    caseDetailsModal.style.display = 'none';
  }, 300);
}

// Edit case
function editCase(caseId) {
  const caseItem = cases.find(c => c.id === caseId);
  if (!caseItem) return;

  // Pre-fill form with case data
  document.getElementById('caseType').value = caseItem.caseType;
  document.getElementById('caseDescription').value = caseItem.description;
  document.getElementById('caseStatus').value = caseItem.status;
  document.getElementById('caseOfficer').value = caseItem.officer;
  document.getElementById('casePriority').value = caseItem.priority;

  // Change submit function to update
  const submitBtn = document.querySelector('.modal-footer .primary-btn');
  submitBtn.onclick = () => updateCase(caseId);
  submitBtn.textContent = 'Update Case';

  openCaseModal();
}

// Update case
async function updateCase(caseId) {
  // Mocking the update for backend as backend doesn't have a PUT /api/cases/:id currently
  // We'll update array locally to simulate
  const formData = {
    caseType: document.getElementById('caseType').value,
    description: document.getElementById('caseDescription').value,
    status: document.getElementById('caseStatus').value,
    officer: document.getElementById('caseOfficer').value,
    priority: document.getElementById('casePriority').value
  };

  if (!formData.caseType || !formData.description || !formData.officer) {
    showNotification('Please fill in all required fields', 'error');
    return;
  }

  const index = cases.findIndex(c => c.id === caseId);
  if (index > -1) {
    cases[index] = {
      ...cases[index],
      ...formData,
      updatedAt: new Date().toISOString()
    };
    renderCases();

    const submitBtn = document.querySelector('.modal-footer .primary-btn');
    submitBtn.onclick = submitCase;
    submitBtn.textContent = 'Create Case';
    closeCaseModal();
    showNotification('Case mocked update successfully!', 'success');
  }
}

// Delete case
function deleteCase(caseId) {
  if (confirm('Are you sure you want to delete this case?')) {
    cases = cases.filter(c => c.id !== caseId);
    // Real implementation would call DELETE /api/cases/:id
    renderCases();
    showNotification('Case deleted successfully!', 'success');
  }
}

// Update case status
function updateCaseStatus() {
  // This would typically be implemented in the case details modal
  // For now, we'll close the modal
  closeCaseDetailsModal();
  showNotification('Case status updated!', 'success');
}

// Set active navigation based on current page
function setActiveNav() {
  const currentPage = window.location.pathname.split('/').pop();
  const currentLink = document.querySelector(`.nav-link[href="${currentPage}"]`);

  if (currentLink) {
    currentLink.classList.add('active');
  }
}

// Show notification toast
function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;

  // Add styles
  notification.style.position = 'fixed';
  notification.style.bottom = '20px';
  notification.style.right = '20px';
  notification.style.background = type === 'success' ? '#38a169' : '#1a365d';
  notification.style.color = 'white';
  notification.style.padding = '15px 20px';
  notification.style.borderRadius = '8px';
  notification.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
  notification.style.zIndex = '1000';
  notification.style.opacity = '0';
  notification.style.transform = 'translateY(20px)';
  notification.style.transition = 'all 0.3s ease';

  // Add to DOM
  document.body.appendChild(notification);

  // Animate in
  setTimeout(() => {
    notification.style.opacity = '1';
    notification.style.transform = 'translateY(0)';
  }, 10);

  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateY(20px)';
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}

// SOS Alert (inherited from dashboard.js)
function triggerSOS() {
  const user = getCurrentUser();
  if (!user) return;

  const message = `🚨 SOS ALERT 🚨\n\nOfficer: ${user.fullName}\nBadge ID: ${user.badgeId}\nStation: ${user.station}\nLocation: ${currentLocation ? currentLocation.textContent : 'Unknown'}\nTime: ${currentTime ? currentTime.textContent : 'Unknown'}\n\nThis is an emergency alert!`;

  // Show alert
  alert(message);

  // Try to call emergency numbers
  if (confirm('Do you want to call emergency services?')) {
    window.open('tel:112', '_self');
  }

  // Store SOS alert
  const sosAlert = {
    officer: user.fullName,
    badgeId: user.badgeId,
    station: user.station,
    location: currentLocation ? currentLocation.textContent : 'Unknown',
    time: currentTime ? currentTime.textContent : 'Unknown',
    timestamp: new Date().toISOString()
  };

  const alerts = JSON.parse(localStorage.getItem('constableSOSAlerts')) || [];
  alerts.push(sosAlert);
  localStorage.setItem('constableSOSAlerts', JSON.stringify(alerts));

  // Show notification
  showNotification('SOS alert sent successfully!', 'success');
}

// Show notifications (inherited from dashboard.js)
function showNotifications() {
  const alerts = JSON.parse(localStorage.getItem('constableSOSAlerts')) || [];
  const firs = JSON.parse(localStorage.getItem('constableFIRs')) || [];
  const cases = JSON.parse(localStorage.getItem('constableCases')) || [];

  let message = 'Recent Notifications:\n\n';

  if (alerts.length > 0) {
    message += `🚨 SOS Alerts: ${alerts.length}\n`;
  }

  if (firs.length > 0) {
    message += `📄 New FIRs: ${firs.length}\n`;
  }

  if (cases.length > 0) {
    message += `📁 Case Updates: ${cases.length}\n`;
  }

  if (alerts.length === 0 && firs.length === 0 && cases.length === 0) {
    message += 'No new notifications.';
  }

  alert(message);

  // Update notification badge
  const totalNotifications = alerts.length + firs.length + cases.length;
  const badge = document.getElementById('notificationBadge');
  if (badge) {
    badge.textContent = totalNotifications;
    badge.style.display = totalNotifications > 0 ? 'inline-block' : 'none';
  }
}

// Logout function (inherited from dashboard.js)
function logout() {
  if (confirm('Are you sure you want to logout?')) {
    sessionStorage.removeItem('constableCurrentUser');
    localStorage.removeItem('constableCurrentUser');
    window.location.href = 'index.html';
  }
}