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
async function handleLogin(e) {
  e.preventDefault();

  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const rememberMe = document.getElementById('rememberMe').checked;

  // Basic validation
  if (!email || !password) {
    showError(loginError, 'Please fill in all fields');
    return;
  }

  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: email,
        password: password
      })
    });

    const data = await response.json();

    if (response.ok) {
      // Login successful - store token and user temporarily
      if (rememberMe) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('constableCurrentUser', JSON.stringify(data.user));
      } else {
        sessionStorage.setItem('token', data.token);
        sessionStorage.setItem('constableCurrentUser', JSON.stringify(data.user));
      }

      // Ensure profile photo exists
      if (!localStorage.getItem('constableProfilePhoto')) {
        const defaultPhoto = 'https://via.placeholder.com/200x200/1a365d/ffffff?text=Constable';
        localStorage.setItem('constableProfilePhoto', defaultPhoto);
      }

      // Redirect to security PIN verification
      window.location.href = 'security.html';
    } else {
      showError(loginError, data.error || 'Invalid credentials');
    }
  } catch (error) {
    console.error('Login error:', error);
    showError(loginError, 'Network error. Please try again.');
  }
}

// Handle Signup
async function handleSignup(e) {
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

  try {
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: email,
        email: email,
        password: password,
        fullName: fullName,
        badgeId: badgeId,
        role: 'constable'
      })
    });

    const data = await response.json();

    if (response.ok) {
      // Auto-login and redirect
      sessionStorage.setItem('token', data.token);
      sessionStorage.setItem('constableCurrentUser', JSON.stringify(data.user));

      const defaultPhoto = 'https://via.placeholder.com/200x200/1a365d/ffffff?text=Constable';
      localStorage.setItem('constableProfilePhoto', defaultPhoto);

      showSuccess(signupError, 'Account created successfully! Redirecting...');

      setTimeout(() => {
        window.location.href = 'security.html';
      }, 2000);
    } else {
      showError(signupError, data.error || 'Failed to create account');
    }
  } catch (error) {
    console.error('Signup error:', error);
    showError(signupError, 'Network error. Please try again.');
  }
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
document.addEventListener('DOMContentLoaded', function () {
  // Check auth state on load
  checkAuth();
});
