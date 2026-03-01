// ─── GPS Tracking – Firebase Firestore ────────────────────────────────────────
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
  getFirestore, collection, query, where,
  getDocs, addDoc, serverTimestamp, orderBy
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
let trackingActive = false;
let locationHistory = [];
let watchId = null;
let startTime = null;
let mapCentered = true;
let currentUID = null;
let currentUser = null;

// Map Global Variables
let leafletMap = null;
let mapMarker = null;
let mapPolyline = null;
let routeVisible = true;
const GEOAPIFY_API_KEY = 'AIzaSyAOVYRIgupAurZup5y1PRh8Ismb1A3';

// DOM Elements
const userNameEl = document.getElementById('userName');
const currentLatEl = document.getElementById('currentLat');
const currentLngEl = document.getElementById('currentLng');
const currentAccuracyEl = document.getElementById('currentAccuracy');
const currentTimestampEl = document.getElementById('currentTimestamp');
const startTrackingBtn = document.getElementById('startTrackingBtn');
const stopTrackingBtn = document.getElementById('stopTrackingBtn');
const statusIndicator = document.getElementById('statusIndicator');
const totalPointsEl = document.getElementById('totalPoints');
const trackingTimeEl = document.getElementById('trackingTime');
const lastUpdateEl = document.getElementById('lastUpdate');
const historyTableBodyEl = document.getElementById('historyTableBody');
const totalLocationsEl = document.getElementById('totalLocations');
const totalDurationEl = document.getElementById('totalDuration');
const totalDistanceEl = document.getElementById('totalDistance');
const avgAccuracyEl = document.getElementById('avgAccuracy');

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
    await loadLocationHistory();
    initMap();
    updateStatistics();
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

  // Auto update location time when tracking
  setInterval(() => {
    if (trackingActive) updateTrackingTime();
  }, 1000);
}

// ─── Map Logic ────────────────────────────────────────────────────────────────
function initMap() {
  const mapElement = document.getElementById('map');
  if (!mapElement) return;

  mapElement.innerHTML = '';
  let startLat = 20.5937, startLng = 78.9629, zoom = 5;

  if (locationHistory.length > 0) {
    const last = locationHistory[0]; // Newest first
    startLat = last.latitude;
    startLng = last.longitude;
    zoom = 15;
  }

  leafletMap = L.map('map').setView([startLat, startLng], zoom);
  L.tileLayer(`https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=${GEOAPIFY_API_KEY}`, {
    attribution: '© OpenStreetMap, Geoapify',
    maxZoom: 20
  }).addTo(leafletMap);

  if (locationHistory.length > 0) {
    const latLngs = [...locationHistory].reverse().map(l => [l.latitude, l.longitude]);
    mapPolyline = L.polyline(latLngs, { color: '#3182ce', weight: 4 }).addTo(leafletMap);
    mapMarker = L.marker([startLat, startLng]).addTo(leafletMap);
  }
}

// ─── Tracking Logic ──────────────────────────────────────────────────────────
window.startTracking = function () {
  if (!navigator.geolocation) {
    showNotification('Geolocation not supported', 'error');
    return;
  }

  trackingActive = true;
  startTime = new Date();
  mapCentered = false;

  startTrackingBtn.disabled = true;
  stopTrackingBtn.disabled = false;
  updateStatus('tracking', 'Tracking Active');

  watchId = navigator.geolocation.watchPosition(
    async (pos) => {
      const loc = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        speed: pos.coords.speed || 0,
        heading: pos.coords.heading || 0,
        timestamp: new Date().toISOString(),
        createdBy: currentUID,
        createdAt: serverTimestamp()
      };

      try {
        await addDoc(collection(db, 'locations'), loc);
        locationHistory.unshift({ ...loc, createdAt: new Date() });
        updateCurrentLocation(loc);
        addToHistoryTable(loc, true);
        updateMap(loc);
        updateStatistics();
      } catch (err) {
        console.error('Save location error:', err);
      }
    },
    (err) => showNotification('Location error: ' + err.message, 'error'),
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  );

  showNotification('GPS tracking started', 'success');
};

window.stopTracking = function () {
  if (watchId) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
  trackingActive = false;
  startTrackingBtn.disabled = false;
  stopTrackingBtn.disabled = true;
  updateStatus('idle', 'Tracking Stopped');
  showNotification('GPS tracking stopped', 'info');
};

window.getCurrentLocation = function () {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const loc = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        timestamp: new Date().toISOString(),
        createdBy: currentUID,
        createdAt: serverTimestamp()
      };
      updateCurrentLocation(loc);
      updateMap(loc);
      showNotification('Location updated', 'success');
    },
    (err) => showNotification('Error: ' + err.message, 'error'),
    { enableHighAccuracy: true }
  );
};

function updateCurrentLocation(loc) {
  if (currentLatEl) currentLatEl.textContent = loc.latitude.toFixed(6);
  if (currentLngEl) currentLngEl.textContent = loc.longitude.toFixed(6);
  if (currentAccuracyEl) currentAccuracyEl.textContent = Math.round(loc.accuracy) + 'm';
  if (currentTimestampEl) currentTimestampEl.textContent = new Date(loc.timestamp).toLocaleString();
  if (lastUpdateEl) lastUpdateEl.textContent = new Date().toLocaleTimeString();
}

function updateStatus(status, text) {
  const dot = statusIndicator.querySelector('.status-dot');
  const txt = statusIndicator.querySelector('.status-text');
  dot.className = 'status-dot ' + status;
  txt.textContent = text;
}

function updateTrackingTime() {
  if (!startTime || !trackingActive) return;
  const diff = new Date() - startTime;
  const h = Math.floor(diff / 3600000).toString().padStart(2, '0');
  const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
  const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
  if (trackingTimeEl) trackingTimeEl.textContent = `${h}:${m}:${s}`;
}

function updateMap(loc) {
  if (!leafletMap) return;
  const latLng = [loc.latitude, loc.longitude];
  if (mapMarker) mapMarker.setLatLng(latLng);
  else mapMarker = L.marker(latLng).addTo(leafletMap);

  const historyLatLngs = [...locationHistory].reverse().map(l => [l.latitude, l.longitude]);
  if (mapPolyline) mapPolyline.setLatLngs(historyLatLngs);
  else mapPolyline = L.polyline(historyLatLngs, { color: '#3182ce', weight: 4 }).addTo(leafletMap);

  if (mapCentered) leafletMap.setView(latLng, Math.max(leafletMap.getZoom(), 15));
}

window.centerMap = function () {
  if (locationHistory.length > 0) {
    const latLng = [locationHistory[0].latitude, locationHistory[0].longitude];
    leafletMap.setView(latLng, 15);
    mapCentered = true;
    showNotification('Map centered', 'success');
  }
};

window.toggleRoute = function () {
  if (!mapPolyline) return;
  if (routeVisible) { leafletMap.removeLayer(mapPolyline); routeVisible = false; }
  else { leafletMap.addLayer(mapPolyline); routeVisible = true; }
};

// ─── History Logic ───────────────────────────────────────────────────────────
async function loadLocationHistory() {
  try {
    const q = query(collection(db, 'locations'), where('createdBy', '==', currentUID), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    locationHistory = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderHistoryTable();
  } catch (err) {
    console.error('Load history error:', err);
  }
}

function renderHistoryTable() {
  if (!historyTableBodyEl) return;
  historyTableBodyEl.innerHTML = '';
  locationHistory.forEach(loc => addToHistoryTable(loc));
  if (totalPointsEl) totalPointsEl.textContent = locationHistory.length;
}

function addToHistoryTable(loc, prepend = false) {
  const row = document.createElement('tr');
  row.innerHTML = `
    <td>${new Date(loc.timestamp).toLocaleString()}</td>
    <td>${loc.latitude.toFixed(6)}</td>
    <td>${loc.longitude.toFixed(6)}</td>
    <td>${Math.round(loc.accuracy)}m</td>
    <td>
      <button class="action-btn" onclick="viewOnMap(${loc.latitude}, ${loc.longitude})">📍</button>
      <button class="action-btn" onclick="copyCoordinates(${loc.latitude}, ${loc.longitude})">📋</button>
    </td>`;
  if (prepend && historyTableBodyEl.firstChild) historyTableBodyEl.insertBefore(row, historyTableBodyEl.firstChild);
  else historyTableBodyEl.appendChild(row);
}

window.viewOnMap = function (lat, lng) { updateMap({ latitude: lat, longitude: lng }); showNotification('Viewing on map', 'success'); };
window.copyCoordinates = function (lat, lng) {
  navigator.clipboard.writeText(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
  showNotification('Copied coordinates', 'success');
};

function updateStatistics() {
  if (totalLocationsEl) totalLocationsEl.textContent = locationHistory.length;
  if (locationHistory.length === 0) return;
  const first = locationHistory[locationHistory.length - 1], last = locationHistory[0];
  const dur = new Date(last.timestamp) - new Date(first.timestamp);
  if (totalDurationEl) totalDurationEl.textContent = `${Math.floor(dur / 3600000)}h ${Math.floor((dur % 3600000) / 60000)}m`;
  if (avgAccuracyEl) avgAccuracyEl.textContent = Math.round(locationHistory.reduce((s, l) => s + l.accuracy, 0) / locationHistory.length) + 'm';
}

// ─── Nav / SOS / Logout ──────────────────────────────────────────────────────
function setActiveNav() {
  const page = window.location.pathname.split('/').pop();
  const link = document.querySelector(`.nav-link[href="${page}"]`);
  if (link) link.classList.add('active');
}

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

function showNotification(message, type = 'info') {
  const n = document.createElement('div');
  const bg = type === 'success' ? '#38a169' : '#1a365d';
  Object.assign(n.style, { position: 'fixed', bottom: '20px', right: '20px', background: bg, color: 'white', padding: '15px 20px', borderRadius: '8px', zIndex: '2000', opacity: '0', transition: 'all 0.3s ease' });
  n.textContent = message;
  document.body.appendChild(n);
  setTimeout(() => n.style.opacity = '1', 10);
  setTimeout(() => { n.style.opacity = '0'; setTimeout(() => n.remove(), 300); }, 3000);
}