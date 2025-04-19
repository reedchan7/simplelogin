// Common functions and utilities

// Check if user is logged in
function isLoggedIn() {
  return sessionStorage.getItem('loggedIn') === 'true';
}

// Redirect to another page
function redirectTo(page) {
  window.location.href = page;
}

// Display error message
function showError(elementId, message) {
  const errorElement = document.getElementById(elementId);
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
  }
}

// Clear error message
function clearError(elementId) {
  const errorElement = document.getElementById(elementId);
  if (errorElement) {
    errorElement.textContent = '';
    errorElement.style.display = 'none';
  }
}

// Logout functionality
document.addEventListener('DOMContentLoaded', function () {
  const logoutBtn = document.getElementById('logout-btn');

  if (logoutBtn) {
    logoutBtn.addEventListener('click', function (e) {
      e.preventDefault();

      // Clear session data
      sessionStorage.removeItem('loggedIn');
      sessionStorage.removeItem('username');

      // Redirect to login page
      redirectTo('index.html');
    });
  }

  // Redirect from protected pages if not logged in
  const currentPage = window.location.pathname.split('/').pop();

  if (currentPage === 'dashboard.html' && !isLoggedIn()) {
    redirectTo('login.html');
  }
});
