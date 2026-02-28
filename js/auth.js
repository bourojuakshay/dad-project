// Authentication JavaScript Logic

// DOM Elements
const loginTab = document.getElementById('loginTab');
const signupTab = document.getElementById('signupTab');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const loginError = document.getElementById('loginError');
const signupError = document.getElementById('signupError');

// Switch between Login and Signup tabs
function switchTab(tabName) {
  if (tabName === 'login') {
    loginTab.classList.add('active');
    signupTab.classList.remove('active');
    loginForm.classList.add('active');
    signupForm.classList.remove('active');
    clearErrorMessages();
  } else {
    loginTab.classList.remove('active');
    signupTab.classList.add('active');
    loginForm.classList.remove('active');
    signupForm.classList.add('active');
    clearErrorMessages();
  }
}

// Toggle password visibility
function togglePassword(inputId) {
  const input = document.getElementById(inputId);
  const button = input.nextElementSibling;
  
  if (input.type === 'password') {
    input.type = 'text';
    button.textContent = '🙈';
  } else {
    input.type = 'password';
    button.textContent = '👁️';
  }
}

// Clear error messages
function clearErrorMessages() {
  loginError.textContent = '';
  signupError.textContent = '';
}

// Handle Login
function handleLogin(e) {
  e.preventDefault();
  
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const rememberMe = document.getElementById('rememberMe').checked;
  
  // Basic validation
  if (!email || !password) {
    showError(loginError, 'Please fill in all fields');
    return;
  }
  
  // Get stored users
  const users = JSON.parse(localStorage.getItem('constableUsers')) || [];
  
  // Find user
  const user = users.find(u => (u.email === email || u.username === email) && u.password === password);
  
  if (user) {
    // Login successful - store user temporarily
    if (rememberMe) {
      localStorage.setItem('constableCurrentUser', JSON.stringify(user));
    } else {
      sessionStorage.setItem('constableCurrentUser', JSON.stringify(user));
    }
    
    // Ensure profile photo exists for existing users
    if (!localStorage.getItem('constableProfilePhoto')) {
      const defaultPhoto = 'https://via.placeholder.com/200x200/1a365d/ffffff?text=Constable';
      localStorage.setItem('constableProfilePhoto', defaultPhoto);
    }
    
    // Redirect to security PIN verification
    window.location.href = 'security.html';
  } else {
    showError(loginError, 'Invalid email/username or password');
  }
}

// Handle Signup
function handleSignup(e) {
  e.preventDefault();
  
  const fullName = document.getElementById('fullName').value.trim();
  const badgeId = document.getElementById('badgeId').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const phoneNumber = document.getElementById('phoneNumber').value.trim();
  const password = document.getElementById('signupPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const agreeTerms = document.getElementById('agreeTerms').checked;
  
  // Validation
  if (!fullName || !badgeId || !email || !phoneNumber || !password || !confirmPassword) {
    showError(signupError, 'Please fill in all fields');
    return;
  }
  
  if (!validateEmail(email)) {
    showError(signupError, 'Please enter a valid email address');
    return;
  }
  
  if (!validatePhone(phoneNumber)) {
    showError(signupError, 'Please enter a valid phone number');
    return;
  }
  
  if (password.length < 6) {
    showError(signupError, 'Password must be at least 6 characters long');
    return;
  }
  
  if (password !== confirmPassword) {
    showError(signupError, 'Passwords do not match');
    return;
  }
  
  if (!agreeTerms) {
    showError(signupError, 'You must agree to the Terms & Conditions');
    return;
  }
  
  // Check if user already exists
  const users = JSON.parse(localStorage.getItem('constableUsers')) || [];
  
  if (users.some(u => u.email === email)) {
    showError(signupError, 'An account with this email already exists');
    return;
  }
  
  if (users.some(u => u.badgeId === badgeId)) {
    showError(signupError, 'An account with this Badge ID already exists');
    return;
  }
  
  // Create new user
  const newUser = {
    id: Date.now().toString(),
    fullName: fullName,
    badgeId: badgeId,
    email: email,
    phoneNumber: phoneNumber,
    password: password,
    username: email, // Use email as username for login
    rank: 'Police Constable',
    station: 'Dichpally PS',
    district: 'Nizamabad',
    department: 'Telangana State Police',
    joinDate: new Date().toISOString().split('T')[0],
    status: 'Active',
    createdAt: new Date().toISOString()
  };
  
  // Save user
  users.push(newUser);
  localStorage.setItem('constableUsers', JSON.stringify(users));
  
  // Set default profile photo for new user
  const defaultPhoto = 'https://via.placeholder.com/200x200/1a365d/ffffff?text=Constable';
  localStorage.setItem('constableProfilePhoto', defaultPhoto);
  
  // Auto-login and redirect to security PIN
  sessionStorage.setItem('constableCurrentUser', JSON.stringify(newUser));
  showSuccess(signupError, 'Account created successfully! Redirecting...');
  
  // Redirect to security PIN verification after 2 seconds
  setTimeout(() => {
    window.location.href = 'security.html';
  }, 2000);
}

// Validation functions
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function validatePhone(phone) {
  const re = /^[6-9]\d{9}$/;
  return re.test(phone);
}

// Error and success display functions
function showError(element, message) {
  element.textContent = message;
  element.style.color = '#e53e3e';
  element.classList.remove('success');
}

function showSuccess(element, message) {
  element.textContent = message;
  element.style.color = '#38a169';
  element.classList.add('success');
}

// Check if user is already logged in
function checkAuth() {
  const currentUser = getCurrentUser();
  if (currentUser) {
    window.location.href = 'dashboard.html';
  }
}

// Redirect to security page first
function redirectToSecurity() {
    window.location.href = 'security.html';
}

// Get current user from storage
function getCurrentUser() {
  let user = sessionStorage.getItem('constableCurrentUser');
  if (!user) {
    user = localStorage.getItem('constableCurrentUser');
  }
  return user ? JSON.parse(user) : null;
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
  // Add some sample data for testing if no users exist
  const users = JSON.parse(localStorage.getItem('constableUsers')) || [];
  if (users.length === 0) {
    const sampleUser = {
      id: '1',
      fullName: 'Siridoshi Prabhakar',
      badgeId: 'TS-PC-001',
      email: 'siridoshi@example.com',
      phoneNumber: '9908797353',
      password: 'password123',
      username: 'siridoshi@example.com',
      rank: 'Police Constable',
      station: 'Dichpally PS',
      district: 'Nizamabad',
      department: 'Telangana State Police',
      joinDate: '2024-01-15',
      status: 'Active',
      createdAt: new Date().toISOString()
    };
    users.push(sampleUser);
    localStorage.setItem('constableUsers', JSON.stringify(users));
  }
});
