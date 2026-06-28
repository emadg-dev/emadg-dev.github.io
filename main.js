// ── Page loader ────────────────────────────────
(function () {
  const loader = document.getElementById("page-loader");
  if (!loader) return;

  function dismiss() {
    loader.classList.add("fade-out");
    // Remove from DOM after transition so it doesn't block interaction
    setTimeout(() => loader.remove(), 600);
  }

  // Dismiss as soon as all resources (images, fonts, scripts) are done
  if (document.readyState === "complete") {
    dismiss();
  } else {
    window.addEventListener("load", dismiss, { once: true });
  }

  // Hard timeout – never block the page for more than 5 s
  setTimeout(dismiss, 5000);
})();

// ── Service Worker (PWA) ────────────────────────
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .catch((err) => console.warn("SW registration failed:", err));
  });
}

// ── AOS (scroll animations) ───────────────────────
AOS.init({ duration: 800, once: true });

// ── Navbar: highlight the active page link ────────
(function () {
  const links = document.querySelectorAll(".nav-link");
  const current = window.location.pathname.split("/").pop() || "index.html";
  links.forEach((link) => {
    if (link.getAttribute("href") === current) link.classList.add("active");
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

// ── Liquid-glass nav button tilt ──────────────────
(function () {
  const TILT = 14;
  const LIFT = 1.06;
  const SPRING = "transform 0.15s cubic-bezier(0.23, 1, 0.32, 1)";
  const RESET = "transform 0.35s cubic-bezier(0.23, 1, 0.32, 1)";

  document.querySelectorAll(".nav-link").forEach((btn) => {
    btn.addEventListener("mousemove", (e) => {
      const r = btn.getBoundingClientRect();
      const rX = ((e.clientY - r.top - r.height / 2) / (r.height / 2)) * -TILT;
      const rY = ((e.clientX - r.left - r.width / 2) / (r.width / 2)) * TILT;
      btn.style.transition = SPRING;
      btn.style.transform = `perspective(500px) rotateX(${rX}deg) rotateY(${rY}deg) scale(${LIFT})`;
    });
    btn.addEventListener("mouseleave", () => {
      btn.style.transition = RESET;
      btn.style.transform = "";
    });
    btn.addEventListener("mousedown", () => {
      btn.style.transition = "transform 0.08s ease";
      btn.style.transform = "perspective(500px) scale(0.94) translateY(2px)";
    });
    btn.addEventListener("mouseup", (e) => {
      const r = btn.getBoundingClientRect();
      const rX = ((e.clientY - r.top - r.height / 2) / (r.height / 2)) * -TILT;
      const rY = ((e.clientX - r.left - r.width / 2) / (r.width / 2)) * TILT;
      btn.style.transition = SPRING;
      btn.style.transform = `perspective(500px) rotateX(${rX}deg) rotateY(${rY}deg) scale(${LIFT})`;
    });
  });
})();

// ── Contact popups ────────────────────────────────
(function () {
  // True for phones/tablets that handle tel: natively
  function isMobileDevice() {
    return (
      /Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(
        navigator.userAgent,
      ) || window.matchMedia("(pointer: coarse)").matches
    );
  }

  // All active popup instances — so we can close others when one opens
  const allPopups = [];

  function closeAll() {
    allPopups.forEach((p) => p.close());
  }

  // Generic popup factory
  function createPopup(cfg) {
    const link = document.getElementById(cfg.linkId);
    const popup = document.getElementById(cfg.popupId);
    const arrow = document.getElementById(cfg.arrowId);
    const copyBtn = document.getElementById(cfg.copyBtnId);
    if (!link || !popup) return null;

    function position() {
      const ar = link.getBoundingClientRect();
      const pw = popup.offsetWidth;
      const ph = popup.offsetHeight;
      const GAP = 10;

      // Horizontal: centre over anchor, clamped to viewport edges
      let left = ar.left + ar.width / 2 - pw / 2;
      left = Math.max(8, Math.min(left, window.innerWidth - pw - 8));
      popup.style.left = left + "px";

      // Point the arrow at the anchor regardless of popup shift
      if (arrow) arrow.style.left = ar.left + ar.width / 2 - left + "px";

      // Prefer above, fall back to below
      if (ar.top - ph - GAP >= 8) {
        popup.style.top = ar.top - ph - GAP + "px";
        popup.classList.remove("arrow-up");
      } else {
        popup.style.top = ar.bottom + GAP + "px";
        popup.classList.add("arrow-up");
      }
    }

    function open() {
      closeAll(); // close every other popup first
      popup.removeAttribute("hidden");
      requestAnimationFrame(position); // measure after display
    }

    function close() {
      popup.setAttribute("hidden", "");
      popup.classList.remove("arrow-up");
      if (copyBtn) resetCopy();
    }

    function resetCopy() {
      copyBtn.classList.remove("copied");
      const span = copyBtn.querySelector("span");
      if (span) span.textContent = cfg.copyLabel || "Copy";
    }

    // Anchor click
    link.addEventListener("click", (e) => {
      // On a real phone, let tel: work natively; everything else gets a popup
      if (cfg.nativeOnMobile && isMobileDevice()) return;
      e.preventDefault();
      popup.hasAttribute("hidden") ? open() : close();
    });

    // Copy button
    if (copyBtn) {
      copyBtn.addEventListener("click", () => {
        navigator.clipboard.writeText(cfg.copyValue).then(() => {
          copyBtn.classList.add("copied");
          const span = copyBtn.querySelector("span");
          if (span) span.textContent = "Copied!";
          setTimeout(resetCopy, 2000);
        });
      });
    }

    // Close on outside click or Escape (registered once per popup)
    document.addEventListener("click", (e) => {
      if (
        !popup.hasAttribute("hidden") &&
        !popup.contains(e.target) &&
        e.target !== link
      )
        close();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });

    return { open, close };
  }

  // ── Register all four contact popups ─────────────

  allPopups.push(
    createPopup({
      linkId: "phone-link",
      popupId: "phone-popup",
      arrowId: "phone-popup-arrow",
      copyBtnId: "phone-copy-btn",
      copyValue: "09214113572",
      copyLabel: "Copy",
      nativeOnMobile: true, // let the phone dial directly
    }),
  );

  allPopups.push(
    createPopup({
      linkId: "email-link",
      popupId: "email-popup",
      arrowId: "email-popup-arrow",
      copyBtnId: "email-copy-btn",
      copyValue: "Ghosi.Emad@Gmail.com",
      copyLabel: "Copy",
      nativeOnMobile: false,
    }),
  );

  allPopups.push(
    createPopup({
      linkId: "linkedin-link",
      popupId: "linkedin-popup",
      arrowId: "linkedin-popup-arrow",
      copyBtnId: "linkedin-copy-btn",
      copyValue: "https://www.linkedin.com/in/emad-ghosi-a16a78254/",
      copyLabel: "Copy",
      nativeOnMobile: false,
    }),
  );

  allPopups.push(
    createPopup({
      linkId: "github-link",
      popupId: "github-popup",
      arrowId: "github-popup-arrow",
      copyBtnId: "github-copy-btn",
      copyValue: "https://github.com/Emadg-dev",
      copyLabel: "Copy",
      nativeOnMobile: false,
    }),
  );
})();
