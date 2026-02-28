// FIR API Integration
document.addEventListener('DOMContentLoaded', function() {
    const firForm = document.getElementById('firForm');
    const firList = document.getElementById('firList');
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    // Load FIRs from API
    let firs = [];
    
    // Handle form submission
    firForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(firForm);
        
        try {
            const response = await fetch('/api/firs', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    firNumber: formData.get('firNumber'),
                    complainantName: formData.get('complainantName'),
                    incidentDate: formData.get('incidentDate'),
                    location: formData.get('location'),
                    description: formData.get('description')
                })
            });
            
            if (response.ok) {
                const fir = await response.json();
                firs.push(fir);
                renderFIRs();
                firForm.reset();
                showToast('FIR registered successfully!');
            } else {
                throw new Error('Failed to register FIR');
            }
        } catch (error) {
            console.error('Error registering FIR:', error);
            showToast('Error registering FIR. Please try again.', 'error');
        }
    });
    
    // Load FIRs
    async function loadFIRs() {
        try {
            const response = await fetch('/api/firs', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (response.ok) {
                firs = await response.json();
                renderFIRs();
            }
        } catch (error) {
            console.error('Error loading FIRs:', error);
        }
    }
    
    function renderFIRs() {
        firList.innerHTML = '';
        
        firs.forEach(fir => {
            const firCard = document.createElement('div');
            firCard.className = 'fir-card';
            firCard.innerHTML = `
                <div class="fir-header">
                    <h4>${fir.firNumber}</h4>
                    <span class="status ${fir.status.toLowerCase()}">${fir.status}</span>
                </div>
                <div class="fir-info">
                    <p><strong>Complainant:</strong> ${fir.complainantName}</p>
                    <p><strong>Incident Date:</strong> ${new Date(fir.incidentDate).toLocaleDateString()}</p>
                    <p><strong>Location:</strong> ${fir.location}</p>
                    <p><strong>Description:</strong> ${fir.description}</p>
                </div>
                <div class="fir-meta">
                    <span class="date">Created: ${new Date(fir.createdAt).toLocaleDateString()}</span>
                </div>
                <div class="fir-actions">
                    <button onclick="editFIR(${fir.id})" class="btn-secondary">Edit</button>
                    <button onclick="updateFIRStatus(${fir.id})" class="btn-primary">Update Status</button>
                </div>
            `;
            firList.appendChild(firCard);
        });
    }
    
    // Edit FIR
    window.editFIR = async function(id) {
        const fir = firs.find(f => f.id === id);
        if (!fir) return;
        
        // Pre-fill form with FIR data
        document.getElementById('firNumber').value = fir.firNumber;
        document.getElementById('complainantName').value = fir.complainantName;
        document.getElementById('incidentDate').value = fir.incidentDate;
        document.getElementById('location').value = fir.location;
        document.getElementById('description').value = fir.description;
        
        // Change submit function to update
        const submitBtn = document.querySelector('.submit-btn');
        submitBtn.onclick = () => updateFIR(id);
        submitBtn.textContent = 'Update FIR';
        
        // Show form
        document.getElementById('firForm').scrollIntoView({ behavior: 'smooth' });
    };
    
    // Update FIR
    window.updateFIR = async function(id) {
        const formData = new FormData(document.getElementById('firForm'));
        
        try {
            const response = await fetch(`/api/firs/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    firNumber: formData.get('firNumber'),
                    complainantName: formData.get('complainantName'),
                    incidentDate: formData.get('incidentDate'),
                    location: formData.get('location'),
                    description: formData.get('description')
                })
            });
            
            if (response.ok) {
                const updatedFIR = await response.json();
                const index = firs.findIndex(f => f.id === id);
                if (index !== -1) {
                    firs[index] = updatedFIR;
                    renderFIRs();
                    showToast('FIR updated successfully!');
                }
            } else {
                throw new Error('Failed to update FIR');
            }
        } catch (error) {
            console.error('Error updating FIR:', error);
            showToast('Error updating FIR. Please try again.', 'error');
        }
    };
    
    // Update FIR status
    window.updateFIRStatus = async function(id) {
        const status = prompt('Enter new status (Registered, Under Investigation, Closed):');
        if (!status) return;
        
        try {
            const response = await fetch(`/api/firs/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status })
            });
            
            if (response.ok) {
                const updatedFIR = await response.json();
                const index = firs.findIndex(f => f.id === id);
                if (index !== -1) {
                    firs[index] = updatedFIR;
                    renderFIRs();
                    showToast('FIR status updated successfully!');
                }
            } else {
                throw new Error('Failed to update FIR status');
            }
        } catch (error) {
            console.error('Error updating FIR status:', error);
            showToast('Error updating FIR status. Please try again.', 'error');
        }
    };
    
    // Filter FIRs
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const status = this.dataset.status;
            filterFIRs(status);
        });
    });
    
    function filterFIRs(status) {
        firList.innerHTML = '';
        
        const filteredFIRs = status === 'All' 
            ? firs 
            : firs.filter(f => f.status === status);
        
        filteredFIRs.forEach(fir => {
            const firCard = document.createElement('div');
            firCard.className = 'fir-card';
            firCard.innerHTML = `
                <div class="fir-header">
                    <h4>${fir.firNumber}</h4>
                    <span class="status ${fir.status.toLowerCase()}">${fir.status}</span>
                </div>
                <div class="fir-info">
                    <p><strong>Complainant:</strong> ${fir.complainantName}</p>
                    <p><strong>Incident Date:</strong> ${new Date(fir.incidentDate).toLocaleDateString()}</p>
                    <p><strong>Location:</strong> ${fir.location}</p>
                    <p><strong>Description:</strong> ${fir.description}</p>
                </div>
                <div class="fir-meta">
                    <span class="date">Created: ${new Date(fir.createdAt).toLocaleDateString()}</span>
                </div>
                <div class="fir-actions">
                    <button onclick="editFIR(${fir.id})" class="btn-secondary">Edit</button>
                    <button onclick="updateFIRStatus(${fir.id})" class="btn-primary">Update Status</button>
                </div>
            `;
            firList.appendChild(firCard);
        });
    }
    
    // Initial load
    loadFIRs();
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