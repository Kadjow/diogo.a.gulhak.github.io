const TURNSTILE_VERIFY_URL = "https://withered-band-5ff3.dgulhak.workers.dev/verify";

export const SELECTORS = {
  themeSwitch: "#themeSwitch",
  themeFallback: "#themeToggle",
  skills: {
    tabs: ".tab",
    panels: ".panel",
    animationContainer: ".skills-anim"
  },
  projects: {
    grid: "#projectsGrid",
    filters: "#projectFilters .filter",
    prev: "#projectsPrev",
    next: "#projectsNext"
  },
  gallery: {
    overlay: "#galleryOverlay",
    image: "#galleryImage",
    caption: "#galleryCaption",
    counter: "#galleryCounter",
    title: "#galleryTitle",
    prev: "#galleryPrev",
    next: "#galleryNext",
    close: "#closeGallery",
    triggers: ".js-gallery"
  },
  backToTop: "#backToTop",
  contact: {
    modal: "#contactModal",
    open: "#openContact",
    close: "#closeContact"
  },
  photosGate: {
    overlay: "#humanOverlay",
    grid: "#mediaGrid",
    error: "#humanError",
    alternateError: "#photosCaptchaError",
    widget: "#turnstileWidget, #photosCaptcha .cf-turnstile"
  }
};

export const STORAGE_KEYS = {
  theme: "theme",
  photosHuman: "photos_human_verified"
};

export const ENDPOINTS = {
  turnstileVerifyUrl: TURNSTILE_VERIFY_URL
};

export const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
