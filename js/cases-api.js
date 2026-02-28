// Cases API Integration
document.addEventListener('DOMContentLoaded', function() {
    const caseForm = document.getElementById('caseForm');
    const caseList = document.getElementById('caseList');
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    // Load cases from API
    let cases = [];
    
    // Handle form submission
    caseForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(caseForm);
        
        try {
            const response = await fetch('/api/cases', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    firId: formData.get('firId'),
                    remarks: formData.get('remarks')
                })
            });
            
            if (response.ok) {
                const caseUpdate = await response.json();
                cases.push(caseUpdate);
                renderCases();
                caseForm.reset();
                showToast('Case update added successfully!');
            } else {
                throw new Error('Failed to add case update');
            }
        } catch (error) {
            console.error('Error adding case update:', error);
            showToast('Error adding case update. Please try again.', 'error');
        }
    });
    
    // Load cases
    async function loadCases() {
        try {
            const response = await fetch('/api/cases', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (response.ok) {
                cases = await response.json();
                renderCases();
            }
        } catch (error) {
            console.error('Error loading cases:', error);
        }
    }
    
    function renderCases() {
        caseList.innerHTML = '';
        
        cases.forEach(caseUpdate => {
            const caseCard = document.createElement('div');
            caseCard.className = 'case-card';
            caseCard.innerHTML = `
                <div class="case-header">
                    <h4>FIR ID: ${caseUpdate.firId}</h4>
                    <span class="date">${new Date(caseUpdate.createdAt).toLocaleDateString()}</span>
                </div>
                <div class="case-info">
                    <p><strong>Remarks:</strong> ${caseUpdate.remarks}</p>
                    <p><strong>Updated By:</strong> ${caseUpdate.createdBy}</p>
                </div>
                ${caseUpdate.document ? `
                    <div class="case-document">
                        <p><strong>Document:</strong> <a href="${caseUpdate.document}" target="_blank">View Document</a></p>
                    </div>
                ` : ''}
                <div class="case-actions">
                    <button onclick="downloadDocument('${caseUpdate.document}')" class="btn-secondary">Download</button>
                    <button onclick="deleteCase(${caseUpdate.id})" class="btn-danger">Delete</button>
                </div>
            `;
            caseList.appendChild(caseCard);
        });
    }
    
    // Download document
    window.downloadDocument = function(documentUrl) {
        if (documentUrl) {
            const link = document.createElement('a');
            link.href = documentUrl;
            link.download = documentUrl.split('/').pop();
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };
    
    // Delete case
    window.deleteCase = async function(id) {
        if (confirm('Are you sure you want to delete this case update?')) {
            try {
                const response = await fetch(`/api/cases/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                
                if (response.ok) {
                    cases = cases.filter(c => c.id !== id);
                    renderCases();
                    showToast('Case update deleted successfully!');
                } else {
                    throw new Error('Failed to delete case update');
                }
            } catch (error) {
                console.error('Error deleting case update:', error);
                showToast('Error deleting case update. Please try again.', 'error');
            }
        }
    };
    
    // Filter cases
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const status = this.dataset.status;
            filterCases(status);
        });
    });
    
    function filterCases(status) {
        caseList.innerHTML = '';
        
        const filteredCases = status === 'All' 
            ? cases 
            : cases.filter(c => c.status === status);
        
        filteredCases.forEach(caseUpdate => {
            const caseCard = document.createElement('div');
            caseCard.className = 'case-card';
            caseCard.innerHTML = `
                <div class="case-header">
                    <h4>FIR ID: ${caseUpdate.firId}</h4>
                    <span class="date">${new Date(caseUpdate.createdAt).toLocaleDateString()}</span>
                </div>
                <div class="case-info">
                    <p><strong>Remarks:</strong> ${caseUpdate.remarks}</p>
                    <p><strong>Updated By:</strong> ${caseUpdate.createdBy}</p>
                </div>
                ${caseUpdate.document ? `
                    <div class="case-document">
                        <p><strong>Document:</strong> <a href="${caseUpdate.document}" target="_blank">View Document</a></p>
                    </div>
                ` : ''}
                <div class="case-actions">
                    <button onclick="downloadDocument('${caseUpdate.document}')" class="btn-secondary">Download</button>
                    <button onclick="deleteCase(${caseUpdate.id})" class="btn-danger">Delete</button>
                </div>
            `;
            caseList.appendChild(caseCard);
        });
    }
    
    // Initial load
    loadCases();
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