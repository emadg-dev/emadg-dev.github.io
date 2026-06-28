// ── AOS (scroll animations) ───────────────────────
AOS.init({ duration: 800, once: true });

// ── Navbar: highlight the active page link ────────
(function () {
  const links = document.querySelectorAll(".nav-link");
  const current = window.location.pathname.split("/").pop() || "index.html";
  links.forEach((link) => {
    if (link.getAttribute("href") === current) {
      link.classList.add("active");
    }
  });
})();

// ── Navbar: mobile hamburger toggle ───────────────
(function () {
  const btn = document.getElementById("nav-toggle");
  const menu = document.getElementById("nav-menu");
  if (!btn || !menu) return;
  btn.addEventListener("click", () => {
    const nowHidden = menu.classList.toggle("hidden");
    btn.setAttribute("aria-expanded", String(!nowHidden));
  });
})();
