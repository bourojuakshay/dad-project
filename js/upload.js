// Upload JavaScript Logic

// Global Variables
let uploadedFiles = [];
let uploadProgress = 0;

// DOM Elements
const userName = document.getElementById('userName');
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const uploadProgressContainer = document.getElementById('uploadProgress');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const filesGrid = document.getElementById('filesGrid');

// Initialize Upload Page
document.addEventListener('DOMContentLoaded', function() {
  // Check authentication
  checkAuth();
  
  // Set up event listeners
  setupEventListeners();
  
  // Load user data
  loadUserData();
  
  // Load uploaded files
  loadUploadedFiles();
  
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
  
  // File upload events
  dropzone.addEventListener('dragover', handleDragOver);
  dropzone.addEventListener('dragleave', handleDragLeave);
  dropzone.addEventListener('drop', handleDrop);
  dropzone.addEventListener('click', () => fileInput.click());
  
  fileInput.addEventListener('change', handleFileSelect);
}

// Load user data
function loadUserData() {
  const user = getCurrentUser();
  if (user) {
    userName.textContent = user.fullName;
  }
}

// Load uploaded files from localStorage
function loadUploadedFiles() {
  const savedFiles = localStorage.getItem('constableUploadedFiles');
  if (savedFiles) {
    uploadedFiles = JSON.parse(savedFiles);
  } else {
    // Create sample data
    createSampleFiles();
  }
  renderFiles();
}

// Create sample files data
function createSampleFiles() {
  const sampleFiles = [
    {
      id: 'file-' + Date.now(),
      name: 'evidence_photo_1.jpg',
      size: 2048000,
      type: 'image/jpeg',
