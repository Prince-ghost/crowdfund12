(function () {
  const THEME_KEY = "cc_theme";

  function getTheme() {
    return localStorage.getItem(THEME_KEY) || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  }

  function setTheme(mode) {
    document.documentElement.setAttribute("data-theme", mode);
    localStorage.setItem(THEME_KEY, mode);
    const btn = document.querySelector("[data-theme-toggle]");
    if (btn) btn.setAttribute("aria-label", mode === "dark" ? "Switch to light mode" : "Switch to dark mode");
  }

  function toggleTheme() {
    const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    setTheme(next);
  }

  function pathName() {
    return window.location.pathname.split("/").pop() || "index.html";
  }

  function markActiveNav() {
    const p = pathName();
    document.querySelectorAll("[data-nav]").forEach((el) => {
      const target = el.getAttribute("href")?.split("/").pop();
      if (target === p) el.classList.add("is-active");
    });
  }

  function isLoggedIn() {
    return !!window.CCApi.getToken();
  }

  function updateAuthLinks() {
    document.querySelectorAll("[data-auth-show]").forEach((el) => {
      el.classList.toggle("hidden", !isLoggedIn());
    });
    document.querySelectorAll("[data-guest-show]").forEach((el) => {
      el.classList.toggle("hidden", isLoggedIn());
    });
  }

  function initShell() {
    markActiveNav();
    updateAuthLinks();
    document.querySelectorAll("[data-theme-toggle]").forEach((b) => b.addEventListener("click", toggleTheme));
    setTheme(getTheme());
  }

  document.addEventListener("DOMContentLoaded", initShell);

  window.CCApp = { getTheme, setTheme, toggleTheme, isLoggedIn, updateAuthLinks, pathName };
})();
