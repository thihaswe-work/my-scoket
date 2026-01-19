// authCheck.js

const storedUser = localStorage.getItem("user");

if (storedUser) {
  // User is logged in, redirect to index.html if on login page
  if (
    window.location.pathname.endsWith("login.html") ||
    window.location.pathname.endsWith("register.html")
  ) {
    window.location.href = "index.html";
  }
} else {
  // User not logged in, redirect to login.html if not already there
  if (!window.location.pathname.endsWith("login.html")) {
    window.location.href = "login.html";
  }
}
