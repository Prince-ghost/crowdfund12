(function () {
  const THEME_KEY = "cc_theme";

  const ICON_SUN =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="22" height="22" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"/></svg>';
  const ICON_MOON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="22" height="22" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"/></svg>';

  function getTheme() {
    return localStorage.getItem(THEME_KEY) || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  }

  function syncThemeIcons() {
    const mode = document.documentElement.getAttribute("data-theme") || "light";
    document.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
      btn.innerHTML = mode === "dark" ? ICON_SUN : ICON_MOON;
      btn.setAttribute("aria-label", mode === "dark" ? "Switch to light mode" : "Switch to dark mode");
    });
  }

  function setTheme(mode) {
    document.documentElement.setAttribute("data-theme", mode);
    localStorage.setItem(THEME_KEY, mode);
    syncThemeIcons();
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

  function updateNavUser() {
    try {
      const u = JSON.parse(localStorage.getItem("cc_user") || "null");
      const initial = document.getElementById("nav-user-initial");
      const nm = document.getElementById("nav-user-name");
      if (u && u.name) {
        if (initial) initial.textContent = u.name.charAt(0).toUpperCase();
        if (nm) nm.textContent = u.name.split(/\s+/)[0];
      }
    } catch (_) {}
  }

  function initShell() {
    markActiveNav();
    updateAuthLinks();
    updateNavUser();
    document.querySelectorAll("[data-theme-toggle]").forEach((b) => b.addEventListener("click", toggleTheme));
    setTheme(getTheme());
  }

  document.addEventListener("DOMContentLoaded", initShell);

  window.CCApp = {
    getTheme,
    setTheme,
    toggleTheme,
    isLoggedIn,
    updateAuthLinks,
    updateNavUser,
    syncThemeIcons,
    pathName,
  };
})();
