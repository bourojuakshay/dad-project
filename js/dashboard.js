// Dashboard JavaScript Logic

// DOM Elements
const userName = document.getElementById('userName');
const greetingName = document.getElementById('greetingName');
const currentDate = document.getElementById('currentDate');
const currentTime = document.getElementById('currentTime');
const currentLocation = document.getElementById('currentLocation');
const statFIR = document.getElementById('statFIR');
const statCases = document.getElementById('statCases');
const statLocations = document.getElementById('statLocations');
const statPhotos = document.getElementById('statPhotos');
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
const overlay = document.getElementById('overlay');
const navLinks = document.querySelectorAll('.nav-link');

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', function () {
  // Check authentication
  checkAuth();

  // Set up event listeners
  setupEventListeners();

  // Load user data
  loadUserData();

  // Update stats
  updateStats();

  // Update time and date
  updateTime();
  setInterval(updateTime, 1000);

  // Get current location
  getCurrentLocation();

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
  sidebarToggle.addEventListener('click', toggleSidebar);
  overlay.addEventListener('click', closeSidebar);

  // Navigation links
  navLinks.forEach(link => {
    link.addEventListener('click', function (e) {
      // Remove active class from all links
      navLinks.forEach(l => l.classList.remove('active'));

      // Add active class to clicked link
      this.classList.add('active');

      // Close sidebar on mobile
      if (window.innerWidth <= 1024) {
        closeSidebar();
      }
    });
  });

  // Close sidebar when window is resized to desktop
  window.addEventListener('resize', function () {
    if (window.innerWidth > 1024) {
      sidebar.classList.remove('active');
      overlay.classList.remove('active');
    }
  });
}

// Toggle sidebar
function toggleSidebar() {
  sidebar.classList.toggle('active');
  overlay.classList.toggle('active');
}

// Close sidebar
function closeSidebar() {
  sidebar.classList.remove('active');
  overlay.classList.remove('active');
}

// Load user data
function loadUserData() {
  const user = getCurrentUser();
  if (user) {
    if (userName) userName.textContent = user.fullName || user.username;
    if (greetingName) greetingName.textContent = (user.fullName || user.username).split(' ')[0];
  }
}

// Update stats
async function updateStats() {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (!token) return;

  try {
    const headers = { 'Authorization': `Bearer ${token}` };

    // Fetch FIRs
    const firsRes = await fetch('/api/firs', { headers });
    const firs = firsRes.ok ? await firsRes.json() : [];

    // Fetch Cases
    const casesRes = await fetch('/api/cases', { headers });
    const cases = casesRes.ok ? await casesRes.json() : [];

    // Fetch Locations (only admins/officers can see all, but this endpoint might be restricted)
    let locationsCount = 0;
    try {
      const locRes = await fetch('/api/locations', { headers });
      if (locRes.ok) {
        const locs = await locRes.json();
        locationsCount = locs.length;
      }
    } catch (e) { /* Ignore */ }

    // Fetch Uploads/Photos (assuming /api/uploads exists or using complaints as proxy)
    const complaintsRes = await fetch('/api/complaints', { headers });
    const complaints = complaintsRes.ok ? await complaintsRes.json() : [];

    if (statFIR) statFIR.textContent = firs.length;
    if (statCases) statCases.textContent = cases.length;
    if (statLocations) statLocations.textContent = locationsCount;
    if (statPhotos) statPhotos.textContent = complaints.length; // fallback
  } catch (error) {
    console.error('Error fetching stats:', error);
  }
}

// Update time and date
function updateTime() {
  const now = new Date();

  // Format date
  const options = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  currentDate.textContent = now.toLocaleDateString('en-US', options);

  // Format time
  const timeOptions = {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  };
  currentTime.textContent = now.toLocaleTimeString('en-US', timeOptions);
}

// Get current location
function getCurrentLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      function (position) {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        if (currentLocation) currentLocation.textContent = `Lat: ${lat.toFixed(6)}, Lon: ${lon.toFixed(6)}`;

        // Send location to server
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (token) {
          fetch('/api/location', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ latitude: lat, longitude: lon })
          }).catch(err => console.error('Error updating location:', err));
        }
      },
      function (error) {
        currentLocation.textContent = 'Location unavailable';
        console.log('Location error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  } else {
    currentLocation.textContent = 'Geolocation not supported';
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

// SOS Alert
function triggerSOS() {
  const user = getCurrentUser();
  if (!user) return;

  const message = `🚨 SOS ALERT 🚨\n\nOfficer: ${user.fullName}\nBadge ID: ${user.badgeId}\nStation: ${user.station}\nLocation: ${currentLocation.textContent}\nTime: ${currentTime.textContent}\n\nThis is an emergency alert!`;

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
    location: currentLocation.textContent,
    time: currentTime.textContent,
    timestamp: new Date().toISOString()
  };

  const alerts = JSON.parse(localStorage.getItem('constableSOSAlerts')) || [];
  alerts.push(sosAlert);
  localStorage.setItem('constableSOSAlerts', JSON.stringify(alerts));

  // Show notification
  showNotification('SOS alert sent successfully!', 'success');
}

// Logout function
function logout() {
  if (confirm('Are you sure you want to logout?')) {
    sessionStorage.removeItem('constableCurrentUser');
    localStorage.removeItem('constableCurrentUser');
    window.location.href = 'index.html';
  }
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