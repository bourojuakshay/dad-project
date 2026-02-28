// Complaints JavaScript Logic

// Global Variables
let complaints = [];
let currentFilter = 'all';
let searchQuery = '';

// DOM Elements
const userName = document.getElementById('userName');
const totalComplaints = document.getElementById('totalComplaints');
const pendingComplaints = document.getElementById('pendingComplaints');
const resolvedComplaints = document.getElementById('resolvedComplaints');
const urgentComplaints = document.getElementById('urgentComplaints');
const complaintsTableBody = document.getElementById('complaintsTableBody');
const complaintModal = document.getElementById('complaintModal');
const complaintDetailsModal = document.getElementById('complaintDetailsModal');

// Initialize Complaints Page
document.addEventListener('DOMContentLoaded', function() {
  // Check authentication
  checkAuth();
  
  // Set up event listeners
  setupEventListeners();
  
  // Load user data
  loadUserData();
  
  // Load complaints
  loadComplaints();
  
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
    sidebarToggle.addEventListener('click', function() {
      sidebar.classList.toggle('active');
      overlay.classList.toggle('active');
    });
  }
  
  if (overlay) {
    overlay.addEventListener('click', function() {
      sidebar.classList.remove('active');
      overlay.classList.remove('active');
    });
  }
  
  // Close sidebar when window is resized to desktop
  window.addEventListener('resize', function() {
    if (window.innerWidth > 1024) {
      sidebar.classList.remove('active');
      overlay.classList.remove('active');
    }
  });
  
  // Modal events
  complaintModal.addEventListener('click', function(e) {
    if (e.target === complaintModal) {
      closeComplaintModal();
    }
  });
  
  complaintDetailsModal.addEventListener('click', function(e) {
    if (e.target === complaintDetailsModal) {
      closeComplaintDetailsModal();
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

// Load complaints from localStorage
function loadComplaints() {
  const savedComplaints = localStorage.getItem('constableComplaints');
  if (savedComplaints) {
    complaints = JSON.parse(savedComplaints);
  } else {
    // Create sample data
    createSampleComplaints();
  }
  renderComplaints();
}

// Create sample complaints data
function createSampleComplaints() {
  const sampleComplaints = [
    {
      id: 'CMP-' + Date.now(),
      complainantName: 'Ramesh Kumar',
      complainantPhone: '9876543210',
      complainantAddress: '123 Main Street, Dichpally',
      category: 'Theft',
      description: 'Bicycle stolen from outside my house last night',
      priority: 'Normal',
      location: 'Outside residence, Main Street',
      status: 'Pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'CMP-' + (Date.now() + 1),
      complainantName: 'Sunita Devi',
      complainantPhone: '8765432109',
      complainantAddress: '456 Market Road, Dichpally',
      category: 'Assault',
      description: 'Physical assault during argument at market',
      priority: 'High',
      location: 'Dichpally Market',
      status: 'Pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'CMP-' + (Date.now() + 2),
      complainantName: 'Vijay Singh',
      complainantPhone: '7654321098',
      complainantAddress: '789 Station Road, Dichpally',
      category: 'Fraud',
      description: 'Online shopping fraud - paid but no delivery',
      priority: 'Urgent',
      location: 'Online',
      status: 'Resolved',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'CMP-' + (Date.now() + 3),
      complainantName: 'Anita Rao',
      complainantPhone: '6543210987',
      complainantAddress: '321 Gandhi Nagar, Dichpally',
      category: 'Domestic Violence',
      description: 'Domestic violence complaint against husband',
      priority: 'Urgent',
      location: 'Residence, Gandhi Nagar',
      status: 'Pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
  
  complaints = sampleComplaints;
  saveComplaints();
}

// Save complaints to localStorage
function saveComplaints() {
  localStorage.setItem('constableComplaints', JSON.stringify(complaints));
}

// Render complaints table
function renderComplaints() {
  complaintsTableBody.innerHTML = '';
  
  const filteredComplaints = filterAndSearchComplaints();
  
  if (filteredComplaints.length === 0) {
    complaintsTableBody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; color: var(--gray-600); padding: 40px;">
          No complaints found
        </td>
      </tr>
    `;
    return;
  }
  
  filteredComplaints.forEach(complaint => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${complaint.id}</td>
      <td>${complaint.complainantName}</td>
      <td><span class="status-badge">${complaint.category}</span></td>
      <td>${new Date(complaint.createdAt).toLocaleDateString()}</td>
      <td><span class="status-badge status-${complaint.status.toLowerCase()}">${complaint.status}</span></td>
      <td><span class="priority-badge priority-${complaint.priority.toLowerCase()}">${complaint.priority}</span></td>
      <td>
        <button class="action-btn primary" onclick="viewComplaintDetails('${complaint.id}')">View</button>
        <button class="action-btn secondary" onclick="editComplaint('${complaint.id}')">Edit</button>
        <button class="action-btn danger" onclick="deleteComplaint('${complaint.id}')">Delete</button>
      </td>
    `;
    complaintsTableBody.appendChild(row);
  });
  
  updateStatistics();
}

// Filter and search complaints
function filterAndSearchComplaints() {
  let filtered = complaints;
  
  // Filter by status
  if (currentFilter !== 'all') {
    filtered = filtered.filter(complaint => {
      if (currentFilter === 'urgent') {
        return complaint.priority === 'Urgent';
      } else {
        return complaint.status.toLowerCase() === currentFilter;
      }
    });
  }
  
  // Search
  if (searchQuery.trim() !== '') {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(complaint => 
      complaint.id.toLowerCase().includes(query) ||
      complaint.complainantName.toLowerCase().includes(query) ||
      complaint.category.toLowerCase().includes(query) ||
      complaint.description.toLowerCase().includes(query) ||
      complaint.location.toLowerCase().includes(query)
    );
  }
  
  // Sort by date (newest first)
  filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  return filtered;
}

// Filter complaints
function filterComplaints(filter) {
  currentFilter = filter;
  
  // Update filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');
  
  renderComplaints();
}

// Search complaints
function searchComplaints() {
  searchQuery = document.getElementById('complaintSearch').value;
  renderComplaints();
}

// Update statistics
function updateStatistics() {
  totalComplaints.textContent = complaints.length;
  
  const pending = complaints.filter(c => c.status === 'Pending').length;
  const resolved = complaints.filter(c => c.status === 'Resolved').length;
  const urgent = complaints.filter(c => c.priority === 'Urgent').length;
  
  pendingComplaints.textContent = pending;
  resolvedComplaints.textContent = resolved;
  urgentComplaints.textContent = urgent;
}

// Open complaint modal
function openComplaintModal() {
  complaintModal.style.display = 'flex';
  setTimeout(() => {
    complaintModal.classList.add('active');
  }, 10);
}

// Close complaint modal
function closeComplaintModal() {
  complaintModal.classList.remove('active');
  setTimeout(() => {
    complaintModal.style.display = 'none';
    document.getElementById('complaintForm').reset();
  }, 300);
}

// Submit complaint
function submitComplaint() {
  const formData = {
    complainantName: document.getElementById('complainantName').value,
    complainantPhone: document.getElementById('complainantPhone').value,
    complainantAddress: document.getElementById('complainantAddress').value,
    category: document.getElementById('complaintCategory').value,
    description: document.getElementById('complaintDescription').value,
    priority: document.getElementById('complaintPriority').value,
    location: document.getElementById('complaintLocation').value
  };
  
  // Validation
  if (!formData.complainantName || !formData.complainantPhone || !formData.complainantAddress || 
      !formData.category || !formData.description) {
    showNotification('Please fill in all required fields', 'error');
    return;
  }
  
  // Create new complaint
  const newComplaint = {
    id: 'CMP-' + Date.now(),
    ...formData,
    status: 'Pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  // Add to complaints array
  complaints.unshift(newComplaint);
  saveComplaints();
  renderComplaints();
  
  // Close modal and show success
  closeComplaintModal();
  showNotification('Complaint submitted successfully!', 'success');
}

// View complaint details
function viewComplaintDetails(complaintId) {
  const complaint = complaints.find(c => c.id === complaintId);
  if (!complaint) return;
  
  const content = document.getElementById('complaintDetailsContent');
  content.innerHTML = `
    <div class="complaint-details">
      <div class="detail-item">
        <div class="detail-label">Complaint ID</div>
        <div class="detail-value">${complaint.id}</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Status</div>
        <div class="detail-value">
          <span class="status-badge status-${complaint.status.toLowerCase()}">${complaint.status}</span>
        </div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Priority</div>
        <div class="detail-value">
          <span class="priority-badge priority-${complaint.priority.toLowerCase()}">${complaint.priority}</span>
        </div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Created</div>
        <div class="detail-value">${new Date(complaint.createdAt).toLocaleString()}</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Updated</div>
        <div class="detail-value">${new Date(complaint.updatedAt).toLocaleString()}</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Category</div>
        <div class="detail-value">${complaint.category}</div>
      </div>
    </div>
    
    <div style="margin-top: 20px; padding: 16px; background: var(--gray-100); border-radius: 12px; border: 1px solid var(--gray-200);">
      <h4 style="margin: 0 0 12px 0; color: var(--gray-800);">Complainant Information</h4>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <div>
          <div class="detail-label">Name</div>
          <div class="detail-value">${complaint.complainantName}</div>
        </div>
        <div>
          <div class="detail-label">Phone</div>
          <div class="detail-value">${complaint.complainantPhone}</div>
        </div>
      </div>
      <div style="margin-top: 12px;">
        <div class="detail-label">Address</div>
        <div class="detail-value" style="white-space: pre-line;">${complaint.complainantAddress}</div>
      </div>
    </div>
    
    <div style="margin-top: 20px; padding: 16px; background: var(--gray-100); border-radius: 12px; border: 1px solid var(--gray-200);">
      <h4 style="margin: 0 0 12px 0; color: var(--gray-800);">Incident Details</h4>
      <div class="detail-label">Description</div>
      <div class="detail-value" style="white-space: pre-line; margin-bottom: 12px;">${complaint.description}</div>
      <div class="detail-label">Location</div>
      <div class="detail-value">${complaint.location || 'Not specified'}</div>
    </div>
  `;
  
  complaintDetailsModal.style.display = 'flex';
  setTimeout(() => {
    complaintDetailsModal.classList.add('active');
  }, 10);
}

// Close complaint details modal
function closeComplaintDetailsModal() {
  complaintDetailsModal.classList.remove('active');
  setTimeout(() => {
    complaintDetailsModal.style.display = 'none';
  }, 300);
}

// Edit complaint
function editComplaint(complaintId) {
  const complaint = complaints.find(c => c.id === complaintId);
  if (!complaint) return;
  
  // Pre-fill form with complaint data
  document.getElementById('complainantName').value = complaint.complainantName;
  document.getElementById('complainantPhone').value = complaint.complainantPhone;
  document.getElementById('complainantAddress').value = complaint.complainantAddress;
  document.getElementById('complaintCategory').value = complaint.category;
  document.getElementById('complaintDescription').value = complaint.description;
  document.getElementById('complaintPriority').value = complaint.priority;
  document.getElementById('complaintLocation').value = complaint.location;
  
  // Change submit function to update
  const submitBtn = document.querySelector('.modal-footer .primary-btn');
  submitBtn.onclick = () => updateComplaint(complaintId);
  submitBtn.textContent = 'Update Complaint';
  
  openComplaintModal();
}

// Update complaint
function updateComplaint(complaintId) {
  const formData = {
    complainantName: document.getElementById('complainantName').value,
    complainantPhone: document.getElementById('complainantPhone').value,
    complainantAddress: document.getElementById('complainantAddress').value,
    category: document.getElementById('complaintCategory').value,
    description: document.getElementById('complaintDescription').value,
    priority: document.getElementById('complaintPriority').value,
    location: document.getElementById('complaintLocation').value
  };
  
  // Validation
  if (!formData.complainantName || !formData.complainantPhone || !formData.complainantAddress || 
      !formData.category || !formData.description) {
    showNotification('Please fill in all required fields', 'error');
    return;
  }
  
  // Find and update complaint
  const index = complaints.findIndex(c => c.id === complaintId);
  if (index > -1) {
    complaints[index] = {
      ...complaints[index],
      ...formData,
      updatedAt: new Date().toISOString()
    };
    
    saveComplaints();
    renderComplaints();
    
    // Reset submit function
    const submitBtn = document.querySelector('.modal-footer .primary-btn');
    submitBtn.onclick = submitComplaint;
    submitBtn.textContent = 'Submit Complaint';
    
    closeComplaintModal();
    showNotification('Complaint updated successfully!', 'success');
  }
}

// Delete complaint
function deleteComplaint(complaintId) {
  if (confirm('Are you sure you want to delete this complaint?')) {
    complaints = complaints.filter(c => c.id !== complaintId);
    saveComplaints();
    renderComplaints();
    showNotification('Complaint deleted successfully!', 'success');
  }
}

// Update complaint status
function updateComplaintStatus() {
  // This would typically be implemented in the complaint details modal
  // For now, we'll close the modal
  closeComplaintDetailsModal();
  showNotification('Complaint status updated!', 'success');
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