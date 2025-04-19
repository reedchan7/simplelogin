// Dashboard page functionality

document.addEventListener('DOMContentLoaded', function () {
  // Check if user is logged in and 2FA verified
  if (!isLoggedIn()) {
    redirectTo('login.html');
    return;
  }

  if (sessionStorage.getItem('2fa_verified') !== 'true') {
    redirectTo('2fa.html');
    return;
  }

  // Update welcome message with username
  const username = sessionStorage.getItem('username') || 'User';
  const welcomeElement = document.getElementById('welcome-user');
  if (welcomeElement) {
    welcomeElement.textContent = `Welcome, ${username}`;
  }

  // Update dashboard username
  const dashboardUsername = document.getElementById('dashboard-username');
  if (dashboardUsername) {
    dashboardUsername.textContent = username;
  }

  // Update last login time
  const lastLogin = document.getElementById('last-login');
  if (lastLogin) {
    const now = new Date();
    lastLogin.textContent = now.toLocaleString('en-US');
  }
});
