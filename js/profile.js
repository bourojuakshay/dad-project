// Profile Page JavaScript Logic

// DOM Elements
const userName = document.getElementById('userName');
const fullName = document.getElementById('fullName');
const rank = document.getElementById('rank');
const badgeId = document.getElementById('badgeId');
const station = document.getElementById('station');
const district = document.getElementById('district');
const department = document.getElementById('department');
const joinDate = document.getElementById('joinDate');
const status = document.getElementById('status');
const phoneNumber = document.getElementById('phoneNumber');
const email = document.getElementById('email');
const stationAddress = document.getElementById('stationAddress');
const serviceDuration = document.getElementById('serviceDuration');
const totalDuties = document.getElementById('totalDuties');
const activeCases = document.getElementById('activeCases');
const solvedCases = document.getElementById('solvedCases');
const profilePhoto = document.getElementById('profilePhoto');
const editSection = document.getElementById('editSection');
const editBtnText = document.getElementById('editBtnText');

// Initialize Profile Page
document.addEventListener('DOMContentLoaded', function() {
  // Check authentication
  checkAuth();
  
  // Set up event listeners
  setupEventListeners();
  
  // Load user data
  loadProfileData();
  
  // Update service duration
  updateServiceDuration();
  
  // Update stats
  updateStats();
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
  
  // Set active navigation
  setActiveNav();
}

// Load profile data
function loadProfileData() {
  const user = getCurrentUser();
  if (!user) return;
  
  // Update header
  userName.textContent = user.fullName;
  
  // Update profile info
  fullName.textContent = user.fullName;
  rank.textContent = user.rank;
  badgeId.textContent = user.badgeId;
  station.textContent = user.station;
  district.textContent = user.district;
  department.textContent = user.department;
  joinDate.textContent = user.joinDate;
  status.textContent = user.status;
  
  // Update contact info
  phoneNumber.textContent = user.phoneNumber;
  email.textContent = user.email;
  
  // Update status class
  status.className = 'meta-value status-' + user.status.toLowerCase().replace(' ', '-');
  
  // Update profile photo if exists
  const savedPhoto = localStorage.getItem('constableProfilePhoto');
  if (savedPhoto) {
    profilePhoto.src = savedPhoto;
  }
}

// Update service duration
function updateServiceDuration() {
  const user = getCurrentUser();
  if (!user) return;
  
  const joinDateObj = new Date(user.joinDate);
  const today = new Date();
  
  const diffTime = Math.abs(today - joinDateObj);
  const diffYears = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365));
  const diffMonths = Math.floor((diffTime % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30));
  
  serviceDuration.textContent = `${diffYears} years ${diffMonths} months`;
}

// Update stats
function updateStats() {
  // Get data from localStorage
  const firs = JSON.parse(localStorage.getItem('constableFIRs')) || [];
  const cases = JSON.parse(localStorage.getItem('constableCases')) || [];
  
  // Count active and solved cases
  const activeCount = cases.filter(c => c.status === 'Active').length;
  const solvedCount = cases.filter(c => c.status === 'Closed').length;
  
  // Count total duties (simulate based on join date)
  const user = getCurrentUser();
  if (user) {
    const joinDateObj = new Date(user.joinDate);
    const today = new Date();
    const diffDays = Math.floor((today - joinDateObj) / (1000 * 60 * 60 * 24));
    const dutiesCount = Math.floor(diffDays * 0.8); // Assume 80% duty rate
    totalDuties.textContent = dutiesCount;
  }
  
  activeCases.textContent = activeCount;
  solvedCases.textContent = solvedCount;
}

// Toggle edit mode
function toggleEditMode() {
  const isEditing = editSection.style.display === 'block';
  
  if (isEditing) {
    // Save changes and exit edit mode
    editSection.style.display = 'none';
    editBtnText.textContent = 'Edit Profile';
    loadProfileData(); // Reload original data
  } else {
    // Enter edit mode
    enterEditMode();
  }
}

// Enter edit mode
function enterEditMode() {
  const user = getCurrentUser();
  if (!user) return;
  
  // Populate edit form
  document.getElementById('editFullName').value = user.fullName;
  document.getElementById('editBadgeId').value = user.badgeId;
  document.getElementById('editRank').value = user.rank;
  document.getElementById('editStation').value = user.station;
  document.getElementById('editDistrict').value = user.district;
  document.getElementById('editDepartment').value = user.department;
  document.getElementById('editPhoneNumber').value = user.phoneNumber;
  document.getElementById('editEmail').value = user.email;
  document.getElementById('editJoinDate').value = user.joinDate;
  document.getElementById('editStatus').value = user.status;
  
  // Show edit form
  editSection.style.display = 'block';
  editBtnText.textContent = 'Cancel Edit';
}

// Save profile changes
function saveProfileChanges(e) {
  e.preventDefault();
  
  const user = getCurrentUser();
  if (!user) return;
  
  // Get form values
  const updatedUser = {
    ...user,
    fullName: document.getElementById('editFullName').value,
    badgeId: document.getElementById('editBadgeId').value,
    rank: document.getElementById('editRank').value,
    station: document.getElementById('editStation').value,
    district: document.getElementById('editDistrict').value,
    department: document.getElementById('editDepartment').value,
    phoneNumber: document.getElementById('editPhoneNumber').value,
    email: document.getElementById('editEmail').value,
    joinDate: document.getElementById('editJoinDate').value,
    status: document.getElementById('editStatus').value,
    updatedAt: new Date().toISOString()
  };
  
  // Update storage
  if (sessionStorage.getItem('constableCurrentUser')) {
    sessionStorage.setItem('constableCurrentUser', JSON.stringify(updatedUser));
  } else {
    localStorage.setItem('constableCurrentUser', JSON.stringify(updatedUser));
  }
  
  // Update current user in memory
  const currentUserKey = sessionStorage.getItem('constableCurrentUser') ? 'constableCurrentUser' : 'constableCurrentUser';
  if (sessionStorage.getItem(currentUserKey)) {
    sessionStorage.setItem(currentUserKey, JSON.stringify(updatedUser));
  } else {
    localStorage.setItem(currentUserKey, JSON.stringify(updatedUser));
  }
  
  // Reload profile data
  loadProfileData();
  updateServiceDuration();
  
  // Exit edit mode
  editSection.style.display = 'none';
  editBtnText.textContent = 'Edit Profile';
  
  // Show success message
  showNotification('Profile updated successfully!', 'success');
}

// Update profile photo
function updateProfilePhoto(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      profilePhoto.src = e.target.result;
      localStorage.setItem('constableProfilePhoto', e.target.result);
      showNotification('Profile photo updated!', 'success');
    };
    reader.readAsDataURL(file);
  }
}

// Capture photo using camera
function capturePhoto() {
  // Check if camera is available
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    showNotification('Camera not supported by this browser', 'error');
    return;
  }
  
  // Create camera modal
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  `;
  
  const modalContent = document.createElement('div');
  modalContent.style.cssText = `
    background: white;
    padding: 20px;
    border-radius: 12px;
    text-align: center;
    width: 90%;
    max-width: 500px;
  `;
  
  const video = document.createElement('video');
  video.style.cssText = `
    width: 100%;
    max-width: 400px;
    height: auto;
    border: 2px solid #1a365d;
    border-radius: 8px;
    background: #000;
  `;
  video.autoplay = true;
  video.playsInline = true;
  
  const controls = document.createElement('div');
  controls.style.cssText = 'margin-top: 20px; display: flex; gap: 10px; justify-content: center;';
  
  const captureBtn = document.createElement('button');
  captureBtn.textContent = '📸 Capture';
  captureBtn.style.cssText = `
    padding: 10px 20px;
    background: #1a365d;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
  `;
  
  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = '❌ Cancel';
  cancelBtn.style.cssText = `
    padding: 10px 20px;
    background: #e53e3e;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
  `;
  
  controls.appendChild(captureBtn);
  controls.appendChild(cancelBtn);
  modalContent.appendChild(video);
  modalContent.appendChild(controls);
  modal.appendChild(modalContent);
  document.body.appendChild(modal);
  
  // Start camera
  navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
      video.srcObject = stream;
      
      captureBtn.onclick = () => {
        // Create canvas to capture photo
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);
        
        // Convert to data URL and save
        const dataURL = canvas.toDataURL('image/jpeg');
        profilePhoto.src = dataURL;
        localStorage.setItem('constableProfilePhoto', dataURL);
        showNotification('Profile photo captured!', 'success');
        
        // Stop camera and close modal
        stream.getTracks().forEach(track => track.stop());
        document.body.removeChild(modal);
      };
      
      cancelBtn.onclick = () => {
        stream.getTracks().forEach(track => track.stop());
        document.body.removeChild(modal);
      };
    })
    .catch(err => {
      console.error('Camera error:', err);
      showNotification('Camera access denied', 'error');
      document.body.removeChild(modal);
    });
}

// Reset photo to default
function resetPhoto() {
  const defaultPhoto = 'https://via.placeholder.com/200x200/1a365d/ffffff?text=Constable';
  profilePhoto.src = defaultPhoto;
  localStorage.removeItem('constableProfilePhoto');
  showNotification('Profile photo reset to default', 'info');
}

// Copy to clipboard
function copyToClipboard(elementId) {
  const element = document.getElementById(elementId);
  const text = element.textContent;
  
  navigator.clipboard.writeText(text).then(function() {
    showNotification('Copied to clipboard!', 'success');
  }).catch(function(err) {
    console.error('Could not copy text: ', err);
  });
}

// Get directions to station
function getDirections() {
  const address = stationAddress.textContent;
  const url = `https://maps.google.com/?q=${encodeURIComponent(address)}`;
  window.open(url, '_blank');
}

// Download profile
function downloadProfile() {
  const user = getCurrentUser();
  if (!user) return;
  
  const profileData = {
    PersonalInfo: {
      Name: user.fullName,
      BadgeID: user.badgeId,
      Rank: user.rank,
      Status: user.status
    },
    ContactInfo: {
      Phone: user.phoneNumber,
      Email: user.email,
      Station: user.station,
      District: user.district
    },
    ServiceInfo: {
      Department: user.department,
      JoinDate: user.joinDate,
      ServiceDuration: serviceDuration.textContent
    },
    GeneratedOn: new Date().toLocaleString()
  };
  
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(profileData, null, 2));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", "constable_profile.json");
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
}

// Print profile
function printProfile() {
  window.print();
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

// Utility function to format date
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Utility function to format time
function formatTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
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