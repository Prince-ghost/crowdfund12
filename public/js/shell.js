(function () {
  const current = document.body.getAttribute("data-cc-page") || "home";

  function icon(name) {
    const icons = {
      user: '<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/>',
      sun: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"/>',
    };
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="22" height="22" aria-hidden="true">${icons[name] || ""}</svg>`;
  }

  function tabIcon(emoji) {
    return `<span style="font-size:1.35rem;line-height:1" aria-hidden="true">${emoji}</span>`;
  }

  function navClass(page) {
    return page === current ? "is-active" : "";
  }

  const desktop = `
<nav class="desktop-nav" aria-label="Main">
  <a href="/index.html" class="app-bar__brand">Crowd<span>Connect</span></a>
  <div class="desktop-nav__links">
    <a href="/index.html" data-nav class="${current === "home" ? "is-active" : ""}">Home</a>
    <a href="/campaigns.html" data-nav class="${current === "campaigns" ? "is-active" : ""}">Campaigns</a>
    <a href="/donations.html" data-nav class="${current === "donations" ? "is-active" : ""}">Donations</a>
    <a href="/faq.html">FAQ</a>
    <a href="/contact.html">Contact</a>
  </div>
  <div class="flex gap-2 items-center">
    <button type="button" class="icon-btn" data-theme-toggle aria-label="Toggle theme">${icon("sun")}</button>
    <a href="/auth/login.html" class="btn btn--text" data-guest-show>Log in</a>
    <a href="/auth/signup.html" class="btn btn--filled" data-guest-show>Sign up</a>
    <a href="/profile.html" class="btn btn--outlined hidden" data-auth-show>Profile</a>
    <a href="/admin/dashboard.html" class="btn btn--text hidden" data-admin-link>Admin</a>
  </div>
</nav>`;

  const appBar = `
<header class="app-bar">
  <a href="/index.html" class="app-bar__brand">Crowd<span>Connect</span></a>
  <div class="app-bar__actions">
    <button type="button" class="icon-btn" data-theme-toggle aria-label="Toggle theme">${icon("sun")}</button>
    <a href="/auth/login.html" class="icon-btn" data-guest-show aria-label="Account">${icon("user")}</a>
    <a href="/profile.html" class="icon-btn hidden" data-auth-show aria-label="Profile">${icon("user")}</a>
  </div>
</header>`;

  const bottom = `
<nav class="bottom-nav" aria-label="Primary">
  <a href="/index.html" class="${navClass("home")}" data-nav>${tabIcon("🏠")}<span>Home</span></a>
  <a href="/campaigns.html" class="${navClass("campaigns")}" data-nav>${tabIcon("📋")}<span>Campaigns</span></a>
  <a href="/donations.html" class="${navClass("donations")}" data-nav>${tabIcon("❤️")}<span>Donations</span></a>
  <a href="/profile.html" class="${navClass("profile")}" data-nav>${tabIcon("👤")}<span>Profile</span></a>
</nav>`;

  const root = document.getElementById("cc-header-slot");
  if (root) {
    root.innerHTML = desktop + appBar;
  }

  const footSlot = document.getElementById("cc-bottom-slot");
  if (footSlot) {
    footSlot.innerHTML = bottom;
  }

  try {
    const u = JSON.parse(localStorage.getItem("cc_user") || "null");
    if (u && (u.role === "superadmin" || u.role === "moderator")) {
      document.querySelectorAll("[data-admin-link]").forEach((el) => el.classList.remove("hidden"));
    }
  } catch (_) {}

  if (window.CCApp) window.CCApp.updateAuthLinks();
})();
