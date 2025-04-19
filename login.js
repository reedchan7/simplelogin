// Login page functionality

document.addEventListener('DOMContentLoaded', function () {
  const loginForm = document.getElementById('loginForm');

  if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();

      // Get form values
      const username = document.getElementById('username').value.trim();
      const password = document.getElementById('password').value.trim();

      // Clear previous errors
      clearError('error-message');

      // Simple validation
      if (!username || !password) {
        showError('error-message', 'Please enter username and password');
        return;
      }

      // Check credentials (hardcoded for this demo)
      if (username === 'test' && password === 'test123') {
        // Store login info in session storage
        sessionStorage.setItem('loggedIn', 'true');
        sessionStorage.setItem('username', username);

        // Redirect to 2FA page
        redirectTo('2fa.html');
      } else {
        showError('error-message', 'Invalid username or password');
      }
    });
  }
});
