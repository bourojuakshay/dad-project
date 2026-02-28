// Auto Session Lock Mechanism
// Implements inactivity tracking and automatic screen locking

class AutoSessionLock {
  constructor(options = {}) {
    // Configuration
    this.config = {
      inactivityTimeout: options.inactivityTimeout || 120000, // 2 minutes in milliseconds
      maxAttempts: options.maxAttempts || 3,
      lockoutDuration: options.lockoutDuration || 30000, // 30 seconds
      pinLength: options.pinLength || 4,
      ...options
    };

    // State
    this.state = {
      isActive: false,
      isLocked: false,
      isLockout: false,
      attempts: 0,
      timer: null,
      currentUser: null,
      currentPIN: null,
      originalPage: null
    };

    // DOM Elements
    this.elements = {
      overlay: null,
      lockScreen: null,
      userAvatar: null,
      userName: null,
      userBadge: null,
      pinInputs: [],
      pinContainer: null,
      errorMessage: null,
      successMessage: null,
      attemptsInfo: null,
      countdownContainer: null,
      countdownTimer: null,
      keypad: null,
      footerNote: null
    };

    this.init();
  }

  // Initialize the auto-lock system
  init() {
    this.setupDOMElements();
    this.loadUserSession();
    this.setupEventListeners();
    this.startInactivityTimer();
    
    // Check if user is already authenticated
    if (this.state.currentUser) {
      this.renderLockScreen();
    }
  }

  // Setup DOM elements
  setupDOMElements() {
    // Create overlay if it doesn't exist
    if (!document.getElementById('auto-lock-overlay')) {
      this.createOverlay();
    }

    // Get existing elements
    this.elements.overlay = document.getElementById('auto-lock-overlay');
    this.elements.lockScreen = document.querySelector('.lock-screen-content');
    this.elements.userAvatar = document.getElementById('lock-user-avatar');
    this.elements.userName = document.getElementById('lock-user-name');
    this.elements.userBadge = document.getElementById('lock-user-badge');
    this.elements.pinInputs = document.querySelectorAll('.pin-input');
    this.elements.pinContainer = document.querySelector('.pin-container');
    this.elements.errorMessage = document.getElementById('lock-error-message');
    this.elements.successMessage = document.getElementById('lock-success-message');
    this.elements.attemptsInfo = document.getElementById('lock-attempts-info');
    this.elements.countdownContainer = document.querySelector('.countdown-container');
    this.elements.countdownTimer = document.getElementById('lock-countdown-timer');
    this.elements.keypad = document.querySelector('.lock-keypad');
    this.elements.footerNote = document.querySelector('.lock-footer-note');
  }

  // Create the lock screen overlay HTML
  createOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'auto-lock-overlay';
    overlay.className = 'auto-lock-overlay';
    overlay.innerHTML = `
      <div class="lock-screen-content">
        <div class="lock-icon-container">
          <i class="fas fa-lock lock-icon"></i>
        </div>
        
        <div class="lock-user-info">
          <div id="lock-user-avatar" class="lock-user-avatar">U</div>
          <div id="lock-user-name" class="lock-user-name">User Name</div>
          <div id="lock-user-badge" class="lock-user-badge">Badge ID</div>
        </div>

        <div class="lock-message">System Locked Due to Inactivity</div>
        
        <div class="pin-section">
          <span class="pin-label">Enter Security PIN to Unlock</span>
          <div class="pin-container">
            <input type="password" class="pin-input" maxlength="1" data-index="0">
            <input type="password" class="pin-input" maxlength="1" data-index="1">
            <input type="password" class="pin-input" maxlength="1" data-index="2">
            <input type="password" class="pin-input" maxlength="1" data-index="3">
          </div>
          
          <div id="lock-error-message" class="lock-message-error">Invalid PIN</div>
          <div id="lock-success-message" class="lock-message-success">Unlocking...</div>
          
          <div id="lock-attempts-info" class="attempts-info">Attempts remaining: 3</div>
        </div>

        <div class="countdown-container" style="display: none;">
          <span class="countdown-label">Locked - Please Wait</span>
          <div id="lock-countdown-timer" class="countdown-timer">30</div>
          <span class="countdown-label">seconds</span>
        </div>

        <div class="lock-keypad">
          <button class="lock-keypad-btn" onclick="autoSessionLock.addNumber('1')">1</button>
          <button class="lock-keypad-btn" onclick="autoSessionLock.addNumber('2')">2</button>
          <button class="lock-keypad-btn" onclick="autoSessionLock.addNumber('3')">3</button>
          <button class="lock-keypad-btn" onclick="autoSessionLock.addNumber('4')">4</button>
          <button class="lock-keypad-btn" onclick="autoSessionLock.addNumber('5')">5</button>
          <button class="lock-keypad-btn" onclick="autoSessionLock.addNumber('6')">6</button>
          <button class="lock-keypad-btn" onclick="autoSessionLock.addNumber('7')">7</button>
          <button class="lock-keypad-btn" onclick="autoSessionLock.addNumber('8')">8</button>
          <button class="lock-keypad-btn" onclick="autoSessionLock.addNumber('9')">9</button>
          <button class="lock-keypad-btn clear" onclick="autoSessionLock.clearAll()">Clear All</button>
          <button class="lock-keypad-btn" onclick="autoSessionLock.addNumber('0')">0</button>
          <button class="lock-keypad-btn enter" onclick="autoSessionLock.submitPIN()">Enter</button>
        </div>

        <div class="lock-footer-note">
          <i class="fas fa-info-circle"></i> Enter your ${this.config.pinLength}-digit security PIN
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
  }

  // Load current user session
  loadUserSession() {
    // Try to get user from sessionStorage first, then localStorage
    let user = sessionStorage.getItem('constableCurrentUser');
    if (!user) {
      user = localStorage.getItem('constableCurrentUser');
    }
    
    if (user) {
      this.state.currentUser = JSON.parse(user);
      this.state.currentPIN = localStorage.getItem('security_pin') || '1234'; // Default PIN
      this.state.originalPage = window.location.href;
    }
  }

  // Setup event listeners for user activity
  setupEventListeners() {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, () => {
        if (!this.state.isLocked && !this.state.isLockout) {
          this.resetInactivityTimer();
        }
      });
    });

    // Setup PIN input navigation
    this.setupPINInputNavigation();

    // Prevent context menu and paste
    document.addEventListener('contextmenu', (e) => {
      if (this.state.isLocked) e.preventDefault();
    });

    document.addEventListener('paste', (e) => {
      if (this.state.isLocked) {
        e.preventDefault();
        this.showError('Paste is not allowed');
      }
    });
  }

  // Setup PIN input navigation
  setupPINInputNavigation() {
    this.elements.pinInputs.forEach((input, index) => {
      input.addEventListener('input', (e) => {
        if (e.target.value.length === 1) {
          const nextInput = this.elements.pinInputs[index + 1];
          if (nextInput) {
            nextInput.focus();
          } else {
            // Last input filled, auto-submit
            this.submitPIN();
          }
        }
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && e.target.value === '') {
          const prevInput = this.elements.pinInputs[index - 1];
          if (prevInput) {
            prevInput.focus();
          }
        }
      });
    });
  }

  // Start inactivity timer
  startInactivityTimer() {
    this.stopInactivityTimer();
    this.state.timer = setTimeout(() => {
      this.lockScreen();
    }, this.config.inactivityTimeout);
  }

  // Reset inactivity timer
  resetInactivityTimer() {
    this.startInactivityTimer();
    this.hideLockScreen();
  }

  // Stop inactivity timer
  stopInactivityTimer() {
    if (this.state.timer) {
      clearTimeout(this.state.timer);
      this.state.timer = null;
    }
  }

  // Lock the screen
  lockScreen() {
    if (!this.state.currentUser || this.state.isLocked || this.state.isLockout) {
      return;
    }

    this.state.isLocked = true;
    this.state.attempts = 0;
    
    // Add locked class to body
    document.body.classList.add('locked');
    
    // Show overlay
    this.elements.overlay.classList.add('active');
    
    // Render user info
    this.renderLockScreen();
    
    // Focus first PIN input
    if (this.elements.pinInputs[0]) {
      this.elements.pinInputs[0].focus();
    }
  }

  // Render lock screen with user information
  renderLockScreen() {
    if (!this.state.currentUser) return;

    const user = this.state.currentUser;
    
    // Set user avatar (initials or photo)
    const avatar = this.elements.userAvatar;
    const profilePhoto = localStorage.getItem('constableProfilePhoto');
    
    if (profilePhoto && profilePhoto !== 'https://via.placeholder.com/200x200/1a365d/ffffff?text=Constable') {
      avatar.style.backgroundImage = `url(${profilePhoto})`;
      avatar.style.backgroundSize = 'cover';
      avatar.style.backgroundPosition = 'center';
      avatar.textContent = '';
    } else {
      avatar.textContent = user.fullName.charAt(0).toUpperCase();
      avatar.style.backgroundImage = 'none';
    }
    
    // Set user information
    this.elements.userName.textContent = user.fullName;
    this.elements.userBadge.textContent = `${user.rank} • ${user.badgeId}`;
    
    // Update attempts info
    this.updateAttemptsDisplay();
    
    // Hide countdown initially
    this.elements.countdownContainer.style.display = 'none';
  }

  // Hide lock screen
  hideLockScreen() {
    if (!this.state.isLocked) return;

    this.state.isLocked = false;
    document.body.classList.remove('locked');
    this.elements.overlay.classList.remove('active');
    
    // Clear PIN inputs
    this.clearAll();
    this.hideError();
    this.hideSuccess();
  }

  // Add number to PIN
  addNumber(number) {
    if (!this.state.isLocked || this.state.isLockout) return;

    for (let i = 0; i < this.elements.pinInputs.length; i++) {
      if (this.elements.pinInputs[i].value === '') {
        this.elements.pinInputs[i].value = number;
        this.elements.pinInputs[i].focus();
        break;
      }
    }
  }

  // Clear all PIN inputs
  clearAll() {
    if (!this.state.isLocked) return;

    this.elements.pinInputs.forEach(input => {
      input.value = '';
      input.classList.remove('error');
    });
    
    this.elements.pinInputs[0].focus();
    this.hideError();
    this.hideSuccess();
  }

  // Submit PIN
  submitPIN() {
    if (!this.state.isLocked || this.state.isLockout) return;

    const enteredPIN = Array.from(this.elements.pinInputs).map(input => input.value).join('');

    if (enteredPIN.length !== this.config.pinLength) {
      this.showError('Please enter a complete PIN');
      this.shakePINContainer();
      return;
    }

    if (enteredPIN === this.state.currentPIN) {
      this.unlockScreen();
    } else {
      this.handleFailedAttempt();
    }
  }

  // Handle failed PIN attempt
  handleFailedAttempt() {
    this.state.attempts++;
    this.showError('Invalid Security PIN');
    this.shakePINContainer();
    this.updateAttemptsDisplay();

    if (this.state.attempts >= this.config.maxAttempts) {
      this.lockoutUser();
    } else {
      this.clearAll();
    }
  }

  // Lockout user after too many failed attempts
  lockoutUser() {
    this.state.isLockout = true;
    this.state.isLocked = false;
    
    // Hide PIN section
    this.elements.pinSection.style.display = 'none';
    
    // Show countdown
    this.elements.countdownContainer.style.display = 'block';
    
    let timeLeft = Math.floor(this.config.lockoutDuration / 1000);
    this.elements.countdownTimer.textContent = timeLeft;

    const interval = setInterval(() => {
      timeLeft--;
      this.elements.countdownTimer.textContent = timeLeft;

      if (timeLeft <= 0) {
        clearInterval(interval);
        this.endLockout();
      }
    }, 1000);
  }

  // End lockout period
  endLockout() {
    this.state.isLockout = false;
    this.state.attempts = 0;
    
    // Show PIN section again
    this.elements.pinSection.style.display = 'block';
    this.elements.countdownContainer.style.display = 'none';
    
    // Reset and show lock screen
    this.state.isLocked = true;
    this.elements.overlay.classList.add('active');
    this.renderLockScreen();
    this.updateAttemptsDisplay();
    
    if (this.elements.pinInputs[0]) {
      this.elements.pinInputs[0].focus();
    }
  }

  // Unlock screen successfully
  unlockScreen() {
    this.hideSuccess();
    this.showSuccess('Unlocking...');
    
    // Add success animation
    this.elements.pinContainer.classList.add('success');
    
    setTimeout(() => {
      this.hideLockScreen();
      this.elements.pinContainer.classList.remove('success');
      
      // Reset inactivity timer
      this.startInactivityTimer();
      
      // Show success message briefly
      this.showSuccess('System Unlocked');
      setTimeout(() => {
        this.hideSuccess();
      }, 2000);
    }, 1000);
  }

  // Update attempts display
  updateAttemptsDisplay() {
    const remaining = this.config.maxAttempts - this.state.attempts;
    this.elements.attemptsInfo.textContent = `Attempts remaining: ${remaining}`;
    
    if (remaining <= 1) {
      this.elements.attemptsInfo.classList.add('attempts-warning');
    } else {
      this.elements.attemptsInfo.classList.remove('attempts-warning');
    }
  }

  // Show error message
  showError(message) {
    this.elements.errorMessage.textContent = message;
    this.elements.errorMessage.classList.add('show');
    
    // Add error styling to inputs
    this.elements.pinInputs.forEach(input => {
      input.classList.add('error');
    });
  }

  // Hide error message
  hideError() {
    this.elements.errorMessage.classList.remove('show');
    this.elements.pinInputs.forEach(input => {
      input.classList.remove('error');
    });
  }

  // Show success message
  showSuccess(message) {
    this.elements.successMessage.textContent = message;
    this.elements.successMessage.classList.add('show');
  }

  // Hide success message
  hideSuccess() {
    this.elements.successMessage.classList.remove('show');
  }

  // Shake PIN container for wrong PIN
  shakePINContainer() {
    this.elements.pinContainer.classList.add('shake');
    setTimeout(() => {
      this.elements.pinContainer.classList.remove('shake');
    }, 500);
  }

  // Force lock screen (for manual lock)
  forceLock() {
    this.lockScreen();
  }

  // Logout user (for 3 failed attempts or manual logout)
  logoutUser() {
    // Clear session storage
    sessionStorage.removeItem('constableCurrentUser');
    
    // Redirect to login page
    window.location.href = 'index.html';
  }

  // Destroy the auto-lock system
  destroy() {
    this.stopInactivityTimer();
    document.body.classList.remove('locked');
    if (this.elements.overlay) {
      this.elements.overlay.remove();
    }
  }
}

// Initialize auto-lock system when DOM is loaded
let autoSessionLock;

document.addEventListener('DOMContentLoaded', function() {
  autoSessionLock = new AutoSessionLock({
    inactivityTimeout: 120000, // 2 minutes
    maxAttempts: 3,
    lockoutDuration: 30000, // 30 seconds
    pinLength: 4
  });
});

// Export for global access
window.AutoSessionLock = AutoSessionLock;
window.autoSessionLock = autoSessionLock;