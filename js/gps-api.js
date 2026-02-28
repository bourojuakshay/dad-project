// GPS Tracking API Integration
document.addEventListener('DOMContentLoaded', function() {
    const map = document.getElementById('map');
    const locationBtn = document.getElementById('locationBtn');
    const locationInfo = document.getElementById('locationInfo');
    const officersList = document.getElementById('officersList');
    
    let mapInstance = null;
    let markers = new Map();
    
    // Initialize map
    function initMap() {
        // Create a simple map container
        map.innerHTML = `
            <div style="width: 100%; height: 400px; background: #f0f0f0; border: 1px solid #ccc; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #666;">
                <div>
                    <p>GPS Tracking Map</p>
                    <p style="font-size: 14px; color: #999;">Map will be loaded here</p>
                </div>
            </div>
        `;
        
        // For demo purposes, we'll show a simple interface
        // In production, you would integrate with Google Maps or OpenStreetMap API
        showToast('GPS tracking initialized. Location updates will be shown here.', 'info');
    }
    
    // Get current location
    async function getCurrentLocation() {
        if (!navigator.geolocation) {
            showToast('Geolocation is not supported by this browser.', 'error');
            return;
        }
        
        locationBtn.disabled = true;
        locationBtn.textContent = 'Getting Location...';
        
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                
                try {
                    const response = await fetch('/api/location', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            latitude,
                            longitude
                        })
                    });
                    
                    if (response.ok) {
                        locationInfo.innerHTML = `
                            <div class="location-info">
                                <h4>Current Location</h4>
                                <p><strong>Latitude:</strong> ${latitude.toFixed(6)}</p>
                                <p><strong>Longitude:</strong> ${longitude.toFixed(6)}</p>
                                <p><strong>Accuracy:</strong> ${position.coords.accuracy} meters</p>
                                <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                            </div>
                        `;
                        showToast('Location updated successfully!', 'success');
                    } else {
                        throw new Error('Failed to update location');
                    }
                } catch (error) {
                    console.error('Error updating location:', error);
                    showToast('Error updating location. Please try again.', 'error');
                } finally {
                    locationBtn.disabled = false;
                    locationBtn.textContent = 'Update Location';
                }
            },
            (error) => {
                console.error('Error getting location:', error);
                locationBtn.disabled = false;
                locationBtn.textContent = 'Update Location';
                
                let errorMessage = 'Unknown error';
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'Location access denied';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'Location information unavailable';
                        break;
                    case error.TIMEOUT:
                        errorMessage = 'Location request timed out';
                        break;
                }
                
                showToast(errorMessage, 'error');
            }
        );
    }
    
    // Get all officers' locations (Admin/Officer only)
    async function getOfficerLocations() {
        try {
            const response = await fetch('/api/locations', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (response.ok) {
                const locations = await response.json();
                renderOfficerLocations(locations);
            } else {
                throw new Error('Failed to get officer locations');
            }
        } catch (error) {
            console.error('Error getting officer locations:', error);
            showToast('Error getting officer locations. Please try again.', 'error');
        }
    }
    
    // Get user's own location
    async function getUserLocation() {
        try {
            const response = await fetch('/api/location', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (response.ok) {
                const location = await response.json();
                locationInfo.innerHTML = `
                    <div class="location-info">
                        <h4>Your Current Location</h4>
                        <p><strong>Latitude:</strong> ${location.latitude.toFixed(6)}</p>
                        <p><strong>Longitude:</strong> ${location.longitude.toFixed(6)}</p>
                        <p><strong>Last Updated:</strong> ${new Date(location.timestamp).toLocaleString()}</p>
                        <p><strong>Username:</strong> ${location.username}</p>
                    </div>
                `;
            } else {
                throw new Error('Failed to get location');
            }
        } catch (error) {
            console.error('Error getting location:', error);
        }
    }
    
    // Render officer locations
    function renderOfficerLocations(locations) {
        officersList.innerHTML = '';
        
        if (locations.length === 0) {
            officersList.innerHTML = '<p style="color: #666; text-align: center;">No active officers found</p>';
            return;
        }
        
        locations.forEach(officer => {
            const officerCard = document.createElement('div');
            officerCard.className = 'officer-card';
            officerCard.innerHTML = `
                <div class="officer-info">
                    <h4>${officer.username}</h4>
                    <p><strong>Location:</strong> ${officer.latitude.toFixed(6)}, ${officer.longitude.toFixed(6)}</p>
                    <p><strong>Last Updated:</strong> ${new Date(officer.timestamp).toLocaleString()}</p>
                </div>
                <div class="officer-actions">
                    <button onclick="trackOfficer(${officer.id})" class="btn-secondary">Track</button>
                </div>
            `;
            officersList.appendChild(officerCard);
        });
    }
    
    // Track specific officer
    window.trackOfficer = function(officerId) {
        showToast(`Tracking officer ${officerId}`, 'info');
        // In a real implementation, this would center the map on the officer's location
    };
    
    // Auto-refresh locations every 30 seconds
    function startLocationTracking() {
        setInterval(() => {
            if (localStorage.getItem('userRole') === 'admin' || localStorage.getItem('userRole') === 'officer') {
                getOfficerLocations();
            }
            getUserLocation();
        }, 30000);
    }
    
    // Event listeners
    locationBtn.addEventListener('click', getCurrentLocation);
    
    // Initialize
    initMap();
    getUserLocation();
    
    // Start tracking if user has admin/officer role
    if (localStorage.getItem('userRole') === 'admin' || localStorage.getItem('userRole') === 'officer') {
        getOfficerLocations();
        startLocationTracking();
    }
});

// Toast notification function
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}