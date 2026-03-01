// GPS Tracking JavaScript Logic

// Global Variables
let trackingActive = false;
let trackingTimer = null;
let locationHistory = [];
let watchId = null;
let startTime = null;
let mapCentered = true;

// Map Global Variables
let leafletMap = null;
let mapMarker = null;
let mapPolyline = null;
let routeVisible = true;
const API_KEY = 'AIzaSyAOVYRIgupAurZup5y1PRh8Ismb1A3';

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
document.addEventListener('DOMContentLoaded', function () {
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

// Initialize map using Leaflet
function initMap() {
  const mapElement = document.getElementById('map');
  if (!mapElement) return;

  // Clear any existing content
  mapElement.innerHTML = '';

  // Default to central India (or somewhere generic)
  let startLat = 20.5937;
  let startLng = 78.9629;
  let zoomLevel = 5;

  if (locationHistory.length > 0) {
    const lastLoc = locationHistory[locationHistory.length - 1];
    startLat = lastLoc.latitude;
    startLng = lastLoc.longitude;
    zoomLevel = 15;
  }

  // Initialize the Leaflet map container
  leafletMap = L.map('map').setView([startLat, startLng], zoomLevel);

  // Set the map tile layer with user provided API Key to Geoapify (which uses standard OpenStreetMap map tiles via their service)
  L.tileLayer(`https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=${API_KEY}`, {
    attribution: 'Powered by <a href="https://www.geoapify.com/" target="_blank">Geoapify</a> | <a href="https://openmaptiles.org/" target="_blank">© OpenMapTiles</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">© OpenStreetMap</a>',
    maxZoom: 20
  }).addTo(leafletMap);

  // If there's history, restore the polyline and marker
  if (locationHistory.length > 0) {
    const latLngs = locationHistory.map(loc => [loc.latitude, loc.longitude]);
    mapPolyline = L.polyline(latLngs, { color: '#3182ce', weight: 4 }).addTo(leafletMap);

    mapMarker = L.marker([startLat, startLng]).addTo(leafletMap);
  }
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
    function (position) {
      const locationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: new Date().toISOString(),
        speed: position.coords.speed || 0,
        heading: position.coords.heading || 0
      };

      // Send to server
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (token) {
        fetch('/api/location', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(locationData)
        }).catch(err => console.error('Error sending location:', err));
      }

      // Update display
      updateCurrentLocation(locationData);
      updateStatistics();
      addToHistoryTable(locationData, true);
      updateTrackingTime();

      // Update map
      updateMap(locationData);

      showNotification('Location updated', 'success');
    },
    function (error) {
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
    function (position) {
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
    function (error) {
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

// Update map
function updateMap(locationData) {
  if (!leafletMap) return;

  const latLng = [locationData.latitude, locationData.longitude];

  // Update or create marker
  if (mapMarker) {
    mapMarker.setLatLng(latLng);
  } else {
    mapMarker = L.marker(latLng).addTo(leafletMap);
  }

  // Update route polyline
  const latLngs = locationHistory.map(loc => [loc.latitude, loc.longitude]);
  if (mapPolyline) {
    mapPolyline.setLatLngs(latLngs);
  } else {
    mapPolyline = L.polyline(latLngs, { color: '#3182ce', weight: 4 }).addTo(leafletMap);
  }

  // Ensure routing line is visible if enabled
  if (routeVisible && !leafletMap.hasLayer(mapPolyline)) {
    leafletMap.addLayer(mapPolyline);
  }

  // Center if map should be synced 
  if (mapCentered) {
    leafletMap.setView(latLng, Math.max(leafletMap.getZoom(), 15));
  }
}

// Center map
function centerMap() {
  if (!leafletMap) return;

  if (locationHistory.length > 0) {
    const latestLocation = locationHistory[locationHistory.length - 1];
    leafletMap.setView([latestLocation.latitude, latestLocation.longitude], 15);
    mapCentered = true;
    showNotification('Map centered on current location', 'success');
  } else {
    showNotification('No location data available', 'warning');
  }
}

// Toggle route display
function toggleRoute() {
  if (!leafletMap || !mapPolyline) return;

  if (routeVisible) {
    leafletMap.removeLayer(mapPolyline);
    routeVisible = false;
    showNotification('Route display hidden', 'info');
  } else {
    leafletMap.addLayer(mapPolyline);
    routeVisible = true;
    showNotification('Route display shown', 'info');
  }
}

// Load location history from Backend
async function loadLocationHistory() {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (!token) return;

  try {
    const response = await fetch('/api/locations', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      locationHistory = await response.json();
    } else {
      locationHistory = [];
    }
  } catch (error) {
    console.error('Error loading location history:', error);
    locationHistory = [];
  }

  renderHistoryTable();
}

// Removed saveLocationHistory as the backend handles persistence now.

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
  navigator.clipboard.writeText(coords).then(function () {
    showNotification('Coordinates copied to clipboard', 'success');
  }).catch(function (err) {
    console.error('Could not copy coordinates: ', err);
  });
}

// Clear location history
function clearLocationHistory() {
  if (confirm('Are you sure you want to clear all location history?')) {
    locationHistory = [];
    // Mocking client side reset, no DELETE /api/locations endpoint easily available
    renderHistoryTable();
    updateStatistics();
    showNotification('Location history mock cleared', 'info');
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