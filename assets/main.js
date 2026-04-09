document.addEventListener("DOMContentLoaded", () => {
  initMobileNavigation();
  initDesktopDropdownDismiss();
  initCarousel();
  initInViewVideos();
  initShopConversionFunnel();
  initPreRegistrationMailto();
});

function initMobileNavigation() {
  const toggle = document.querySelector("[data-mobile-toggle]");
  const panel = document.querySelector("[data-mobile-panel]");
  if (!toggle || !panel) return;

  toggle.addEventListener("click", () => {
    const expanded = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!expanded));
    panel.classList.toggle("is-open", !expanded);
  });
}

function initDesktopDropdownDismiss() {
  const desktopDropdowns = document.querySelectorAll(".desktop-nav details.dropdown");
  document.addEventListener("click", (event) => {
    desktopDropdowns.forEach((dropdown) => {
      if (!dropdown.contains(event.target)) {
        dropdown.removeAttribute("open");
      }
    });
  });
}

function initCarousel() {
  const carousels = document.querySelectorAll("[data-carousel]");
  carousels.forEach((carousel) => {
    const slides = Array.from(carousel.querySelectorAll("[data-slide]"));
    if (slides.length <= 1) return;

    const dots = Array.from(carousel.querySelectorAll("[data-carousel-dot]"));
    const prevButton = carousel.querySelector("[data-carousel-prev]");
    const nextButton = carousel.querySelector("[data-carousel-next]");
    const interval = Number.parseInt(carousel.dataset.interval, 10) || 4500;

    let activeIndex = 0;
    let timerId = null;
    let isManuallyPaused = false;

    const setActive = (index) => {
      activeIndex = (index + slides.length) % slides.length;

      slides.forEach((slide, slideIndex) => {
        slide.classList.toggle("is-active", slideIndex === activeIndex);
      });

      dots.forEach((dot, dotIndex) => {
        const isActive = dotIndex === activeIndex;
        dot.classList.toggle("is-active", isActive);
        dot.setAttribute("aria-selected", String(isActive));
        dot.setAttribute("tabindex", isActive ? "0" : "-1");
      });
    };

    const stopAutoRotate = () => {
      if (timerId) {
        window.clearInterval(timerId);
        timerId = null;
      }
    };

    const pauseAutoRotate = () => {
      isManuallyPaused = true;
      stopAutoRotate();
    };

    const startAutoRotate = () => {
      if (isManuallyPaused) return;
      stopAutoRotate();
      timerId = window.setInterval(() => {
        setActive(activeIndex + 1);
      }, interval);
    };

    if (prevButton) {
      prevButton.addEventListener("click", () => {
        setActive(activeIndex - 1);
        pauseAutoRotate();
      });
    }

    if (nextButton) {
      nextButton.addEventListener("click", () => {
        setActive(activeIndex + 1);
        pauseAutoRotate();
      });
    }

    dots.forEach((dot) => {
      dot.addEventListener("click", () => {
        const targetIndex = Number.parseInt(dot.dataset.carouselDot, 10);
        if (!Number.isNaN(targetIndex)) {
          setActive(targetIndex);
          pauseAutoRotate();
        }
      });
    });

    const stage = carousel.querySelector(".edge-carousel-stage");
    if (stage) {
      stage.addEventListener("click", pauseAutoRotate);
    }

    carousel.addEventListener("mouseenter", stopAutoRotate);
    carousel.addEventListener("mouseleave", startAutoRotate);
    carousel.addEventListener("focusin", stopAutoRotate);
    carousel.addEventListener("focusout", (event) => {
      if (!carousel.contains(event.relatedTarget)) {
        startAutoRotate();
      }
    });

    setActive(0);
    startAutoRotate();
  });
}

function initInViewVideos() {
  const videos = Array.from(document.querySelectorAll("video[data-autoplay-inview]"));
  if (!videos.length) return;

  const getPlaybackRate = (video) => {
    const rawRate = Number.parseFloat(video.dataset.playbackRate || "");
    return Number.isFinite(rawRate) && rawRate > 0 ? rawRate : 1;
  };

  const applyPlaybackRate = (video) => {
    const rate = getPlaybackRate(video);
    video.defaultPlaybackRate = rate;
    video.playbackRate = rate;
  };

  const playVideo = (video) => {
    applyPlaybackRate(video);
    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {});
    }
  };

  videos.forEach((video) => {
    video.muted = true;
    video.playsInline = true;
    applyPlaybackRate(video);
    video.addEventListener("loadedmetadata", () => applyPlaybackRate(video));
    video.addEventListener("play", () => applyPlaybackRate(video));
  });

  if (!("IntersectionObserver" in window)) {
    videos.forEach(playVideo);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const video = entry.target;
        if (!(video instanceof HTMLVideoElement)) return;

        if (entry.isIntersecting && entry.intersectionRatio >= 0.35) {
          playVideo(video);
        } else {
          video.pause();
        }
      });
    },
    {
      threshold: [0, 0.35, 0.6],
      rootMargin: "0px 0px -10% 0px"
    }
  );

  videos.forEach((video) => observer.observe(video));
}

function initShopConversionFunnel() {
  const actionButtons = Array.from(document.querySelectorAll("a.cta-button[href]"));
  if (!actionButtons.length) return;

  const pathname = window.location.pathname || "";
  const isShopContext =
    /\/shop\/(?:index\.html)?$/.test(pathname) ||
    /\/shop\/[^/]+\/index\.html$/.test(pathname);
  if (isShopContext) return;

  const shopHref = resolveRelativeShopIndexHref(pathname);

  actionButtons.forEach((buttonLink) => {
    if (buttonLink.hasAttribute("data-no-shop-redirect")) return;

    const href = (buttonLink.getAttribute("href") || "").trim();
    if (!href) return;

    const normalizedHref = href.toLowerCase();
    const hrefWithoutQuery = normalizedHref.split("#")[0].split("?")[0];
    const isDirectDownloadPath =
      normalizedHref.includes("/downloads/") || normalizedHref.includes("downloads/");
    const isDirectDownloadFile = /\.(pdf|csv|txt|zip|gz|tar|tgz|7z|exe|dmg|pkg|msi|deb|rpm|mov|mp4|webm|json)$/i.test(hrefWithoutQuery);
    const explicitDownload = buttonLink.hasAttribute("download");

    if (
      normalizedHref.startsWith("#") ||
      normalizedHref.startsWith("mailto:") ||
      normalizedHref.startsWith("tel:") ||
      normalizedHref.startsWith("javascript:") ||
      isDirectDownloadPath ||
      isDirectDownloadFile ||
      explicitDownload
    ) {
      return;
    }

    buttonLink.setAttribute("href", shopHref);
    buttonLink.removeAttribute("download");
    buttonLink.setAttribute("data-no-prerelease-gate", "true");
  });
}

function resolveRelativeShopIndexHref(pathname) {
  const pathSegments = pathname.split("/").filter(Boolean);
  if (!pathSegments.length) return "shop/index.html";

  const lastSegment = pathSegments[pathSegments.length - 1];
  const hasFileSegment = lastSegment.includes(".");
  const directorySegments = hasFileSegment ? pathSegments.slice(0, -1) : pathSegments;

  const repoRootIndex = directorySegments.indexOf("SF2_Systems_Website");
  if (repoRootIndex >= 0) {
    const depthFromRepoRoot = Math.max(0, directorySegments.length - (repoRootIndex + 1));
    return "../".repeat(depthFromRepoRoot) + "shop/index.html";
  }

  return "../".repeat(directorySegments.length) + "shop/index.html";
}

function initPreRegistrationMailto() {
  const recipient = "licensing@sf2systems.com";
  const transactionalLinks = Array.from(document.querySelectorAll("a[href]")).filter(isTransactionalLink);
  if (!transactionalLinks.length) return;

  transactionalLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const requestedAction = (link.getAttribute("href") || "").trim();
      const page = window.location.pathname || "/";
      const submittedAt = new Date().toISOString();
      const mailtoHref = buildPreRegistrationMailtoHref(recipient, {
        requestedAction: requestedAction,
        page: page,
        submittedAt: submittedAt
      });
      if (!mailtoHref) return;

      event.preventDefault();
      window.location.href = mailtoHref;
    });
  });
}

function buildPreRegistrationMailtoHref(recipient, payload) {
  try {
    const subject = "Bitte um Benachrichtigung zum SF2 Produktstart";
    const body = [
      "Guten Tag SF2-Team,",
      "",
      "bitte informieren Sie mich, sobald das erste Produkt online verfügbar ist.",
      "",
      "Angeforderte Aktion: " + (payload.requestedAction || "n/a"),
      "Seite: " + (payload.page || "/"),
      "Zeitpunkt: " + (payload.submittedAt || new Date().toISOString()),
      "",
      "Meine E-Mail-Adresse:",
      "",
      "Vielen Dank."
    ].join("\n");

    return (
      "mailto:" +
      encodeURIComponent(recipient) +
      "?subject=" +
      encodeURIComponent(subject) +
      "&body=" +
      encodeURIComponent(body)
    );
  } catch (error) {
    return "";
  }
}

function isTransactionalLink(link) {
  if (link.hasAttribute("data-no-prerelease-gate")) return false;

  const href = (link.getAttribute("href") || "").trim();
  if (!href) return false;

  const normalizedHref = href.toLowerCase();

  if (
    normalizedHref.startsWith("#") ||
    normalizedHref.startsWith("mailto:") ||
    normalizedHref.startsWith("tel:") ||
    normalizedHref.startsWith("javascript:")
  ) {
    return false;
  }

  if (link.hasAttribute("data-force-prerelease-gate")) return true;

  const hrefWithoutQuery = normalizedHref.split("#")[0].split("?")[0];
  const label = (link.textContent || "").trim().toLowerCase();

  const isDirectDownloadPath =
    normalizedHref.includes("/downloads/") || normalizedHref.includes("downloads/");
  const isDirectDownloadFile = /\.(pdf|csv|txt|zip|gz|tar|tgz|7z|exe|dmg|pkg|msi|deb|rpm|mov|mp4|webm|json)$/i.test(hrefWithoutQuery);
  const explicitDownload = link.hasAttribute("download");

  if (isDirectDownloadPath || isDirectDownloadFile || explicitDownload) {
    return false;
  }

  const leadsToShopFlow =
    normalizedHref.includes("/shop/") ||
    normalizedHref.endsWith("/shop") ||
    normalizedHref.includes("shop/");

  const hasDownloadIntent = /(download|herunterladen|starter|trial)/i.test(label);

  return leadsToShopFlow && hasDownloadIntent;
}
