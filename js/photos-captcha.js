/* photos-human-verify:v2-minimal */
var PHOTOS_VERIFY_TTL_MS = 0; // 0 = always require verification when opening gallery

(function photosCaptchaGate() {
  var BLUR_CLASS = "media-grid--blur";
  var RESET_DELAY_MS = 350;
  var SCRIPT_CHECK_DELAY_MS = 1800;
  var DEFAULT_VERIFY_URL = "https://withered-band-5ff3.dgulhak.workers.dev/verify";
  var DEV_TEST_SITEKEY = "1x00000000000000000000AA";

  var overlay = null;
  var grid = null;
  var errorEl = null;
  var widgetEl = null;

  var initialized = false;
  var verifying = false;
  var rendered = false;
  var widgetId = null;

  function now() {
    try { return Date.now(); } catch (_) { return new Date().getTime(); }
  }

  function t(key) {
    var fallback = {
      "captcha.verifyFailed": "Could not verify. Please try again.",
      "captcha.loadFailed": "Could not load verification. Disable blockers and reload."
    };

    try {
      if (window.I18N && typeof window.I18N.t === "function") {
        return window.I18N.t(key);
      }
    } catch (_) {}

    return fallback[key] || key;
  }

  function showError(msg) {
    if (!errorEl) return;
    errorEl.textContent = msg || "";
  }

  function lock() {
    try { if (overlay) overlay.classList.remove("hidden"); } catch (_) {}
    try { if (grid) grid.classList.add(BLUR_CLASS); } catch (_) {}
  }

  function unlock() {
    try { if (overlay) overlay.classList.add("hidden"); } catch (_) {}
    try { if (grid) grid.classList.remove(BLUR_CLASS); } catch (_) {}
    showError("");
  }

  function clearVerified() {
    try { sessionStorage.removeItem("photos_human_verified"); } catch (_) {}
    try { sessionStorage.removeItem("photos_human_verified_at"); } catch (_) {}
  }

  function setVerified() {
    var ts = String(now());
    try { sessionStorage.setItem("photos_human_verified", "1"); } catch (_) {}
    try { sessionStorage.setItem("photos_human_verified_at", ts); } catch (_) {}
  }

  function isVerified() {
    try {
      if (!PHOTOS_VERIFY_TTL_MS || PHOTOS_VERIFY_TTL_MS <= 0) return false;

      var flag = sessionStorage.getItem("photos_human_verified");
      if (flag !== "1") return false;

      var at = Number(sessionStorage.getItem("photos_human_verified_at") || "0");
      if (!at) return false;

      return (now() - at) <= PHOTOS_VERIFY_TTL_MS;
    } catch (_) {
      return false;
    }
  }

  function isDevHost() {
    try {
      return location.hostname === "localhost" || location.hostname === "127.0.0.1";
    } catch (_) {
      return false;
    }
  }

  function getVerifyUrl() {
    var fromWindow = "";
    var fromDataset = "";

    try { fromWindow = (window.PHOTOS_VERIFY_URL || "").trim(); } catch (_) { fromWindow = ""; }
    try { fromDataset = ((widgetEl && widgetEl.getAttribute("data-verify-url")) || "").trim(); } catch (_) { fromDataset = ""; }

    return fromWindow || fromDataset || DEFAULT_VERIFY_URL;
  }

  function getSiteKey() {
    var sitekey = "";
    try { sitekey = (widgetEl && widgetEl.getAttribute("data-sitekey")) || ""; } catch (_) { sitekey = ""; }

    if (isDevHost()) {
      sitekey = DEV_TEST_SITEKEY;
      try { if (widgetEl) widgetEl.setAttribute("data-sitekey", sitekey); } catch (_) {}
    }

    return sitekey;
  }

  function resetTurnstile() {
    setTimeout(function () {
      try {
        if (!window.turnstile || typeof window.turnstile.reset !== "function") return;

        if (widgetId !== null && widgetId !== undefined) {
          window.turnstile.reset(widgetId);
        } else {
          window.turnstile.reset();
        }
      } catch (_) {}
    }, RESET_DELAY_MS);
  }

  async function verifyWithServer(token) {
    var verifyUrl = getVerifyUrl();

    try {
      var response = await fetch(verifyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token })
      });

      var data = null;
      try { data = await response.json(); } catch (_) { data = null; }

      var ok = !!(data && (data.ok === true || data.success === true));

      if (!ok) {
        try { console.warn("[Turnstile] verify failed", { status: response.status, errorCodes: data && data.errorCodes }); } catch (_) {}
      }

      return ok;
    } catch (err) {
      try { console.warn("[Turnstile] verify network error", err); } catch (_) {}
      return false;
    }
  }

  async function onTurnstileSuccess(token) {
    if (!initialized || verifying) return;

    verifying = true;
    showError("");

    try {
      var ok = await verifyWithServer(token);
      if (ok) {
        setVerified();
        unlock();
        return;
      }

      showError(t("captcha.verifyFailed"));
      resetTurnstile();
    } finally {
      verifying = false;
    }
  }

  function onTurnstileError() {
    if (!initialized) return;
    showError(t("captcha.verifyFailed"));
    resetTurnstile();
  }

  function onTurnstileExpired() {
    if (!initialized) return;
    showError(t("captcha.verifyFailed"));
    resetTurnstile();
  }

  function renderWidget() {
    if (!initialized || rendered) return;
    if (!widgetEl) return;
    if (!window.turnstile || typeof window.turnstile.render !== "function") return;

    var sitekey = getSiteKey();
    if (!sitekey) {
      showError(t("captcha.loadFailed"));
      try { console.warn("[Turnstile] missing sitekey"); } catch (_) {}
      return;
    }

    var action = widgetEl.getAttribute("data-action") || "photos_gallery";
    var cdata = widgetEl.getAttribute("data-cdata") || "photos_gallery";
    var theme = widgetEl.getAttribute("data-theme") || "auto";
    var appearance = widgetEl.getAttribute("data-appearance") || "interaction-only";

    try {
      widgetId = window.turnstile.render(widgetEl, {
        sitekey: sitekey,
        action: action,
        cData: cdata,
        theme: theme,
        appearance: appearance,
        callback: onTurnstileSuccess,
        "error-callback": onTurnstileError,
        "expired-callback": onTurnstileExpired
      });

      rendered = true;
      try { console.info("[Turnstile] widget rendered"); } catch (_) {}
    } catch (err) {
      rendered = false;
      widgetId = null;
      showError(t("captcha.loadFailed"));
      try { console.warn("[Turnstile] render error", err); } catch (_) {}
    }
  }

  function initPhotosCaptchaGate() {
    if (initialized) return;

    overlay = document.getElementById("humanOverlay");
    grid = document.getElementById("mediaGrid");
    errorEl = document.getElementById("humanError") || document.getElementById("photosCaptchaError");
    widgetEl = document.getElementById("turnstileWidget") || document.querySelector("#photosCaptcha .cf-turnstile");

    if (!overlay || !grid || !widgetEl) return;

    initialized = true;

    if (PHOTOS_VERIFY_TTL_MS <= 0) {
      clearVerified();
    }

    if (isVerified()) {
      unlock();
    } else {
      lock();
    }

    if (window.turnstile && typeof window.turnstile.render === "function") {
      renderWidget();
      return;
    }

    setTimeout(function () {
      if (!initialized || rendered) return;
      if (typeof window.turnstile === "undefined") {
        showError(t("captcha.loadFailed"));
        try { console.warn("[Turnstile] api.js not available"); } catch (_) {}
      }
    }, SCRIPT_CHECK_DELAY_MS);
  }

  window.initPhotosCaptchaGate = initPhotosCaptchaGate;
  window.onTurnstileSuccess = onTurnstileSuccess;
  window.onTurnstileError = onTurnstileError;
  window.onTurnstileExpired = onTurnstileExpired;

  window.photosTurnstileOnload = function () {
    try { console.info("[Turnstile] api loaded"); } catch (_) {}
    renderWidget();
  };
})();