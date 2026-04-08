document.addEventListener("DOMContentLoaded", () => {
  initHeaderLogoBand();
  initMobileNavigation();
  initDesktopDropdownDismiss();
  initCarousel();
  initInViewVideos();
  initShopConversionFunnel();
  initPreReleaseGate();
});

function initHeaderLogoBand() {
  const header = document.querySelector(".site-header");
  if (!header) return;

  const brand = header.querySelector(".brand");
  if (!brand) return;

  const updateHeaderWhiteZone = () => {
    const desktopNav = header.querySelector(".desktop-nav");
    const navVisible =
      desktopNav &&
      window.getComputedStyle(desktopNav).display !== "none" &&
      desktopNav.getBoundingClientRect().width > 0;

    const brandRect = brand.getBoundingClientRect();
    let rightEdge = brandRect.right + 12;

    if (navVisible) {
      const navRect = desktopNav.getBoundingClientRect();
      rightEdge = navRect.left;
    }

    const minRightEdge = brandRect.right + 8;
    const safeRightEdge = Math.max(minRightEdge, rightEdge);
    const expandedRightEdge = Math.min(window.innerWidth, safeRightEdge * 1.2);
    header.style.setProperty("--header-white-width", Math.round(expandedRightEdge) + "px");
  };

  updateHeaderWhiteZone();
  window.addEventListener("resize", updateHeaderWhiteZone, { passive: true });
}

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
    const href = (buttonLink.getAttribute("href") || "").trim();
    if (!href) return;

    const normalizedHref = href.toLowerCase();
    if (
      normalizedHref.startsWith("#") ||
      normalizedHref.startsWith("mailto:") ||
      normalizedHref.startsWith("tel:") ||
      normalizedHref.startsWith("javascript:")
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

function initPreReleaseGate() {
  const waitlistStorageKey = "sf2_prerelease_waitlist_v1";
  const preRegistrationRecipient = "pre-registration@sf2systems.com";
  const transactionalLinks = Array.from(document.querySelectorAll("a[href]")).filter(isTransactionalLink);
  if (!transactionalLinks.length) return;

  const modal = buildPreReleaseModal();
  const backdrop = modal.backdrop;
  const closeButton = modal.closeButton;
  const cancelButton = modal.cancelButton;
  const form = modal.form;
  const emailInput = modal.emailInput;
  const statusMessage = modal.statusMessage;
  const actionHint = modal.actionHint;
  const submitButton = modal.submitButton;

  let activeTrigger = null;
  let requestedTarget = "";
  let originPageUrl = "";

  const openModal = (triggerElement, targetHref) => {
    activeTrigger = triggerElement;
    requestedTarget = targetHref || "";
    originPageUrl = window.location.href;

    statusMessage.textContent = "";
    statusMessage.classList.remove("is-error", "is-success");
    actionHint.textContent = requestedTarget ? "Requested action: " + requestedTarget : "";

    backdrop.hidden = false;
    document.body.classList.add("prerelease-modal-open");
    window.setTimeout(() => emailInput.focus(), 0);
  };

  const closeModal = () => {
    backdrop.hidden = true;
    document.body.classList.remove("prerelease-modal-open");
    const returnUrl = originPageUrl;
    if (activeTrigger) {
      activeTrigger.focus();
    }
    activeTrigger = null;
    originPageUrl = "";
    if (returnUrl && window.location.href !== returnUrl) {
      window.location.href = returnUrl;
      return;
    }
  };

  const showStatus = (message, statusType) => {
    statusMessage.textContent = message;
    statusMessage.classList.remove("is-error", "is-success");
    statusMessage.classList.add(statusType === "error" ? "is-error" : "is-success");
  };

  transactionalLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      event.preventDefault();
      openModal(link, link.getAttribute("href"));
    });
  });

  closeButton.addEventListener("click", closeModal);
  cancelButton.addEventListener("click", closeModal);

  backdrop.addEventListener("click", (event) => {
    if (event.target === backdrop) {
      closeModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !backdrop.hidden) {
      closeModal();
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = emailInput.value.trim().toLowerCase();
    if (!isValidEmail(email)) {
      showStatus("Please enter a valid email address.", "error");
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Saving...";

    const payload = {
      email: email,
      page: window.location.pathname,
      requestedAction: requestedTarget,
      submittedAt: new Date().toISOString()
    };

    let submitted = false;
    let usedRemoteEndpoint = false;
    let openedMailClient = false;

    const endpoint =
      typeof window.SF2_PRERELEASE_ENDPOINT === "string"
        ? window.SF2_PRERELEASE_ENDPOINT.trim()
        : "";

    if (endpoint) {
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });
        if (response.ok) {
          submitted = true;
          usedRemoteEndpoint = true;
        }
      } catch (error) {
        submitted = false;
      }
    }

    if (!submitted) {
      openedMailClient = openPreRegistrationMail(preRegistrationRecipient, payload);
      submitted = openedMailClient || saveWaitlistEntryLocally(payload);
    }

    submitButton.disabled = false;
    submitButton.textContent = "Notify me";

    if (!submitted) {
      showStatus("Your email could not be saved in this browser. Please try again.", "error");
      return;
    }

    form.reset();
    if (usedRemoteEndpoint) {
      showStatus("Thanks. Your email was submitted for pre-release updates.", "success");
    } else if (openedMailClient) {
      showStatus("Your mail app opened with a pre-filled email to pre-registration@sf2systems.com. Please press Send.", "success");
    } else {
      showStatus("Email draft could not be opened. Please send your request to pre-registration@sf2systems.com.", "error");
    }
    window.setTimeout(closeModal, 900);
  });

  function openPreRegistrationMail(recipient, payload) {
    try {
      const subject = encodeURIComponent("SF2 Pre-Registration");
      const body = encodeURIComponent(
        [
          "Please add me to the SF2 pre-release waitlist.",
          "",
          "Email: " + payload.email,
          "Requested action: " + (payload.requestedAction || "n/a"),
          "Page: " + payload.page,
          "Submitted at: " + payload.submittedAt,
          "",
          "(Generated from the SF2 Systems pre-release popup.)"
        ].join("\n")
      );

      window.location.href = "mailto:" + recipient + "?subject=" + subject + "&body=" + body;
      return true;
    } catch (error) {
      return false;
    }
  }

  function saveWaitlistEntryLocally(payload) {
    try {
      const existing = safeReadJSON(waitlistStorageKey);
      const entries = Array.isArray(existing) ? existing : [];
      if (!entries.some((entry) => entry && entry.email === payload.email)) {
        entries.push(payload);
      }
      localStorage.setItem(waitlistStorageKey, JSON.stringify(entries));
      return true;
    } catch (error) {
      return false;
    }
  }

  function safeReadJSON(storageKey) {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch (error) {
      return [];
    }
  }

  document.body.appendChild(backdrop);
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

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function buildPreReleaseModal() {
  const backdrop = document.createElement("div");
  backdrop.className = "prerelease-backdrop";
  backdrop.hidden = true;
  backdrop.innerHTML =
    '<section class="prerelease-modal" role="dialog" aria-modal="true" aria-labelledby="prerelease-title">' +
      '<button class="prerelease-close" type="button" aria-label="Close">&times;</button>' +
      '<h2 id="prerelease-title">Pre-release access</h2>' +
      '<p class="prerelease-text">SF2 Systems is currently in pre-release. Enter your email and we will prepare a message to pre-registration@sf2systems.com.</p>' +
      '<p class="prerelease-action" data-prerelease-action></p>' +
      '<form class="prerelease-form" data-prerelease-form>' +
        '<label for="prerelease-email">Work email</label>' +
        '<input id="prerelease-email" class="prerelease-input" type="email" required autocomplete="email" placeholder="you@company.com" />' +
        '<div class="prerelease-actions">' +
          '<button class="cta-button primary" type="submit" data-prerelease-submit>Notify me</button>' +
          '<button class="cta-button secondary" type="button" data-prerelease-cancel>Cancel</button>' +
        "</div>" +
        '<p class="prerelease-status" data-prerelease-status aria-live="polite"></p>' +
      "</form>" +
    "</section>";

  return {
    backdrop: backdrop,
    closeButton: backdrop.querySelector(".prerelease-close"),
    cancelButton: backdrop.querySelector("[data-prerelease-cancel]"),
    form: backdrop.querySelector("[data-prerelease-form]"),
    emailInput: backdrop.querySelector("#prerelease-email"),
    statusMessage: backdrop.querySelector("[data-prerelease-status]"),
    actionHint: backdrop.querySelector("[data-prerelease-action]"),
    submitButton: backdrop.querySelector("[data-prerelease-submit]")
  };
}
