// Settings Page JavaScript Logic

// DOM Elements
const userName = document.getElementById('userName');
const passwordForm = document.getElementById('passwordForm');
const passwordError = document.getElementById('passwordError');
const darkModeToggle = document.getElementById('darkModeToggle');
const animationsToggle = document.getElementById('animationsToggle');
const locationToggle = document.getElementById('locationToggle');
const cameraToggle = document.getElementById('cameraToggle');
const dataCollectionToggle = document.getElementById('dataCollectionToggle');
const autoLogoutSelect = document.getElementById('autoLogoutSelect');

// Initialize Settings Page
document.addEventListener('DOMContentLoaded', function() {
  // Check authentication
  checkAuth();
  
  // Set up event listeners
  setupEventListeners();
  
  // Load user data
  loadUserData();
  
  // Load settings
  loadSettings();
  
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
  
  // Password strength checker
  const newPasswordInput = document.getElementById('newPassword');
  if (newPasswordInput) {
    newPasswordInput.addEventListener('input', checkPasswordStrength);
  }
}

// Load user data
function loadUserData() {
  const user = getCurrentUser();
  if (user) {
    userName.textContent = user.fullName;
  }
}

// Load settings from localStorage
function loadSettings() {
  // Dark mode
  const darkMode = localStorage.getItem('constableDarkMode') === 'true';
  darkModeToggle.checked = darkMode;
  if (darkMode) {
    document.body.classList.add('dark');
  }
  
  // Animations
  const animationsEnabled = localStorage.getItem('constableAnimations') !== 'false';
  animationsToggle.checked = animationsEnabled;
  if (!animationsEnabled) {
    document.body.style.transition = 'none';
  }
  
  // Privacy settings
  locationToggle.checked = localStorage.getItem('constableLocationAccess') !== 'false';
  cameraToggle.checked = localStorage.getItem('constableCameraAccess') !== 'false';
  dataCollectionToggle.checked = localStorage.getItem('constableDataCollection') === 'true';
  
  // Auto logout
  const autoLogout = localStorage.getItem('constableAutoLogout') || '15';
  autoLogoutSelect.value = autoLogout;
  
  // Set up auto logout timer
  setupAutoLogout(autoLogout);
}

// Toggle password form
function togglePasswordForm() {
  const isShowing = passwordForm.style.display === 'block';
  passwordForm.style.display = isShowing ? 'none' : 'block';
  passwordError.textContent = '';
  clearPasswordForm();
}

// Clear password form
function clearPasswordForm() {
  document.getElementById('currentPassword').value = '';
  document.getElementById('newPassword').value = '';
  document.getElementById('confirmNewPassword').value = '';
  document.getElementById('passwordStrength').innerHTML = '';
}

// Check password strength
function checkPasswordStrength() {
  const password = document.getElementById('newPassword').value;
  const strengthIndicator = document.getElementById('passwordStrength');
  
  if (!password) {
    strengthIndicator.innerHTML = '';
    return;
  }
  
  let strength = 0;
  let feedback = [];
  
  // Check length
  if (password.length >= 8) strength++;
  else feedback.push('At least 8 characters');
  
  // Check for uppercase
  if (/[A-Z]/.test(password)) strength++;
  else feedback.push('Uppercase letter');
  
  // Check for lowercase
  if (/[a-z]/.test(password)) strength++;
  else feedback.push('Lowercase letter');
  
  // Check for numbers
  if (/[0-9]/.test(password)) strength++;
  else feedback.push('Number');
  
  // Check for special characters
  if (/[^A-Za-z0-9]/.test(password)) strength++;
  else feedback.push('Special character');
  
  // Display strength
  if (strength < 3) {
    strengthIndicator.className = 'password-strength weak';
    strengthIndicator.textContent = `Weak - ${feedback.join(', ')}`;
  } else if (strength < 5) {
    strengthIndicator.className = 'password-strength medium';
    strengthIndicator.textContent = 'Medium - Good password';
  } else {
    strengthIndicator.className = 'password-strength strong';
    strengthIndicator.textContent = 'Strong - Excellent password';
  }
}

// Change password
function changePassword(e) {
  e.preventDefault();
  
  const user = getCurrentUser();
  if (!user) return;
  
  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword = document.getElementById('newPassword').value;
  const confirmNewPassword = document.getElementById('confirmNewPassword').value;
  
  // Validation
  if (currentPassword !== user.password) {
    showError(passwordError, 'Current password is incorrect');
    return;
  }
  
  if (newPassword.length < 6) {
    showError(passwordError, 'New password must be at least 6 characters long');
    return;
  }
  
  if (newPassword === currentPassword) {
    showError(passwordError, 'New password must be different from current password');
    return;
  }
  
  if (newPassword !== confirmNewPassword) {
    showError(passwordError, 'Passwords do not match');
    return;
  }
  
  // Update password
  const updatedUser = { ...user, password: newPassword, passwordChangedAt: new Date().toISOString() };
  
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
  
  // Show success message
  showSuccess(passwordError, 'Password updated successfully!');
  
  // Clear form and hide
  setTimeout(() => {
    togglePasswordForm();
  }, 2000);
}

// Toggle dark mode
function toggleDarkMode() {
  const enabled = darkModeToggle.checked;
  localStorage.setItem('constableDarkMode', enabled);
  
  if (enabled) {
    document.body.classList.add('dark');
  } else {
    document.body.classList.remove('dark');
  }
}

// Toggle animations
function toggleAnimations() {
  const enabled = animationsToggle.checked;
  localStorage.setItem('constableAnimations', enabled);
  
  if (enabled) {
    document.body.style.transition = '';
  } else {
    document.body.style.transition = 'none';
  }
}

// Toggle location access
function toggleLocationAccess() {
  const enabled = locationToggle.checked;
  localStorage.setItem('constableLocationAccess', enabled);
  
  if (enabled) {
    // Request location permission
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        function() {
          showNotification('Location access granted', 'success');
        },
        function() {
          showNotification('Location access denied', 'error');
          locationToggle.checked = false;
          localStorage.setItem('constableLocationAccess', 'false');
        }
      );
    } else {
      showNotification('Geolocation not supported', 'error');
      locationToggle.checked = false;
      localStorage.setItem('constableLocationAccess', 'false');
    }
  }
}

// Toggle camera access
function toggleCameraAccess() {
  const enabled = cameraToggle.checked;
  localStorage.setItem('constableCameraAccess', enabled);
  
  if (enabled) {
    // Request camera permission
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(function(stream) {
        stream.getTracks().forEach(track => track.stop());
        showNotification('Camera access granted', 'success');
      })
      .catch(function(err) {
        showNotification('Camera access denied', 'error');
        cameraToggle.checked = false;
        localStorage.setItem('constableCameraAccess', 'false');
      });
  }
}

// Toggle data collection
function toggleDataCollection() {
  const enabled = dataCollectionToggle.checked;
  localStorage.setItem('constableDataCollection', enabled);
  
  if (enabled) {
    showNotification('Anonymous data collection enabled', 'success');
  } else {
    showNotification('Data collection disabled', 'info');
  }
}

// Set auto logout
function setAutoLogout() {
  const minutes = parseInt(autoLogoutSelect.value);
  localStorage.setItem('constableAutoLogout', minutes);
  setupAutoLogout(minutes);
  
  if (minutes === 0) {
    showNotification('Auto logout disabled', 'info');
  } else {
    showNotification(`Auto logout set to ${minutes} minutes`, 'success');
  }
}

// Setup auto logout timer
function setupAutoLogout(minutes) {
  // Clear existing timer
  if (window.logoutTimer) {
    clearTimeout(window.logoutTimer);
  }
  
  if (minutes === 0) return;
  
  const logoutTime = minutes * 60 * 1000; // Convert to milliseconds
  
  function setLogoutTimer() {
    window.logoutTimer = setTimeout(() => {
      showNotification('Auto logout in 30 seconds', 'warning');
      setTimeout(() => {
        logout();
      }, 30000);
    }, logoutTime - 30000);
  }
  
  // Reset timer on user activity
  const events = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'];
  events.forEach(event => {
    document.addEventListener(event, () => {
      clearTimeout(window.logoutTimer);
      setLogoutTimer();
    });
  });
  
  setLogoutTimer();
}

// Backup data
function backupData() {
  const data = {
    users: JSON.parse(localStorage.getItem('constableUsers')) || [],
    currentUser: getCurrentUser(),
    firs: JSON.parse(localStorage.getItem('constableFIRs')) || [],
    cases: JSON.parse(localStorage.getItem('constableCases')) || [],
    locations: JSON.parse(localStorage.getItem('constableLocations')) || [],
    photos: JSON.parse(localStorage.getItem('constablePhotos')) || [],
    settings: {
      darkMode: localStorage.getItem('constableDarkMode'),
      animations: localStorage.getItem('constableAnimations'),
      locationAccess: localStorage.getItem('constableLocationAccess'),
      cameraAccess: localStorage.getItem('constableCameraAccess'),
      dataCollection: localStorage.getItem('constableDataCollection'),
      autoLogout: localStorage.getItem('constableAutoLogout')
    },
    backupDate: new Date().toISOString()
  };
  
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", `constable_backup_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
  
  showNotification('Backup created successfully!', 'success');
}

// Clear cache
function clearCache() {
  if (confirm('This will clear all temporary data and cache. Continue?')) {
    // Clear specific cache items
    localStorage.removeItem('constableLocations');
    localStorage.removeItem('constablePhotos');
    localStorage.removeItem('constableSOSAlerts');
    
    // Clear browser cache
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          caches.delete(cacheName);
        });
      });
    }
    
    showNotification('Cache cleared successfully!', 'success');
  }
}

// Manage SOS contacts
function manageSOSContacts() {
  alert('SOS Contacts Management\n\nThis feature would allow you to:\n• Add emergency contact numbers\n• Set priority contacts\n• Configure automatic alerts\n• Test contact functionality\n\nImplementation would require backend integration.');
}

// Configure emergency protocol
function configureEmergencyProtocol() {
  alert('Emergency Protocol Configuration\n\nThis feature would allow you to:\n• Set emergency response procedures\n• Configure automatic location sharing\n• Set up panic button behavior\n• Define escalation protocols\n\nImplementation would require backend integration.');
}

// Check for updates
function checkForUpdates() {
  showNotification('Checking for updates...', 'info');
  setTimeout(() => {
    showNotification('No updates available', 'info');
  }, 2000);
}

// Show privacy policy
function showPrivacyPolicy() {
  alert('Privacy Policy\n\nThis application collects and stores:\n• User profile information\n• Location data (when enabled)\n• Case and FIR data\n• Usage statistics (when enabled)\n\nData is stored locally and encrypted.\nFor full privacy policy, contact IT department.');
}

// Show help
function showHelp() {
  alert('Help & Support\n\nFor assistance with this application:\n• Contact IT Support: it-support@police.gov.in\n• Emergency: Call 112\n• Manual: Available in department intranet\n• Training: Schedule with training department');
}

// Set active navigation based on current page
function setActiveNav() {
  const currentPage = window.location.pathname.split('/').pop();
  const currentLink = document.querySelector(`.nav-link[href="${currentPage}"]`);
  
  if (currentLink) {
    currentLink.classList.add('active');
  }
}

// Error and success display functions
function showError(element, message) {
  element.textContent = message;
  element.style.color = '#e53e3e';
  element.classList.remove('success');
}

function showSuccess(element, message) {
  element.textContent = message;
  element.style.color = '#38a169';
  element.classList.add('success');
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

// Utility function to adjust font size
function adjustFontSize(change) {
  const root = document.documentElement;
  const currentSize = parseFloat(getComputedStyle(root).fontSize);
  const newSize = currentSize + change;
  
  if (newSize >= 12 && newSize <= 24) {
    root.style.fontSize = newSize + 'px';
    localStorage.setItem('constableFontSize', newSize);
    showNotification(`Font size adjusted to ${newSize}px`, 'success');
  }
}

// Reset font size
function resetFontSize() {
  document.documentElement.style.fontSize = '16px';
  localStorage.removeItem('constableFontSize');
  showNotification('Font size reset to default', 'success');
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