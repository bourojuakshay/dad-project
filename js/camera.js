// Camera JavaScript Logic

// Global Variables
let cameraStream = null;
let currentPhoto = null;
let photos = [];
let selectedPhotos = new Set();
let isFlashOn = false;
let currentZoom = 1;

// DOM Elements
const userName = document.getElementById('userName');
const cameraPreview = document.getElementById('cameraPreview');
const cameraCanvas = document.getElementById('cameraCanvas');
const cameraOverlay = document.getElementById('cameraOverlay');
const startCameraBtn = document.getElementById('startCameraBtn');
const stopCameraBtn = document.getElementById('stopCameraBtn');
const captureBtn = document.getElementById('captureBtn');
const switchCameraBtn = document.getElementById('switchCameraBtn');
const cameraStatus = document.getElementById('cameraStatus');
const cameraResolution = document.getElementById('cameraResolution');
const cameraFacing = document.getElementById('cameraFacing');
const flashToggle = document.getElementById('flashToggle');
const zoomRange = document.getElementById('zoomRange');
const zoomValue = document.getElementById('zoomValue');
const filters = document.getElementById('filters');
const photosGrid = document.getElementById('photosGrid');
const photoCount = document.getElementById('photoCount');
const selectedCount = document.getElementById('selectedCount');
const previewModal = document.getElementById('previewModal');
const previewImage = document.getElementById('previewImage');
const previewDate = document.getElementById('previewDate');
const previewSize = document.getElementById('previewSize');
const previewLocation = document.getElementById('previewLocation');
const previewDescription = document.getElementById('previewDescription');

// Initialize Camera Page
document.addEventListener('DOMContentLoaded', function() {
  // Check authentication
  checkAuth();
  
  // Set up event listeners
  setupEventListeners();
  
  // Load user data
  loadUserData();
  
  // Load photos
  loadPhotos();
  
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
  
  // Camera controls
  zoomRange.addEventListener('input', updateZoom);
  filters.addEventListener('change', applyFilter);
  
  // Modal events
  previewModal.addEventListener('click', function(e) {
    if (e.target === previewModal) {
      closePreviewModal();
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

// Start camera
async function startCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    showNotification('Camera not supported by this browser', 'error');
    return;
  }
  
  try {
    const constraints = {
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        frameRate: { ideal: 30 }
      }
    };
    
    cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
    cameraPreview.srcObject = cameraStream;
    
    // Update UI
    startCameraBtn.disabled = true;
    stopCameraBtn.disabled = false;
    captureBtn.disabled = false;
    switchCameraBtn.disabled = false;
    flashToggle.disabled = false;
    zoomRange.disabled = false;
    filters.disabled = false;
    
    updateStatus('active', 'Camera Active');
    updateCameraInfo();
    
    showNotification('Camera started successfully', 'success');
    
  } catch (error) {
    console.error('Camera error:', error);
    showNotification('Camera access denied or not available', 'error');
  }
}

// Stop camera
function stopCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach(track => track.stop());
    cameraStream = null;
    cameraPreview.srcObject = null;
  }
  
  // Update UI
  startCameraBtn.disabled = false;
  stopCameraBtn.disabled = true;
  captureBtn.disabled = true;
  switchCameraBtn.disabled = true;
  flashToggle.disabled = true;
  zoomRange.disabled = true;
  filters.disabled = true;
  
  updateStatus('idle', 'Camera Off');
  
  showNotification('Camera stopped', 'info');
}

// Update camera status
function updateStatus(status, text) {
  const statusDot = cameraStatus.querySelector('.status-dot');
  const statusText = cameraStatus.querySelector('.status-text');
  
  statusDot.className = 'status-dot ' + status;
  statusText.textContent = text;
}

// Update camera info
function updateCameraInfo() {
  if (cameraStream) {
    const videoTrack = cameraStream.getVideoTracks()[0];
    const settings = videoTrack.getSettings();
    
    cameraResolution.textContent = `Resolution: ${settings.width}x${settings.height}`;
    cameraFacing.textContent = `Facing: ${settings.facingMode || 'environment'}`;
  }
}

// Switch camera
async function switchCamera() {
  if (!cameraStream) return;
  
  try {
    // Stop current stream
    cameraStream.getTracks().forEach(track => track.stop());
    
    // Get new constraints for front camera
    const isFrontCamera = cameraFacing.textContent.includes('user');
    const constraints = {
      video: {
        facingMode: isFrontCamera ? { ideal: 'environment' } : { ideal: 'user' },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        frameRate: { ideal: 30 }
      }
    };
    
    cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
    cameraPreview.srcObject = cameraStream;
    
    updateCameraInfo();
    showNotification('Camera switched', 'success');
    
  } catch (error) {
    console.error('Switch camera error:', error);
    showNotification('Failed to switch camera', 'error');
  }
}

// Toggle flash
function toggleFlash() {
  if (!cameraStream) return;
  
  isFlashOn = !isFlashOn;
  const flashBtn = document.getElementById('flashToggle');
  
  if (isFlashOn) {
    flashBtn.classList.add('active');
    flashBtn.querySelector('.btn-text').textContent = 'On';
    flashBtn.style.background = 'var(--error)';
    flashBtn.style.color = 'white';
    flashBtn.style.borderColor = 'var(--error)';
    
    // Try to enable torch/flash
    const videoTrack = cameraStream.getVideoTracks()[0];
    if (videoTrack.getCapabilities && videoTrack.getCapabilities().torch) {
      videoTrack.applyConstraints({
        advanced: [{ torch: true }]
      });
    }
    
    showNotification('Flash enabled', 'success');
  } else {
    flashBtn.classList.remove('active');
    flashBtn.querySelector('.btn-text').textContent = 'Off';
    flashBtn.style.background = '';
    flashBtn.style.color = '';
    flashBtn.style.borderColor = '';
    
    // Try to disable torch/flash
    const videoTrack = cameraStream.getVideoTracks()[0];
    if (videoTrack.getCapabilities && videoTrack.getCapabilities().torch) {
      videoTrack.applyConstraints({
        advanced: [{ torch: false }]
      });
    }
    
    showNotification('Flash disabled', 'info');
  }
}

// Update zoom
function updateZoom() {
  currentZoom = parseFloat(zoomRange.value);
  zoomValue.textContent = currentZoom.toFixed(1) + 'x';
  
  if (cameraStream) {
    const videoTrack = cameraStream.getVideoTracks()[0];
    const capabilities = videoTrack.getCapabilities();
    
    if (capabilities.zoom) {
      videoTrack.applyConstraints({
        advanced: [{ zoom: currentZoom }]
      });
    }
  }
}

// Apply filter
function applyFilter() {
  const filter = filters.value;
  const preview = document.getElementById('cameraPreview');
  
  switch (filter) {
    case 'none':
      preview.style.filter = 'none';
      break;
    case 'grayscale':
      preview.style.filter = 'grayscale(100%)';
      break;
    case 'sepia':
      preview.style.filter = 'sepia(100%)';
      break;
    case 'invert':
      preview.style.filter = 'invert(100%)';
      break;
    case 'blur':
      preview.style.filter = 'blur(2px)';
      break;
    case 'brightness':
      preview.style.filter = 'brightness(150%)';
      break;
  }
}

// Capture photo
function capturePhoto() {
  if (!cameraStream) return;
  
  // Set canvas dimensions
  cameraCanvas.width = cameraPreview.videoWidth;
  cameraCanvas.height = cameraPreview.videoHeight;
  
  // Draw current frame to canvas
  const ctx = cameraCanvas.getContext('2d');
  ctx.drawImage(cameraPreview, 0, 0, cameraCanvas.width, cameraCanvas.height);
  
  // Apply current filter to canvas
  const filter = filters.value;
  switch (filter) {
    case 'grayscale':
      ctx.filter = 'grayscale(100%)';
      break;
    case 'sepia':
      ctx.filter = 'sepia(100%)';
      break;
    case 'invert':
      ctx.filter = 'invert(100%)';
      break;
    case 'blur':
      ctx.filter = 'blur(2px)';
      break;
    case 'brightness':
      ctx.filter = 'brightness(150%)';
      break;
    default:
      ctx.filter = 'none';
  }
  
  // Redraw with filter
  ctx.drawImage(cameraPreview, 0, 0, cameraCanvas.width, cameraCanvas.height);
  
  // Convert to data URL
  const dataURL = cameraCanvas.toDataURL('image/jpeg', 0.8);
  
  // Create photo object
  const photo = {
    id: Date.now().toString(),
    dataURL: dataURL,
    timestamp: new Date().toISOString(),
    description: '',
    location: getCurrentLocationString(),
    filter: filter
  };
  
  // Add to photos array
  photos.unshift(photo);
  savePhotos();
  renderPhotos();
  
  // Flash effect
  cameraOverlay.style.opacity = '1';
  setTimeout(() => {
    cameraOverlay.style.opacity = '0';
  }, 100);
  
  showNotification('Photo captured', 'success');
}

// Get current location string
function getCurrentLocationString() {
  if (navigator.geolocation) {
    return 'Location: Getting...';
  }
  return 'Location: Not available';
}

// Load photos from localStorage
function loadPhotos() {
  const savedPhotos = localStorage.getItem('constablePhotos');
  if (savedPhotos) {
    photos = JSON.parse(savedPhotos);
  }
  renderPhotos();
}

// Save photos to localStorage
function savePhotos() {
  localStorage.setItem('constablePhotos', JSON.stringify(photos));
  photoCount.textContent = photos.length;
}

// Render photos grid
function renderPhotos() {
  photosGrid.innerHTML = '';
  
  photos.forEach(photo => {
    const photoCard = document.createElement('div');
    photoCard.className = 'photo-card' + (selectedPhotos.has(photo.id) ? ' selected' : '');
    photoCard.onclick = () => openPreviewModal(photo);
    
    photoCard.innerHTML = `
      <img src="${photo.dataURL}" alt="Photo" class="photo-thumbnail">
      <div class="photo-meta">
        <div class="photo-date">${new Date(photo.timestamp).toLocaleString()}</div>
        <div class="photo-actions">
          <button class="photo-action-btn primary" onclick="event.stopPropagation(); openPreviewModal('${photo.id}')">View</button>
          <button class="photo-action-btn" onclick="event.stopPropagation(); downloadPhoto('${photo.id}')">Download</button>
          <button class="photo-action-btn danger" onclick="event.stopPropagation(); deletePhoto('${photo.id}')">Delete</button>
        </div>
      </div>
      <input type="checkbox" class="photo-checkbox" checked="${selectedPhotos.has(photo.id)}" onchange="togglePhotoSelection('${photo.id}', this)">
    `;
    
    photosGrid.appendChild(photoCard);
  });
  
  photoCount.textContent = photos.length;
  selectedCount.textContent = selectedPhotos.size;
}

// Toggle photo selection
function togglePhotoSelection(photoId, checkbox) {
  if (checkbox.checked) {
    selectedPhotos.add(photoId);
  } else {
    selectedPhotos.delete(photoId);
  }
  selectedCount.textContent = selectedPhotos.size;
  
  // Update card styling
  const card = checkbox.closest('.photo-card');
  if (checkbox.checked) {
    card.classList.add('selected');
  } else {
    card.classList.remove('selected');
  }
}

// Select all photos
function selectAllPhotos() {
  photos.forEach(photo => selectedPhotos.add(photo.id));
  renderPhotos();
  showNotification('All photos selected', 'success');
}

// Clear selection
function clearSelection() {
  selectedPhotos.clear();
  renderPhotos();
  showNotification('Selection cleared', 'info');
}

// Delete selected photos
function deleteSelectedPhotos() {
  if (selectedPhotos.size === 0) {
    showNotification('No photos selected', 'warning');
    return;
  }
  
  if (confirm(`Delete ${selectedPhotos.size} selected photos?`)) {
    photos = photos.filter(photo => !selectedPhotos.has(photo.id));
    selectedPhotos.clear();
    savePhotos();
    renderPhotos();
    showNotification('Selected photos deleted', 'success');
  }
}

// Export selected photos
function exportSelectedPhotos() {
  if (selectedPhotos.size === 0) {
    showNotification('No photos selected', 'warning');
    return;
  }
  
  const selectedPhotoObjects = photos.filter(photo => selectedPhotos.has(photo.id));
  
  if (selectedPhotoObjects.length === 1) {
    downloadPhoto(selectedPhotoObjects[0].id);
  } else {
    // Create ZIP file (simplified - would need a library like JSZip in production)
    selectedPhotoObjects.forEach(photo => {
      const link = document.createElement('a');
      link.href = photo.dataURL;
      link.download = `photo_${photo.id}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
    showNotification('Selected photos exported', 'success');
  }
}

// Delete single photo
function deletePhoto(photoId) {
  const photoIndex = photos.findIndex(p => p.id === photoId);
  if (photoIndex > -1) {
    photos.splice(photoIndex, 1);
    selectedPhotos.delete(photoId);
    savePhotos();
    renderPhotos();
    showNotification('Photo deleted', 'success');
  }
}

// Download photo
function downloadPhoto(photoId) {
  const photo = photos.find(p => p.id === photoId);
  if (photo) {
    const link = document.createElement('a');
    link.href = photo.dataURL;
    link.download = `constable_photo_${photo.id}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('Photo downloaded', 'success');
  }
}

// Open preview modal
function openPreviewModal(photoId) {
  const photo = typeof photoId === 'string' ? photos.find(p => p.id === photoId) : photoId;
  if (!photo) return;
  
  currentPhoto = photo;
  
  previewImage.src = photo.dataURL;
  previewDate.textContent = new Date(photo.timestamp).toLocaleString();
  previewSize.textContent = (photo.dataURL.length * 0.75 / 1024).toFixed(2) + ' KB';
  previewLocation.textContent = photo.location || 'Location: Not available';
  previewDescription.value = photo.description || '';
  
  previewModal.style.display = 'flex';
  setTimeout(() => {
    previewModal.classList.add('active');
  }, 10);
}

// Close preview modal
function closePreviewModal() {
  previewModal.classList.remove('active');
  setTimeout(() => {
    previewModal.style.display = 'none';
    currentPhoto = null;
  }, 300);
}

// Delete current photo from modal
function deleteCurrentPhoto() {
  if (!currentPhoto) return;
  
  deletePhoto(currentPhoto.id);
  closePreviewModal();
}

// Save photo changes from modal
function savePhotoChanges() {
  if (!currentPhoto) return;
  
  const photoIndex = photos.findIndex(p => p.id === currentPhoto.id);
  if (photoIndex > -1) {
    photos[photoIndex].description = previewDescription.value;
    savePhotos();
    renderPhotos();
    showNotification('Photo changes saved', 'success');
  }
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
  
  const message = `🚨 SOS ALERT 🚨\n\nOfficer: ${user.fullName}\nBadge ID: ${user.badgeId}\nStation: ${user.station}\nLocation: ${getCurrentLocationString()}\nTime: ${new Date().toLocaleTimeString()}\n\nThis is an emergency alert!`;
  
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
    location: getCurrentLocationString(),
    time: new Date().toLocaleTimeString(),
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