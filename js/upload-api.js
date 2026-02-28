 // Photo Upload API Integration
document.addEventListener('DOMContentLoaded', function() {
    const uploadForm = document.getElementById('uploadForm');
    const fileInput = document.getElementById('fileInput');
    const previewContainer = document.getElementById('previewContainer');
    const uploadProgress = document.getElementById('uploadProgress');
    const uploadStatus = document.getElementById('uploadStatus');
    const gallery = document.getElementById('gallery');
    
    let selectedFiles = [];
    
    // Handle file selection
    fileInput.addEventListener('change', function(e) {
        selectedFiles = Array.from(e.target.files);
        renderPreview();
    });
    
    // Render file preview
    function renderPreview() {
        previewContainer.innerHTML = '';
        
        selectedFiles.forEach((file, index) => {
            const previewCard = document.createElement('div');
            previewCard.className = 'preview-card';
            
            if (file.type.startsWith('image/')) {
                const img = document.createElement('img');
                img.src = URL.createObjectURL(file);
                img.alt = file.name;
                previewCard.appendChild(img);
            } else {
                const icon = document.createElement('div');
                icon.className = 'file-icon';
                icon.innerHTML = '<i class="fas fa-file"></i>';
                previewCard.appendChild(icon);
            }
            
            const fileInfo = document.createElement('div');
            fileInfo.className = 'file-info';
            fileInfo.innerHTML = `
                <p class="file-name">${file.name}</p>
                <p class="file-size">${formatFileSize(file.size)}</p>
            `;
            previewCard.appendChild(fileInfo);
            
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-btn';
            removeBtn.innerHTML = '<i class="fas fa-times"></i>';
            removeBtn.onclick = () => removeFile(index);
            previewCard.appendChild(removeBtn);
            
            previewContainer.appendChild(previewCard);
        });
    }
    
    // Remove file from selection
    function removeFile(index) {
        selectedFiles.splice(index, 1);
        renderPreview();
        fileInput.files = FileList.from(selectedFiles);
    }
    
    // Format file size
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // Handle form submission
    uploadForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (selectedFiles.length === 0) {
            showToast('Please select files to upload', 'error');
            return;
        }
        
        const formData = new FormData();
        selectedFiles.forEach(file => {
            formData.append('files', file);
        });
        
        // Add metadata
        formData.append('description', document.getElementById('description').value);
        formData.append('category', document.getElementById('category').value);
        
        try {
            uploadProgress.style.display = 'block';
            uploadStatus.textContent = 'Uploading...';
            uploadStatus.style.color = '#4a5568';
            
            const response = await fetch('/api/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });
            
            if (response.ok) {
                const result = await response.json();
                uploadStatus.textContent = 'Upload successful!';
                uploadStatus.style.color = '#38a169';
                showToast('Files uploaded successfully!', 'success');
                
                // Clear form
                selectedFiles = [];
                renderPreview();
                uploadForm.reset();
                
                // Refresh gallery
                loadGallery();
            } else {
                throw new Error('Upload failed');
            }
        } catch (error) {
            console.error('Error uploading files:', error);
            uploadStatus.textContent = 'Upload failed. Please try again.';
            uploadStatus.style.color = '#e53e3e';
            showToast('Error uploading files. Please try again.', 'error');
        } finally {
            setTimeout(() => {
                uploadProgress.style.display = 'none';
            }, 2000);
        }
    });
    
    // Load gallery
    async function loadGallery() {
        try {
            const response = await fetch('/api/uploads', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (response.ok) {
                const uploads = await response.json();
                renderGallery(uploads);
            }
        } catch (error) {
            console.error('Error loading gallery:', error);
        }
    }
    
    // Render gallery
    function renderGallery(uploads) {
        gallery.innerHTML = '';
        
        if (uploads.length === 0) {
            gallery.innerHTML = '<p style="color: #666; text-align: center;">No uploads found</p>';
            return;
        }
        
        uploads.forEach(upload => {
            const uploadCard = document.createElement('div');
            uploadCard.className = 'upload-card';
            
            if (upload.type.startsWith('image/')) {
                const img = document.createElement('img');
                img.src = upload.url;
                img.alt = upload.filename;
                img.onclick = () => openImageViewer(upload);
                uploadCard.appendChild(img);
            } else {
                const icon = document.createElement('div');
                icon.className = 'file-icon large';
                icon.innerHTML = '<i class="fas fa-file"></i>';
                uploadCard.appendChild(icon);
            }
            
            const uploadInfo = document.createElement('div');
            uploadInfo.className = 'upload-info';
            uploadInfo.innerHTML = `
                <h4>${upload.filename}</h4>
                <p>${upload.description || 'No description'}</p>
                <p class="upload-meta">Category: ${upload.category} | Uploaded: ${new Date(upload.createdAt).toLocaleDateString()}</p>
            `;
            uploadCard.appendChild(uploadInfo);
            
            const uploadActions = document.createElement('div');
            uploadActions.className = 'upload-actions';
            uploadActions.innerHTML = `
                <button onclick="downloadFile('${upload.url}', '${upload.filename}')" class="btn-secondary">Download</button>
                <button onclick="deleteFile('${upload.id}')" class="btn-danger">Delete</button>
            `;
            uploadCard.appendChild(uploadActions);
            
            gallery.appendChild(uploadCard);
        });
    }
    
    // Open image viewer
    function openImageViewer(upload) {
        const viewer = document.createElement('div');
        viewer.className = 'image-viewer';
        viewer.innerHTML = `
            <div class="viewer-content">
                <span class="close-viewer" onclick="closeImageViewer()">&times;</span>
                <img src="${upload.url}" alt="${upload.filename}">
                <div class="viewer-info">
                    <h3>${upload.filename}</h3>
                    <p>${upload.description || 'No description'}</p>
                </div>
            </div>
        `;
        document.body.appendChild(viewer);
    }
    
    // Download file
    window.downloadFile = function(url, filename) {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    // Delete file
    window.deleteFile = async function(id) {
        if (confirm('Are you sure you want to delete this file?')) {
            try {
                const response = await fetch(`/api/uploads/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                
                if (response.ok) {
                    showToast('File deleted successfully!', 'success');
                    loadGallery();
                } else {
                    throw new Error('Failed to delete file');
                }
            } catch (error) {
                console.error('Error deleting file:', error);
                showToast('Error deleting file. Please try again.', 'error');
            }
        }
    };
    
    // Close image viewer
    window.closeImageViewer = function() {
        const viewer = document.querySelector('.image-viewer');
        if (viewer) {
            viewer.remove();
        }
    };
    
    // Initialize
    loadGallery();
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