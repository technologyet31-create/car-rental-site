/* admin login page logic */

(function () {
  "use strict";

  const ADMIN_USERNAME = "admin";
  const ADMIN_PASSWORD = "admin123";

  function showError(message) {
    const el = document.getElementById("loginError");
    if (!el) return;
    el.textContent = message;
    el.style.display = message ? "block" : "none";
  }

  document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("adminLoginForm");
    const usernameInput = document.getElementById("adminUsername");
    const passwordInput = document.getElementById("adminPassword");

    if (!form || !usernameInput || !passwordInput) return;

    // If already logged in, go straight to dashboard
    try {
      if (localStorage.getItem("adminLoggedIn") === "1") {
        window.location.href = "admin-dashboard.html";
        return;
      }
    } catch {
      // ignore
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      showError("");

      const username = usernameInput.value.trim();
      const password = passwordInput.value;

      if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        try {
          localStorage.setItem("adminLoggedIn", "1");
        } catch {
          // ignore
        }
        window.location.href = "admin-dashboard.html";
        return;
      }

      showError("بيانات الدخول غير صحيحة.");
      passwordInput.focus();
      passwordInput.select?.();
    });
  });
})();
