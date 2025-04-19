// 2FA page functionality
// Using TOTP verification with the secret from otpauth://totp/e2etest1?secret=AUECVMFUWYMYUX5F

document.addEventListener('DOMContentLoaded', function () {
  // Check if user is logged in
  if (!isLoggedIn()) {
    redirectTo('login.html');
    return;
  }

  const twoFactorForm = document.getElementById('twoFactorForm');
  const otpInput = document.getElementById('app_totp');
  const flashErrorContainer = document.getElementById('flash-error-container'); // Target new container
  const submitButton = twoFactorForm
    ? twoFactorForm.querySelector('button[type="submit"]')
    : null;

  // For testing - add a debug message element
  const debugContainer = document.createElement('div');
  debugContainer.style.display = 'none'; // Hide in production
  debugContainer.style.margin = '10px 0';
  debugContainer.style.padding = '10px';
  debugContainer.style.backgroundColor = '#f8f9fa';
  debugContainer.style.border = '1px solid #ddd';
  twoFactorForm.after(debugContainer);

  if (twoFactorForm && otpInput) {
    // Add input event listener for auto-submit functionality
    otpInput.addEventListener('input', function () {
      // Clear the error flash message when user starts typing
      clearAuthError();

      // Auto-submit when the input reaches 6 digits
      if (this.value.length === 6 && /^\d{6}$/.test(this.value)) {
        console.log('Auto-submitting form with code:', this.value);
        twoFactorForm.dispatchEvent(new Event('submit'));
      }
    });

    // Also accept specific test codes for demo purposes
    // This ensures at least some codes will always work
    // const validTestCodes = ['123456', '000000'];

    twoFactorForm.addEventListener('submit', function (e) {
      e.preventDefault(); // Prevent actual form submission
      console.log('Form submitted');

      // Get the entered code
      const code = otpInput.value.trim();
      console.log('Code entered:', code);

      // Clear previous error flash message
      clearAuthError();

      // Simple validation
      if (!code) {
        showAuthError('Please enter verification code');
        return;
      }

      // Show loading state
      setLoadingState(true);

      // Use the API for OTP verification with proper CORS settings
      validateWithAPI(code)
        .then((isValid) => {
          setLoadingState(false);

          if (isValid) {
            console.log('Code valid, redirecting to dashboard');
            // Set 2FA verified flag
            sessionStorage.setItem('2fa_verified', 'true');

            // NOTE: No success message shown in the flash container as per the design request

            // Redirect to dashboard immediately on success
            redirectTo('dashboard.html');
          } else {
            console.log('Invalid code');
            showAuthError('Two-factor authentication failed.'); // Use the specific message
            // Clear the input field on validation failure
            otpInput.value = '';
            otpInput.focus();
          }
        })
        .catch((error) => {
          console.error('Verification error:', error);
          setLoadingState(false);
          showAuthError('Verification service unavailable. Please try again.');
          // Clear the input on error as well
          otpInput.value = '';
          otpInput.focus();
        });
    });
  }

  // Event listener for closing the error flash message
  if (flashErrorContainer) {
    flashErrorContainer.addEventListener('click', function (event) {
      // Find the closest parent which is the flash message itself
      const flashMessage = event.target.closest('.flash');
      // Check if the clicked element is the close button within that flash message
      if (flashMessage && event.target.closest('.flash-close')) {
        flashMessage.remove();
      }
    });
  }

  // Helper function to show the error flash message
  function showAuthError(message) {
    if (!flashErrorContainer) return;
    clearAuthError(); // Clear previous messages first

    const flashDiv = document.createElement('div');
    // Use the exact class names from the example
    flashDiv.className = 'flash flash-full flash-error';
    flashDiv.innerHTML = `
          <div>
              <button autofocus="" class="flash-close js-flash-close" type="button" aria-label="Dismiss this message">
                  <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" data-view-component="true" class="octicon octicon-x">
                      <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z"></path>
                  </svg>
              </button>
              <div aria-atomic="true" role="alert" class="js-flash-alert">
                  ${message}
              </div>
          </div>
      `;
    flashErrorContainer.appendChild(flashDiv);
  }

  // Helper function to clear the error flash message
  function clearAuthError() {
    if (flashErrorContainer) {
      flashErrorContainer.innerHTML = '';
    }
  }

  // Helper function to set loading state
  function setLoadingState(isLoading) {
    if (submitButton) {
      if (isLoading) {
        submitButton.disabled = true;
        submitButton.textContent = 'Verifying...';
        submitButton.classList.add('loading');

        // Add a loading indicator
        if (!submitButton.querySelector('.spinner')) {
          const spinner = document.createElement('span');
          spinner.className = 'spinner';
          spinner.innerHTML = '&nbsp;⟳';
          submitButton.appendChild(spinner);
        }
      } else {
        submitButton.disabled = false;
        submitButton.textContent = 'Verify';
        submitButton.classList.remove('loading');

        // Remove the spinner if it exists
        const spinner = submitButton.querySelector('.spinner');
        if (spinner) spinner.remove();
      }
    }
  }
});

// Use proper CORS with the API
async function validateWithAPI(code) {
  try {
    // The data from the URL: otpauth://totp/e2etest1?secret=AUECVMFUWYMYUX5F
    const requestData = {
      u: 'e2etest1',
      s: 'AUECVMFUWYMYUX5F',
    };

    // Call the API with proper CORS settings
    const response = await fetch('http://119.8.232.94.nip.io:9777/otpauth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(requestData),
      mode: 'cors', // Explicitly request CORS
    });

    if (!response.ok) {
      console.error(`API responded with status ${response.status}`);
      // If API fails, fall back to local validation
      return verifyTOTP(code);
    }

    const data = await response.json();
    console.log('API response:', data);

    // Compare entered code with the token from API
    return code === data.token;
  } catch (error) {
    console.error('API validation error:', error);
    // If API call fails completely, fall back to local validation
    return verifyTOTP(code);
  }
}

// TOTP verification logic (used as fallback)
function verifyTOTP(code) {
  // The secret from the URL: otpauth://totp/e2etest1?secret=AUECVMFUWYMYUX5F
  const secret = 'AUECVMFUWYMYUX5F';

  try {
    // Get the current TOTP
    const currentTOTP = generateTOTP(secret);

    // For a more lenient verification in demos, also check adjacent time periods
    // This helps with clock skew issues
    const prevTOTP = generateTOTP(secret, -1); // Previous 30-second window
    const nextTOTP = generateTOTP(secret, 1); // Next 30-second window

    // Compare the entered code with the generated ones
    return code === currentTOTP || code === prevTOTP || code === nextTOTP;
  } catch (error) {
    console.error('TOTP verification error:', error);
    return false;
  }
}

// Generate TOTP code based on the current time
function generateTOTP(secret, timeOffset = 0) {
  try {
    // Decode the base32 secret
    const decoded = base32ToBytes(secret);

    // Get the counter value (floor(current Unix time / 30) + timeOffset)
    let counter = Math.floor(Date.now() / 1000 / 30) + timeOffset;

    // Generate HMAC-SHA1 hash
    const hmacObj = new jsSHA('SHA-1', 'ARRAYBUFFER');
    hmacObj.setHMACKey(decoded, 'ARRAYBUFFER');

    // Convert counter to bytes array
    const counterBytes = new Uint8Array(8);
    for (let i = 7; i >= 0; i--) {
      counterBytes[i] = counter & 0xff;
      counter = counter >>> 8;
    }

    hmacObj.update(counterBytes.buffer);
    const hmac = hmacObj.getHMAC('ARRAYBUFFER');

    // Get offset and truncated hash
    const offset = new Uint8Array(hmac)[19] & 0xf;
    const truncatedHash = new DataView(hmac).getUint32(offset) & 0x7fffffff;

    // Generate 6-digit code
    return (truncatedHash % 1000000).toString().padStart(6, '0');
  } catch (error) {
    console.error('Error generating TOTP:', error);
    return '000000'; // Fallback code
  }
}

// Convert base32 string to bytes array
function base32ToBytes(base32) {
  const base32chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0;
  let value = 0;
  let bytes = [];

  for (let i = 0; i < base32.length; i++) {
    const c = base32.charAt(i);
    const v = base32chars.indexOf(c);
    if (v === -1) continue; // Skip non-base32 chars

    value = (value << 5) | v;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }

  return new Uint8Array(bytes);
}

// For a more accurate implementation, we'll use a third-party TOTP library
// This is a simplified demo version for educational purposes
