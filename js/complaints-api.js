// Complaints API Integration
document.addEventListener('DOMContentLoaded', function() {
    const complaintForm = document.getElementById('complaintForm');
    const complaintList = document.getElementById('complaintList');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const statusFilter = document.getElementById('statusFilter');
    
    // Load complaints from API
    let complaints = [];
    
    // Handle form submission
    complaintForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(complaintForm);
        
        try {
            const response = await fetch('/api/complaints', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: formData.get('title'),
                    description: formData.get('description'),
                    priority: formData.get('priority')
                })
            });
            
            if (response.ok) {
                const complaint = await response.json();
                complaints.push(complaint);
                renderComplaints();
                complaintForm.reset();
                showToast('Complaint submitted successfully!');
            } else {
                throw new Error('Failed to submit complaint');
            }
        } catch (error) {
            console.error('Error submitting complaint:', error);
            showToast('Error submitting complaint. Please try again.', 'error');
        }
    });
    
    // Load complaints
    async function loadComplaints() {
        try {
            const response = await fetch('/api/complaints', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (response.ok) {
                complaints = await response.json();
                renderComplaints();
            }
        } catch (error) {
            console.error('Error loading complaints:', error);
        }
    }
    
    function renderComplaints() {
        complaintList.innerHTML = '';
        
        complaints.forEach(complaint => {
            const complaintCard = document.createElement('div');
            complaintCard.className = 'complaint-card';
            complaintCard.innerHTML = `
                <div class="complaint-header">
                    <h4>${complaint.title}</h4>
                    <span class="priority ${complaint.priority.toLowerCase()}">${complaint.priority}</span>
                </div>
                <p>${complaint.description}</p>
                <div class="complaint-meta">
                    <span class="date">${new Date(complaint.date).toLocaleDateString()}</span>
                    <span class="status ${complaint.status.toLowerCase()}">${complaint.status}</span>
                </div>
                ${complaint.attachment ? `<div class="attachment">Attachment: ${complaint.attachment}</div>` : ''}
                <div class="complaint-actions">
                    ${localStorage.getItem('userRole') === 'admin' || localStorage.getItem('userRole') === 'officer' ? `
                        <button onclick="updateStatus(${complaint.id}, 'In Progress')" class="btn-secondary">In Progress</button>
                        <button onclick="updateStatus(${complaint.id}, 'Resolved')" class="btn-primary">Resolved</button>
                    ` : ''}
                </div>
            `;
            complaintList.appendChild(complaintCard);
        });
    }
    
    // Update status
    window.updateStatus = async function(id, status) {
        try {
            const response = await fetch(`/api/complaints/${id}/status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status })
            });
            
            if (response.ok) {
                const updatedComplaint = await response.json();
                const index = complaints.findIndex(c => c.id === id);
                if (index !== -1) {
                    complaints[index] = updatedComplaint;
                    renderComplaints();
                    showToast(`Complaint status updated to ${status}`);
                }
            } else {
                throw new Error('Failed to update complaint status');
            }
        } catch (error) {
            console.error('Error updating complaint status:', error);
            showToast('Error updating complaint status. Please try again.', 'error');
        }
    };
    
    // Filter complaints
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const status = this.dataset.status;
            filterComplaints(status);
        });
    });
    
    function filterComplaints(status) {
        complaintList.innerHTML = '';
        
        const filteredComplaints = status === 'All' 
            ? complaints 
            : complaints.filter(c => c.status === status);
        
        filteredComplaints.forEach(complaint => {
            const complaintCard = document.createElement('div');
            complaintCard.className = 'complaint-card';
            complaintCard.innerHTML = `
                <div class="complaint-header">
                    <h4>${complaint.title}</h4>
                    <span class="priority ${complaint.priority.toLowerCase()}">${complaint.priority}</span>
                </div>
                <p>${complaint.description}</p>
                <div class="complaint-meta">
                    <span class="date">${new Date(complaint.date).toLocaleDateString()}</span>
                    <span class="status ${complaint.status.toLowerCase()}">${complaint.status}</span>
                </div>
                ${complaint.attachment ? `<div class="attachment">Attachment: ${complaint.attachment}</div>` : ''}
                <div class="complaint-actions">
                    ${localStorage.getItem('userRole') === 'admin' || localStorage.getItem('userRole') === 'officer' ? `
                        <button onclick="updateStatus(${complaint.id}, 'In Progress')" class="btn-secondary">In Progress</button>
                        <button onclick="updateStatus(${complaint.id}, 'Resolved')" class="btn-primary">Resolved</button>
                    ` : ''}
                </div>
            `;
            complaintList.appendChild(complaintCard);
        });
    }
    
    // Initial load
    loadComplaints();
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