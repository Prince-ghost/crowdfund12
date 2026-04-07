/**
 * Scroll-reveal: automatically animates elements into view on scroll.
 * Uses IntersectionObserver for performance.
 *
 * Auto-targets: sections, cards, headings, steps, testimonials,
 * hero stats, form cards, dashboard cards, table rows, etc.
 */
(function () {
  if (window.__ccScrollRevealInit) return;
  window.__ccScrollRevealInit = true;

  // Skip entirely if user prefers reduced motion
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  // Selectors to auto-reveal
  const AUTO_SELECTORS = [
    ".section",
    ".section__head",
    ".card",
    ".campaign-card",
    ".step",
    ".quote",
    ".hero__stats > div",
    ".hero__actions",
    ".hero__badge",
    ".hero__headline",
    ".hero__lead",
    ".page-title",
    ".toolbar",
    ".dash-card",
    ".dash-panel",
    ".dash-charts > div",
    ".userdash-kpis > div",
    ".userdash-panel",
    ".faq-item",
    ".donate-left",
    ".donate-right",
    ".donate-grid",
    ".site-footer",
    ".table-shell",
  ];

  // Direction mapping based on element type
  function pickDirection(el, index) {
    const tag = el.tagName;
    const cls = el.className || "";

    // Hero elements slide down
    if (cls.includes("hero__")) return "scroll-reveal--down";

    // Steps, cards in grids: alternate left/right
    if (cls.includes("step") || cls.includes("quote") || cls.includes("dash-card") || cls.includes("userdash-kpis")) {
      return index % 2 === 0 ? "scroll-reveal--left" : "scroll-reveal--right";
    }

    // Campaign cards: scale in
    if (cls.includes("campaign-card")) return "scroll-reveal--scale";

    // Footer
    if (cls.includes("site-footer")) return "scroll-reveal--up";

    // Default: slide up
    return "scroll-reveal--up";
  }

  function init() {
    // Gather all matching elements
    const elements = document.querySelectorAll(AUTO_SELECTORS.join(", "));

    // Group by parent for stagger
    const parentGroups = new Map();

    elements.forEach((el, i) => {
      // Don't double-animate
      if (el.classList.contains("scroll-reveal")) return;
      // Skip elements that are inside modals or hidden
      if (el.closest(".cc-modal-overlay")) return;

      const direction = pickDirection(el, i);
      el.classList.add("scroll-reveal", direction);

      // Add stagger within same parent
      const parent = el.parentElement;
      if (parent) {
        if (!parentGroups.has(parent)) parentGroups.set(parent, 0);
        const idx = parentGroups.get(parent);
        if (idx > 0 && idx <= 6) {
          el.classList.add("stagger-" + idx);
        }
        parentGroups.set(parent, idx + 1);
      }
    });

    // Set up IntersectionObserver
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target); // Animate only once
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    document.querySelectorAll(".scroll-reveal").forEach((el) => {
      // If already in viewport on load, show immediately
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.85 && rect.bottom > 0) {
        el.classList.add("is-visible");
      } else {
        observer.observe(el);
      }
    });
  }

  // Run after DOM ready + slight delay for dynamic content
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(init, 80));
  } else {
    setTimeout(init, 80);
  }

  // Also re-run after dynamic content loads (e.g., campaigns grid)
  const origFetch = window.fetch;
  let pendingReinit = null;
  window.fetch = function () {
    return origFetch.apply(this, arguments).then((res) => {
      // After API calls finish, re-check for new elements
      clearTimeout(pendingReinit);
      pendingReinit = setTimeout(init, 300);
      return res;
    });
  };
})();
