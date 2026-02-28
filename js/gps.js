// GPS Tracking JavaScript Logic

// Global Variables
let trackingActive = false;
let trackingTimer = null;
let locationHistory = [];
let watchId = null;
let startTime = null;
let mapCentered = false;

// DOM Elements
const userName = document.getElementById('userName');
const currentLat = document.getElementById('currentLat');
const currentLng = document.getElementById('currentLng');
const currentAccuracy = document.getElementById('currentAccuracy');
const currentTimestamp = document.getElementById('currentTimestamp');
const startTrackingBtn = document.getElementById('startTrackingBtn');
const stopTrackingBtn = document.getElementById('stopTrackingBtn');
const statusIndicator = document.getElementById('statusIndicator');
const totalPoints = document.getElementById('totalPoints');
const trackingTime = document.getElementById('trackingTime');
const lastUpdate = document.getElementById('lastUpdate');
const historyTableBody = document.getElementById('historyTableBody');
const totalLocations = document.getElementById('totalLocations');
const totalDuration = document.getElementById('totalDuration');
const totalDistance = document.getElementById('totalDistance');
const avgAccuracy = document.getElementById('avgAccuracy');

// Initialize GPS Page
document.addEventListener('DOMContentLoaded', function() {
  // Check authentication
  checkAuth();
  
  // Set up event listeners
  setupEventListeners();
  
  // Load user data
  loadUserData();
  
  // Load location history
  loadLocationHistory();
  
  // Update statistics
  updateStatistics();
  
  // Set active navigation
  setActiveNav();
  
  // Initialize map
  initMap();
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
  
  // Auto update location every 30 seconds when tracking
  setInterval(() => {
    if (trackingActive) {
      getCurrentLocation();
    }
  }, 30000);
}

// Load user data
function loadUserData() {
  const user = getCurrentUser();
  if (user) {
    userName.textContent = user.fullName;
  }
}

// Initialize map (simplified - would use actual mapping library in production)
function initMap() {
  // This would integrate with Google Maps, Mapbox, or Leaflet
  // For now, we'll create a simple visual representation
  const map = document.getElementById('map');
  map.innerHTML = `
    <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: var(--gray-600); font-size: 14px;">
      🗺️ Map integration would be implemented here<br>
      (Google Maps, Mapbox, or Leaflet API)
    </div>
  `;
}

// Start tracking
function startTracking() {
  if (!navigator.geolocation) {
    showNotification('Geolocation is not supported by this browser', 'error');
    return;
  }
  
  trackingActive = true;
  startTime = new Date();
  mapCentered = false;
  
  // Update UI
  startTrackingBtn.disabled = true;
  stopTrackingBtn.disabled = false;
  updateStatus('tracking', 'Tracking Active');
  
  // Start watching position
  watchId = navigator.geolocation.watchPosition(
    function(position) {
      const locationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: new Date().toISOString(),
        speed: position.coords.speed || 0,
        heading: position.coords.heading || 0
      };
      
      // Add to history
      locationHistory.push(locationData);
      saveLocationHistory();
      
      // Update display
      updateCurrentLocation(locationData);
      updateStatistics();
      addToHistoryTable(locationData, true);
      updateTrackingTime();
      
      // Update map
      updateMap(locationData);
      
      showNotification('Location updated', 'success');
    },
    function(error) {
      console.error('Location error:', error);
      showNotification('Location error: ' + error.message, 'error');
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
  
  showNotification('GPS tracking started', 'success');
}

// Stop tracking
function stopTracking() {
  if (watchId) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
  
  trackingActive = false;
  
  // Update UI
  startTrackingBtn.disabled = false;
  stopTrackingBtn.disabled = true;
  updateStatus('idle', 'Tracking Stopped');
  
  showNotification('GPS tracking stopped', 'info');
}

// Get current location (one-time)
function getCurrentLocation() {
  if (!navigator.geolocation) {
    showNotification('Geolocation is not supported by this browser', 'error');
    return;
  }
  
  navigator.geolocation.getCurrentPosition(
    function(position) {
      const locationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: new Date().toISOString(),
        speed: position.coords.speed || 0,
        heading: position.coords.heading || 0
      };
      
      // Add to history if not tracking
      if (!trackingActive) {
        locationHistory.push(locationData);
        saveLocationHistory();
        addToHistoryTable(locationData, true);
      }
      
      // Update display
      updateCurrentLocation(locationData);
      updateStatistics();
      updateMap(locationData);
      
      showNotification('Location updated', 'success');
    },
    function(error) {
      console.error('Location error:', error);
      showNotification('Location error: ' + error.message, 'error');
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000
    }
  );
}

// Update current location display
function updateCurrentLocation(locationData) {
  currentLat.textContent = locationData.latitude.toFixed(6);
  currentLng.textContent = locationData.longitude.toFixed(6);
  currentAccuracy.textContent = Math.round(locationData.accuracy) + 'm';
  currentTimestamp.textContent = new Date(locationData.timestamp).toLocaleString();
  lastUpdate.textContent = new Date().toLocaleTimeString();
}

// Update status indicator
function updateStatus(status, text) {
  const statusDot = statusIndicator.querySelector('.status-dot');
  const statusText = statusIndicator.querySelector('.status-text');
  
  statusDot.className = 'status-dot ' + status;
  statusText.textContent = text;
}

// Update tracking time
function updateTrackingTime() {
  if (startTime && trackingActive) {
    const now = new Date();
    const diff = now - startTime;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    trackingTime.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
}

// Update map (simplified)
function updateMap(locationData) {
  const map = document.getElementById('map');
  
  // Simple visual representation
  map.innerHTML = `
    <div style="width: 100%; height: 100%; position: relative; background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e0 100%);">
      <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
        <div style="font-size: 48px; margin-bottom: 10px;">📍</div>
        <div style="font-size: 14px; color: #4a5568;">Current Position</div>
        <div style="font-size: 12px; color: #718096; margin-top: 5px;">
          Lat: ${locationData.latitude.toFixed(6)}<br>
          Lng: ${locationData.longitude.toFixed(6)}
        </div>
      </div>
      <div style="position: absolute; top: 10px; left: 10px; background: rgba(255,255,255,0.9); padding: 10px; border-radius: 8px; border: 1px solid #cbd5e0;">
        <div style="font-size: 12px; color: #4a5568; font-weight: 600;">Tracking Route</div>
        <div style="font-size: 11px; color: #718096;">${locationHistory.length} points</div>
      </div>
    </div>
  `;
}

// Center map
function centerMap() {
  if (locationHistory.length > 0) {
    const latestLocation = locationHistory[locationHistory.length - 1];
    updateMap(latestLocation);
    showNotification('Map centered on current location', 'success');
  } else {
    showNotification('No location data available', 'warning');
  }
}

// Toggle route display
function toggleRoute() {
  // This would toggle the display of the tracking route on the map
  showNotification('Route display toggled', 'info');
}

// Load location history from localStorage
function loadLocationHistory() {
  const savedHistory = localStorage.getItem('constableLocations');
  if (savedHistory) {
    locationHistory = JSON.parse(savedHistory);
  }
  renderHistoryTable();
}

// Save location history to localStorage
function saveLocationHistory() {
  localStorage.setItem('constableLocations', JSON.stringify(locationHistory));
  totalPoints.textContent = locationHistory.length;
}

// Add location to history table
function addToHistoryTable(locationData, prepend = false) {
  const row = document.createElement('tr');
  row.innerHTML = `
    <td>${new Date(locationData.timestamp).toLocaleString()}</td>
    <td>${locationData.latitude.toFixed(6)}</td>
    <td>${locationData.longitude.toFixed(6)}</td>
    <td>${Math.round(locationData.accuracy)}m</td>
    <td>
      <button class="action-btn" onclick="viewOnMap(${locationData.latitude}, ${locationData.longitude})">📍</button>
      <button class="action-btn" onclick="copyCoordinates(${locationData.latitude}, ${locationData.longitude})">📋</button>
    </td>
  `;
  
  if (prepend && historyTableBody.firstChild) {
    historyTableBody.insertBefore(row, historyTableBody.firstChild);
  } else {
    historyTableBody.appendChild(row);
  }
}

// Render full history table
function renderHistoryTable() {
  historyTableBody.innerHTML = '';
  locationHistory.forEach(locationData => {
    addToHistoryTable(locationData);
  });
  totalPoints.textContent = locationHistory.length;
}

// View location on map
function viewOnMap(lat, lng) {
  const locationData = {
    latitude: lat,
    longitude: lng,
    accuracy: 10,
    timestamp: new Date().toISOString()
  };
  updateMap(locationData);
  showNotification('Viewing location on map', 'success');
}

// Copy coordinates
function copyCoordinates(lat, lng) {
  const coords = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  navigator.clipboard.writeText(coords).then(function() {
    showNotification('Coordinates copied to clipboard', 'success');
  }).catch(function(err) {
    console.error('Could not copy coordinates: ', err);
  });
}

// Clear location history
function clearLocationHistory() {
  if (confirm('Are you sure you want to clear all location history?')) {
    locationHistory = [];
    saveLocationHistory();
    renderHistoryTable();
    updateStatistics();
    showNotification('Location history cleared', 'info');
  }
}

// Filter history by date
function filterHistory() {
  const dateFilter = document.getElementById('dateFilter').value;
  if (!dateFilter) {
    renderHistoryTable();
    return;
  }
  
  const filteredHistory = locationHistory.filter(location => {
    const locationDate = new Date(location.timestamp).toISOString().split('T')[0];
    return locationDate === dateFilter;
  });
  
  historyTableBody.innerHTML = '';
  filteredHistory.forEach(locationData => {
    addToHistoryTable(locationData);
  });
}

// Clear date filter
function clearFilter() {
  document.getElementById('dateFilter').value = '';
  renderHistoryTable();
}

// Export location data
function exportLocationData(format) {
  if (locationHistory.length === 0) {
    showNotification('No location data to export', 'warning');
    return;
  }
  
  let data;
  let filename;
  
  switch (format) {
    case 'json':
      data = JSON.stringify(locationHistory, null, 2);
      filename = `location_history_${new Date().toISOString().slice(0, 10)}.json`;
      break;
      
    case 'csv':
      const csvHeaders = 'Timestamp,Latitude,Longitude,Accuracy,Speed,Heading\n';
      const csvData = locationHistory.map(loc => 
        `${loc.timestamp},${loc.latitude},${loc.longitude},${loc.accuracy},${loc.speed || ''},${loc.heading || ''}`
      ).join('\n');
      data = csvHeaders + csvData;
      filename = `location_history_${new Date().toISOString().slice(0, 10)}.csv`;
      break;
      
    case 'gpx':
      data = generateGPX(locationHistory);
      filename = `location_history_${new Date().toISOString().slice(0, 10)}.gpx`;
      break;
  }
  
  const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(data);
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", filename);
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
  
  showNotification(`${format.toUpperCase()} export completed`, 'success');
}

// Generate GPX format
function generateGPX(locations) {
  const user = getCurrentUser();
  const gpxHeader = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Constable Portal GPS Tracker" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>Location History</name>
    <desc>GPS tracking data for ${user ? user.fullName : 'Officer'}</desc>
    <author>
      <name>Constable Portal</name>
    </author>
    <time>${new Date().toISOString()}</time>
  </metadata>
  <trk>
    <name>Tracking Route</name>
    <trkseg>`;
  
  const trackPoints = locations.map(loc => 
    `      <trkpt lat="${loc.latitude}" lon="${loc.longitude}">
        <ele>0</ele>
        <time>${loc.timestamp}</time>
        <desc>Accuracy: ${loc.accuracy}m</desc>
      </trkpt>`
  ).join('\n');
  
  const gpxFooter = `
    </trkseg>
  </trk>
</gpx>`;
  
  return gpxHeader + '\n' + trackPoints + '\n' + gpxFooter;
}

// Update statistics
function updateStatistics() {
  totalLocations.textContent = locationHistory.length;
  
  if (locationHistory.length === 0) {
    totalDuration.textContent = '0h 0m';
    totalDistance.textContent = '0 km';
    avgAccuracy.textContent = '--';
    return;
  }
  
  // Calculate total duration
  const firstLocation = locationHistory[0];
  const lastLocation = locationHistory[locationHistory.length - 1];
  const durationMs = new Date(lastLocation.timestamp) - new Date(firstLocation.timestamp);
  const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
  const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
  totalDuration.textContent = `${durationHours}h ${durationMinutes}m`;
  
  // Calculate total distance (simplified Haversine formula)
  let totalDistanceKm = 0;
  for (let i = 1; i < locationHistory.length; i++) {
    const prev = locationHistory[i - 1];
    const curr = locationHistory[i];
    totalDistanceKm += calculateDistance(prev.latitude, prev.longitude, curr.latitude, curr.longitude);
  }
  totalDistance.textContent = totalDistanceKm.toFixed(2) + ' km';
  
  // Calculate average accuracy
  const avgAcc = locationHistory.reduce((sum, loc) => sum + loc.accuracy, 0) / locationHistory.length;
  avgAccuracy.textContent = Math.round(avgAcc) + 'm';
}

// Calculate distance between two points (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
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
  
  const message = `🚨 SOS ALERT 🚨\n\nOfficer: ${user.fullName}\nBadge ID: ${user.badgeId}\nStation: ${user.station}\nLocation: ${currentLat.textContent}, ${currentLng.textContent}\nTime: ${new Date().toLocaleTimeString()}\n\nThis is an emergency alert!`;
  
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
    location: `${currentLat.textContent}, ${currentLng.textContent}`,
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