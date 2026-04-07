(function () {
  if (window.__ccCursorInit) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!window.matchMedia("(pointer: fine)").matches) return;

  window.__ccCursorInit = true;

  const ring = document.createElement("div");
  ring.className = "cc-cursor-ring";
  ring.setAttribute("aria-hidden", "true");
  const dot = document.createElement("div");
  dot.className = "cc-cursor-dot";
  dot.setAttribute("aria-hidden", "true");
  document.body.appendChild(ring);
  document.body.appendChild(dot);
  document.body.classList.add("cc-cursor-active");

  let mx = window.innerWidth / 2;
  let my = window.innerHeight / 2;
  let rx = mx;
  let ry = my;

  function isInteractive(el) {
    if (!el || el === document.body) return false;
    const tag = el.tagName;
    if (tag === "A" || tag === "BUTTON" || tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || tag === "LABEL") return true;
    if (el.closest("a, button, [role='button'], .btn, input, textarea, select, label, summary")) return true;
    if (el.getAttribute("contenteditable") === "true") return true;
    return false;
  }

  document.addEventListener(
    "mousemove",
    (e) => {
      mx = e.clientX;
      my = e.clientY;
      const hover = isInteractive(e.target);
      ring.classList.toggle("cc-cursor-ring--hover", hover);
      dot.classList.toggle("cc-cursor-dot--hover", hover);
    },
    { passive: true }
  );

  document.addEventListener(
    "mousedown",
    () => {
      ring.classList.add("cc-cursor-ring--press");
      dot.classList.add("cc-cursor-dot--press");
    },
    true
  );
  document.addEventListener(
    "mouseup",
    () => {
      ring.classList.remove("cc-cursor-ring--press");
      dot.classList.remove("cc-cursor-dot--press");
    },
    true
  );

  function tick() {
    rx += (mx - rx) * 0.16;
    ry += (my - ry) * 0.16;
    ring.style.left = rx + "px";
    ring.style.top = ry + "px";
    dot.style.left = mx + "px";
    dot.style.top = my + "px";
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  document.addEventListener("mouseleave", () => {
    ring.style.opacity = "0";
    dot.style.opacity = "0";
  });
  document.addEventListener("mouseenter", () => {
    ring.style.opacity = "1";
    dot.style.opacity = "1";
  });
})();
