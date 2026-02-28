# Auto Session Lock Mechanism

## Overview

The Auto Session Lock Mechanism is a security feature that automatically locks the constable portal after 2 minutes of inactivity. This ensures that sensitive police data remains secure when the user steps away from their device.

## Features

### 🔒 Automatic Locking
- **2-minute inactivity timeout** (configurable)
- **Real-time activity monitoring** (mouse, keyboard, scroll, touch)
- **Blur effect** on background content when locked
- **Secure PIN entry** with visual feedback

### 🛡️ Security Features
- **4-digit PIN verification** (default: 1234)
- **3 failed attempts** trigger 30-second lockout
- **Paste prevention** in PIN fields
- **Context menu disabled** during lock
- **No data loss** - session remains active

### 👤 User Experience
- **Personalized lock screen** with user name and photo
- **Clean, intuitive interface** with keypad input
- **Visual feedback** for correct/incorrect PIN
- **Mobile and desktop compatible**
- **Smooth animations** and transitions

## Technical Implementation

### Files Created/Modified

#### New Files
- `css/auto-lock.css` - Complete styling for lock screen overlay
- `js/auto-lock.js` - Core auto-lock functionality
- `test-auto-lock.html` - Comprehensive testing interface

#### Modified Files
- `dashboard.html` - Added auto-lock CSS and JS
- `profile.html` - Added auto-lock CSS and JS  
- `complaints.html` - Added auto-lock CSS and JS

### Architecture

The system uses a **class-based approach** with the following components:

#### AutoSessionLock Class
```javascript
class AutoSessionLock {
  constructor(options) // Initialize with configuration
  init()              // Setup DOM and event listeners
  lockScreen()        // Trigger lock screen
  unlockScreen()      // Handle successful unlock
  handleFailedAttempt() // Process failed PIN attempts
  // ... other methods
}
```

#### Configuration Options
```javascript
{
  inactivityTimeout: 120000,  // 2 minutes in milliseconds
  maxAttempts: 3,            // Maximum failed attempts
  lockoutDuration: 30000,    // 30 seconds lockout
  pinLength: 4              // PIN length
}
```

### Event Monitoring

The system tracks user activity through these events:
- `mousedown` - Mouse clicks
- `mousemove` - Mouse movement  
- `keypress` - Keyboard input
- `scroll` - Page scrolling
- `touchstart` - Touch interactions
- `click` - General clicks

### State Management

The system maintains these states:
- `isLocked` - Whether screen is currently locked
- `isLockout` - Whether system is in lockout mode
- `attempts` - Failed attempt counter
- `timer` - Inactivity timeout timer
- `currentUser` - Current authenticated user

## Usage

### Basic Integration

1. **Include CSS and JS files:**
```html
<link rel="stylesheet" href="css/auto-lock.css">
<script src="js/auto-lock.js"></script>
```

2. **Initialize on page load:**
```javascript
document.addEventListener('DOMContentLoaded', function() {
  autoSessionLock = new AutoSessionLock({
    inactivityTimeout: 120000, // 2 minutes
    maxAttempts: 3,
    lockoutDuration: 30000,    // 30 seconds
    pinLength: 4
  });
});
```

### API Methods

#### Public Methods
- `forceLock()` - Manually trigger lock screen
- `resetInactivityTimer()` - Reset inactivity timer
- `logoutUser()` - Logout and redirect to login
- `destroy()` - Clean up and remove lock system

#### PIN Handling
- `addNumber(number)` - Add digit to PIN
- `clearAll()` - Clear PIN input
- `submitPIN()` - Submit PIN for verification

### Testing

Use the test page to verify functionality:
```bash
# Open test page
http://localhost:3000/test-auto-lock.html
```

#### Test Scenarios
1. **Normal Usage** - Interact with page elements
2. **Inactivity Lock** - Wait 2 minutes or use "Force Lock"
3. **Failed Attempts** - Enter wrong PIN 3 times
4. **Security Features** - Test paste prevention and context menu

## Security Considerations

### Data Protection
- **No session data loss** during lockout
- **Backend session remains active**
- **Local storage for user data**
- **Secure PIN storage**

### Input Security
- **Paste prevention** in PIN fields
- **Context menu disabled** during lock
- **Input validation** and sanitization
- **No autocomplete** for PIN fields

### Visual Security
- **Blurred background** prevents shoulder surfing
- **Secure PIN display** (masked input)
- **No PIN echo** in error messages
- **Clean lock screen** without sensitive data

## Browser Compatibility

### Supported Browsers
- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+
- ✅ Mobile browsers (iOS/Android)

### CSS Features Used
- `backdrop-filter` - Blur effect (with fallbacks)
- `CSS Grid` - Layout system
- `CSS Variables` - Theme customization
- `Animations` - Smooth transitions

## Performance

### Optimization Features
- **Minimal DOM manipulation**
- **Efficient event delegation**
- **Memory cleanup** on destroy
- **No polling** - event-driven architecture

### Resource Usage
- **CSS file**: ~8KB (minified)
- **JS file**: ~15KB (minified)
- **Memory**: <1MB additional usage
- **CPU**: Minimal impact during normal operation

## Customization

### Styling
Modify `css/auto-lock.css` to customize:
- Color scheme and themes
- Animation timing and effects
- Layout and responsive behavior
- Font and typography

### Configuration
Adjust constructor options for:
- Timeout duration
- PIN length
- Lockout duration
- Maximum attempts

### Branding
Update lock screen elements:
- Logo and icons
- User information display
- Error messages
- Success feedback

## Troubleshooting

### Common Issues

#### Lock Screen Not Appearing
- Check user authentication status
- Verify event listeners are attached
- Ensure CSS is loaded properly

#### PIN Not Working
- Verify PIN is stored correctly
- Check for typos in PIN comparison
- Ensure PIN length matches configuration

#### Timer Not Resetting
- Verify event types are correct
- Check for event propagation issues
- Ensure timer cleanup on destroy

### Debug Mode
Enable debug logging:
```javascript
// Add to constructor options
debug: true
```

### Console Commands
```javascript
// Check system status
autoSessionLock.state

// Force specific states
autoSessionLock.forceLock()
autoSessionLock.resetInactivityTimer()

// Test functionality
autoSessionLock.testEvents()
```

## Future Enhancements

### Potential Improvements
- **Biometric authentication** (fingerprint/face)
- **Push notification** unlock
- **Admin remote unlock**
- **Activity heat mapping**
- **Customizable themes**
- **Accessibility improvements**

### Integration Ideas
- **Two-factor authentication**
- **Location-based security**
- **Device fingerprinting**
- **Behavioral analysis**

## Support

For issues or questions:
1. Check the test page for basic functionality
2. Review browser console for errors
3. Verify file paths and dependencies
4. Test with minimal configuration

## License

This implementation is part of the Personal Constable Portal project.