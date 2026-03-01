// FIR JavaScript Logic

// Global Variables
let firs = [];
let currentFilter = 'all';
let searchQuery = '';

// DOM Elements
const userName = document.getElementById('userName');
const totalFIRs = document.getElementById('totalFIRs');
const pendingFIRs = document.getElementById('pendingFIRs');
const registeredFIRs = document.getElementById('registeredFIRs');
const urgentFIRs = document.getElementById('urgentFIRs');
const firTableBody = document.getElementById('firTableBody');
const firModal = document.getElementById('firModal');
const firDetailsModal = document.getElementById('firDetailsModal');

// Initialize FIR Page
document.addEventListener('DOMContentLoaded', function () {
  // Check authentication
  checkAuth();

  // Set up event listeners
  setupEventListeners();

  // Load user data
  loadUserData();

  // Load FIRs
  loadFIRs();

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
  firModal.addEventListener('click', function (e) {
    if (e.target === firModal) {
      closeFIRModal();
    }
  });

  firDetailsModal.addEventListener('click', function (e) {
    if (e.target === firDetailsModal) {
      closeFIRDetailsModal();
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

// Load FIRs from Backend
async function loadFIRs() {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (!token) return;

  try {
    const response = await fetch('/api/firs', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      firs = await response.json();
    } else {
      firs = [];
    }
  } catch (error) {
    console.error('Error loading FIRs:', error);
    firs = [];
  }

  renderFIRs();
}

// Removed createSampleFIRs and saveFIRs as the backend handles persistence and mocking now.

// Render FIRs table
function renderFIRs() {
  firTableBody.innerHTML = '';

  const filteredFIRs = filterAndSearchFIRs();

  if (filteredFIRs.length === 0) {
    firTableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: var(--gray-600); padding: 40px;">
          No FIRs found
        </td>
      </tr>
    `;
    return;
  }

  filteredFIRs.forEach(fir => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${fir.firNumber}</td>
      <td>${fir.complainantName}</td>
      <td><span class="status-badge">${fir.offenceType}</span></td>
      <td>${fir.dateOfIncident}</td>
      <td><span class="status-badge status-${fir.status.toLowerCase()}">${fir.status}</span></td>
      <td>
        <button class="action-btn primary" onclick="viewFIRDetails('${fir.id}')">View</button>
        <button class="action-btn secondary" onclick="editFIR('${fir.id}')">Edit</button>
        <button class="action-btn danger" onclick="deleteFIR('${fir.id}')">Delete</button>
      </td>
    `;
    firTableBody.appendChild(row);
  });

  updateStatistics();
}

// Filter and search FIRs
function filterAndSearchFIRs() {
  let filtered = firs;

  // Filter by status
  if (currentFilter !== 'all') {
    filtered = filtered.filter(fir => {
      if (currentFilter === 'urgent') {
        return fir.priority === 'Urgent';
      } else {
        return fir.status.toLowerCase() === currentFilter;
      }
    });
  }

  // Search
  if (searchQuery.trim() !== '') {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(fir =>
      fir.firNumber.toLowerCase().includes(query) ||
      fir.complainantName.toLowerCase().includes(query) ||
      fir.offenceType.toLowerCase().includes(query) ||
      fir.incidentDescription.toLowerCase().includes(query) ||
      fir.incidentLocation.toLowerCase().includes(query)
    );
  }

  // Sort by date (newest first)
  filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return filtered;
}

// Filter FIRs
function filterFIRs(filter) {
  currentFilter = filter;

  // Update filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');

  renderFIRs();
}

// Search FIRs
function searchFIRs() {
  searchQuery = document.getElementById('firSearch').value;
  renderFIRs();
}

// Update statistics
function updateStatistics() {
  totalFIRs.textContent = firs.length;

  const pending = firs.filter(f => f.status === 'Pending').length;
  const registered = firs.filter(f => f.status === 'Registered').length;
  const urgent = firs.filter(f => f.priority === 'Urgent').length;

  pendingFIRs.textContent = pending;
  registeredFIRs.textContent = registered;
  urgentFIRs.textContent = urgent;
}

// Open FIR modal
function openFIRModal() {
  firModal.style.display = 'flex';
  setTimeout(() => {
    firModal.classList.add('active');
  }, 10);
}

// Close FIR modal
function closeFIRModal() {
  firModal.classList.remove('active');
  setTimeout(() => {
    firModal.style.display = 'none';
    document.getElementById('firForm').reset();
  }, 300);
}

// Submit FIR
async function submitFIR() {
  const formData = {
    complainantName: document.getElementById('complainantName').value,
    complainantAge: parseInt(document.getElementById('complainantAge').value),
    complainantGender: document.getElementById('complainantGender').value,
    complainantOccupation: document.getElementById('complainantOccupation').value,
    complainantAddress: document.getElementById('complainantAddress').value,
    complainantPhone: document.getElementById('complainantPhone').value,
    complainantAadhaar: document.getElementById('complainantAadhaar').value,
    offenceType: document.getElementById('offenceType').value,
    dateOfIncident: document.getElementById('firDate').value,
    timeOfIncident: document.getElementById('firTime').value,
    incidentLocation: document.getElementById('incidentLocation').value,
    incidentDescription: document.getElementById('incidentDescription').value,
    accusedDetails: document.getElementById('accusedDetails').value,
    witnessDetails: document.getElementById('witnessDetails').value,
    propertyDetails: document.getElementById('propertyDetails').value,
    estimatedValue: parseInt(document.getElementById('estimatedValue').value) || 0,
    recoveryStatus: document.getElementById('recoveryStatus').value,
    priority: document.getElementById('firPriority').value
  };

  // Validation
  if (!formData.complainantName || !formData.complainantAge || !formData.complainantGender ||
    !formData.complainantOccupation || !formData.complainantAddress || !formData.complainantPhone ||
    !formData.offenceType || !formData.dateOfIncident || !formData.timeOfIncident ||
    !formData.incidentLocation || !formData.incidentDescription) {
    showNotification('Please fill in all required fields', 'error');
    return;
  }

  // Generate FIR number locally to send to backend
  const firNumber = generateFIRNumber();
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');

  try {
    const response = await fetch('/api/firs', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...formData,
        description: formData.incidentDescription,
        location: formData.incidentLocation,
        incidentDate: formData.dateOfIncident,
        firNumber: firNumber,
        status: 'Registered',
        priority: formData.priority
      })
    });

    if (response.ok) {
      const newFIR = await response.json();

      // Add full frontend UI properties mapping
      Object.assign(newFIR, formData);

      firs.unshift(newFIR);
      renderFIRs();
      closeFIRModal();
      showNotification('FIR registered successfully!', 'success');
    } else {
      showNotification('Failed to register FIR on server.', 'error');
    }
  } catch (error) {
    console.error('FIR registration error:', error);
    showNotification('Network error.', 'error');
  }
}

// Generate FIR number
function generateFIRNumber() {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const day = String(new Date().getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `FIR/${year}/${month}${day}${random}`;
}

// View FIR details
function viewFIRDetails(firId) {
  const fir = firs.find(f => f.id === firId);
  if (!fir) return;

  const content = document.getElementById('firDetailsContent');
  content.innerHTML = `
    <div class="fir-details">
      <div class="detail-item">
        <div class="detail-label">FIR Number</div>
        <div class="detail-value">${fir.firNumber}</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Status</div>
        <div class="detail-value">
          <span class="status-badge status-${fir.status.toLowerCase()}">${fir.status}</span>
        </div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Priority</div>
        <div class="detail-value">
          <span class="priority-badge priority-${fir.priority.toLowerCase()}">${fir.priority}</span>
        </div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Created</div>
        <div class="detail-value">${new Date(fir.createdAt).toLocaleString()}</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Updated</div>
        <div class="detail-value">${new Date(fir.updatedAt).toLocaleString()}</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Offence Type</div>
        <div class="detail-value">${fir.offenceType}</div>
      </div>
    </div>
    
    <div style="margin-top: 20px; padding: 16px; background: var(--gray-100); border-radius: 12px; border: 1px solid var(--gray-200);">
      <h4 style="margin: 0 0 12px 0; color: var(--gray-800);">Complainant Information</h4>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <div>
          <div class="detail-label">Name</div>
          <div class="detail-value">${fir.complainantName}</div>
        </div>
        <div>
          <div class="detail-label">Age</div>
          <div class="detail-value">${fir.complainantAge}</div>
        </div>
        <div>
          <div class="detail-label">Gender</div>
          <div class="detail-value">${fir.complainantGender}</div>
        </div>
        <div>
          <div class="detail-label">Occupation</div>
          <div class="detail-value">${fir.complainantOccupation}</div>
        </div>
      </div>
      <div style="margin-top: 12px;">
        <div class="detail-label">Address</div>
        <div class="detail-value" style="white-space: pre-line;">${fir.complainantAddress}</div>
      </div>
      <div style="margin-top: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <div>
          <div class="detail-label">Phone</div>
          <div class="detail-value">${fir.complainantPhone}</div>
        </div>
        <div>
          <div class="detail-label">Aadhaar</div>
          <div class="detail-value">${fir.complainantAadhaar || 'Not provided'}</div>
        </div>
      </div>
    </div>
    
    <div style="margin-top: 20px; padding: 16px; background: var(--gray-100); border-radius: 12px; border: 1px solid var(--gray-200);">
      <h4 style="margin: 0 0 12px 0; color: var(--gray-800);">Incident Details</h4>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <div>
          <div class="detail-label">Date</div>
          <div class="detail-value">${fir.dateOfIncident}</div>
        </div>
        <div>
          <div class="detail-label">Time</div>
          <div class="detail-value">${fir.timeOfIncident}</div>
        </div>
      </div>
      <div style="margin-top: 12px;">
        <div class="detail-label">Location</div>
        <div class="detail-value">${fir.incidentLocation}</div>
      </div>
      <div style="margin-top: 12px;">
        <div class="detail-label">Description</div>
        <div class="detail-value" style="white-space: pre-line;">${fir.incidentDescription}</div>
      </div>
    </div>
    
    <div style="margin-top: 20px; padding: 16px; background: var(--gray-100); border-radius: 12px; border: 1px solid var(--gray-200);">
      <h4 style="margin: 0 0 12px 0; color: var(--gray-800);">Additional Information</h4>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <div>
          <div class="detail-label">Accused Details</div>
          <div class="detail-value" style="white-space: pre-line;">${fir.accusedDetails || 'Not available'}</div>
        </div>
        <div>
          <div class="detail-label">Witness Details</div>
          <div class="detail-value" style="white-space: pre-line;">${fir.witnessDetails || 'Not available'}</div>
        </div>
      </div>
      <div style="margin-top: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <div>
          <div class="detail-label">Property Details</div>
          <div class="detail-value" style="white-space: pre-line;">${fir.propertyDetails || 'Not applicable'}</div>
        </div>
        <div>
          <div class="detail-label">Estimated Value</div>
          <div class="detail-value">₹${fir.estimatedValue.toLocaleString() || '0'}</div>
        </div>
        <div>
          <div class="detail-label">Recovery Status</div>
          <div class="detail-value">${fir.recoveryStatus}</div>
        </div>
      </div>
    </div>
  `;

  firDetailsModal.style.display = 'flex';
  setTimeout(() => {
    firDetailsModal.classList.add('active');
  }, 10);
}

// Close FIR details modal
function closeFIRDetailsModal() {
  firDetailsModal.classList.remove('active');
  setTimeout(() => {
    firDetailsModal.style.display = 'none';
  }, 300);
}

// Edit FIR
function editFIR(firId) {
  const fir = firs.find(f => f.id === firId);
  if (!fir) return;

  // Pre-fill form with FIR data
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

  // Change submit function to update
  const submitBtn = document.querySelector('.modal-footer .primary-btn');
  submitBtn.onclick = () => updateFIR(firId);
  submitBtn.textContent = 'Update FIR';

  openFIRModal();
}

// Update FIR
async function updateFIR(firId) {
  const formData = {
    complainantName: document.getElementById('complainantName').value,
    complainantAge: parseInt(document.getElementById('complainantAge').value),
    complainantGender: document.getElementById('complainantGender').value,
    complainantOccupation: document.getElementById('complainantOccupation').value,
    complainantAddress: document.getElementById('complainantAddress').value,
    complainantPhone: document.getElementById('complainantPhone').value,
    complainantAadhaar: document.getElementById('complainantAadhaar').value,
    offenceType: document.getElementById('offenceType').value,
    dateOfIncident: document.getElementById('firDate').value,
    timeOfIncident: document.getElementById('firTime').value,
    incidentLocation: document.getElementById('incidentLocation').value,
    incidentDescription: document.getElementById('incidentDescription').value,
    accusedDetails: document.getElementById('accusedDetails').value,
    witnessDetails: document.getElementById('witnessDetails').value,
    propertyDetails: document.getElementById('propertyDetails').value,
    estimatedValue: parseInt(document.getElementById('estimatedValue').value) || 0,
    recoveryStatus: document.getElementById('recoveryStatus').value,
    priority: document.getElementById('firPriority').value
  };

  // Validation
  if (!formData.complainantName || !formData.complainantAge || !formData.complainantGender ||
    !formData.complainantOccupation || !formData.complainantAddress || !formData.complainantPhone ||
    !formData.offenceType || !formData.dateOfIncident || !formData.timeOfIncident ||
    !formData.incidentLocation || !formData.incidentDescription) {
    showNotification('Please fill in all required fields', 'error');
    return;
  }

  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  try {
    const response = await fetch(`/api/firs/${firId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...formData,
        description: formData.incidentDescription,
        location: formData.incidentLocation,
        incidentDate: formData.dateOfIncident
      })
    });

    if (response.ok) {
      const index = firs.findIndex(f => f.id === firId);
      if (index > -1) {
        firs[index] = {
          ...firs[index],
          ...formData,
          updatedAt: new Date().toISOString()
        };
        renderFIRs();
        const submitBtn = document.querySelector('.modal-footer .primary-btn');
        submitBtn.onclick = submitFIR;
        submitBtn.textContent = 'Register FIR';
        closeFIRModal();
        showNotification('FIR updated successfully!', 'success');
      }
    } else {
      showNotification('Failed to update FIR on server.', 'error');
    }
  } catch (error) {
    console.error('FIR update error:', error);
    showNotification('Network error.', 'error');
  }
}

// Delete FIR
function deleteFIR(firId) {
  if (confirm('Are you sure you want to delete this FIR?')) {
    firs = firs.filter(f => f.id !== firId);
    // Note: there is no DELETE /api/firs/:id endpoint provided out of the box so mocking client side view.
    renderFIRs();
    showNotification('FIR mock deleted successfully!', 'success');
  }
}

// Update FIR status
function updateFIRStatus() {
  // This would typically be implemented in the FIR details modal
  // For now, we'll close the modal
  closeFIRDetailsModal();
  showNotification('FIR status updated!', 'success');
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