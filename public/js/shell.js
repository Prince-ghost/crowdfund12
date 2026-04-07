(function () {
  const current = document.body.getAttribute("data-cc-page") || "home";

  const heartSvg = `<svg class="brand-heart" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill="var(--md-sys-color-primary)"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`;

  function icon(name) {
    const icons = {
      user: '<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/>',
      sun: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"/>',
      moon: '<path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"/>',
    };
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="22" height="22" aria-hidden="true">${icons[name] || ""}</svg>`;
  }

  function tabIcon(emoji) {
    return `<span style="font-size:1.35rem;line-height:1" aria-hidden="true">${emoji}</span>`;
  }

  function navClass(page) {
    return page === current ? "is-active" : "";
  }

  const themeBtn = `<button type="button" class="icon-btn icon-btn--theme" data-theme-toggle aria-label="Toggle theme">${icon("moon")}</button>`;

  const desktop = `
<nav class="desktop-nav" aria-label="Main">
  <a href="/index.html" class="desktop-nav__brand app-bar__brand">${heartSvg} Crowd<span>Connect</span></a>
  <div class="desktop-nav__links">
    <a href="/campaigns.html" data-nav class="${current === "campaigns" ? "is-active" : ""}">Campaigns</a>
    <a href="/index.html#how">How it works</a>
    <a href="/faq.html">FAQ</a>
    <a href="/contact.html">Contact</a>
  </div>
  <div class="desktop-nav__right">
    ${themeBtn}
    <div class="nav-user hidden cc-profile-root" data-auth-show>
      <button
        type="button"
        class="nav-user__pill nav-user__pill--btn"
        aria-haspopup="menu"
        aria-expanded="false"
        id="cc-profile-btn-desktop"
        data-cc-profile-btn-desktop
      >
        <span class="nav-user__avatar" id="nav-user-initial">P</span>
        <span class="nav-user__name" id="nav-user-name">Account</span>
        <span class="cc-caret" aria-hidden="true">▾</span>
      </button>

      <div class="cc-profile-menu hidden" id="cc-profile-menu-desktop" role="menu" aria-label="Profile menu">
        <a href="/dashboard.html" role="menuitem">Dashboard</a>
        <a href="/admin/dashboard.html" role="menuitem" id="cc-admin-menu-desktop">Admin Panel</a>
        <button type="button" role="menuitem" id="cc-logout-btn-desktop" class="cc-profile-logout">Logout</button>
      </div>
    </div>
    <a href="/auth/login.html" class="btn btn--text" data-guest-show>Log in</a>
    <a href="/auth/signup.html" class="btn btn--filled btn--nav-cta" data-guest-show>Sign up</a>
  </div>
</nav>`;

  const appBar = `
<header class="app-bar">
  <a href="/index.html" class="app-bar__brand">${heartSvg} Crowd<span>Connect</span></a>
  <div class="app-bar__actions">
    ${themeBtn}
    <a href="/auth/login.html" class="icon-btn" data-guest-show aria-label="Account">${icon("user")}</a>
    <div class="cc-profile-root hidden" data-auth-show>
      <button type="button" class="icon-btn" data-cc-profile-btn-mobile aria-label="Profile" id="cc-profile-btn-mobile">
        ${icon("user")}
      </button>
      <div class="cc-profile-menu hidden" id="cc-profile-menu-mobile" role="menu" aria-label="Profile menu">
        <a href="/dashboard.html" role="menuitem">Dashboard</a>
        <a href="/admin/dashboard.html" role="menuitem" id="cc-admin-menu-mobile">Admin Panel</a>
        <button type="button" role="menuitem" id="cc-logout-btn-mobile" class="cc-profile-logout">Logout</button>
      </div>
    </div>
  </div>
</header>`;

  const bottom = `
<nav class="bottom-nav" aria-label="Primary">
  <a href="/index.html" class="${navClass("home")}" data-nav>${tabIcon("🏠")}<span>Home</span></a>
  <a href="/campaigns.html" class="${navClass("campaigns")}" data-nav>${tabIcon("📋")}<span>Campaigns</span></a>
  <a href="/donations.html" class="${navClass("donations")}" data-nav>${tabIcon("❤️")}<span>Donations</span></a>
  <a href="/profile.html" class="${navClass("profile")}" data-nav data-cc-profile-open-mobile>${tabIcon("👤")}<span>Profile</span></a>
</nav>`;

  const root = document.getElementById("cc-header-slot");
  if (root) {
    root.innerHTML = desktop + appBar;
  }

  const footSlot = document.getElementById("cc-bottom-slot");
  if (footSlot) {
    footSlot.innerHTML = bottom;
  }

  if (window.CCApp) {
    window.CCApp.updateAuthLinks();
    window.CCApp.updateNavUser();
  }

  // Admin Panel option is visible in profile menu for logged-in users.

  const menuState = {
    desktop: null,
    mobile: null,
  };

  function closeMenus() {
    ["desktop", "mobile"].forEach((k) => {
      const el = k === "desktop" ? document.getElementById("cc-profile-menu-desktop") : document.getElementById("cc-profile-menu-mobile");
      if (el) el.classList.add("hidden");
    });
  }

  function toggleMenu(which) {
    const btn = which === "desktop" ? document.getElementById("cc-profile-btn-desktop") : document.getElementById("cc-profile-btn-mobile");
    const menu = which === "desktop" ? document.getElementById("cc-profile-menu-desktop") : document.getElementById("cc-profile-menu-mobile");
    if (!btn || !menu) return;
    const isOpen = !menu.classList.contains("hidden");
    closeMenus();
    if (!isOpen) menu.classList.remove("hidden");
    btn.setAttribute("aria-expanded", String(!isOpen));
  }

  document.querySelectorAll("[data-cc-profile-btn-desktop]").forEach((b) => {
    b.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleMenu("desktop");
    });
  });
  document.querySelectorAll("[data-cc-profile-btn-mobile]").forEach((b) => {
    b.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleMenu("mobile");
    });
  });

  // Bottom profile tap on mobile: open dropdown instead of navigation
  document.querySelectorAll("[data-cc-profile-open-mobile]").forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      toggleMenu("mobile");
    });
  });

  // Click outside closes menus
  document.addEventListener("click", () => closeMenus());

  // Logout buttons
  function doLogout() {
    try {
      if (window.CCApi) window.CCApi.setToken(null);
    } catch (_) {}
    localStorage.removeItem("cc_user");
    closeMenus();
    location.href = "/index.html";
  }
  const lo1 = document.getElementById("cc-logout-btn-desktop");
  const lo2 = document.getElementById("cc-logout-btn-mobile");
  if (lo1) lo1.addEventListener("click", doLogout);
  if (lo2) lo2.addEventListener("click", doLogout);

  if (!window.__ccCursorScript) {
    window.__ccCursorScript = true;
    const s = document.createElement("script");
    s.src = "/js/cursor.js";
    s.defer = true;
    document.body.appendChild(s);
  }

  if (!window.__ccScrollRevealScript) {
    window.__ccScrollRevealScript = true;
    const sr = document.createElement("script");
    sr.src = "/js/scroll-reveal.js";
    sr.defer = true;
    document.body.appendChild(sr);
  }
})();
