(function photosCaptchaGate() {
  const STORAGE_KEY = "photos_human_verified";
  const BLUR_CLASS = "media-grid--blur";
  const VERIFY_URL = "https://withered-band-5ff3.dgulhak.workers.dev/verify";
  const PLACEHOLDER_MSG = "Captcha configurado com sucesso! ";
  const RESET_DELAY = 400;
  const SCRIPT_CHECK_DELAY = 1500;

  let overlay;
  let grid;
  let errorEl;
  let widgetEl;
  let initialized = false;
  let verifying = false;
  let resetScheduled = false;
  let placeholderActive = false;

  const isVerified = () => {
    try {
      return sessionStorage.getItem(STORAGE_KEY) === "1";
    } catch (_) {
      return false;
    }
  };

  const setVerified = () => {
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch (_) {}
  };

  const showError = (msg) => {
    if (errorEl) errorEl.textContent = msg || "";
  };

  const lock = () => {
    overlay?.classList.remove("hidden");
    grid?.classList.add(BLUR_CLASS);
  };

  const unlock = () => {
    overlay?.classList.add("hidden");
    grid?.classList.remove(BLUR_CLASS);
    showError("");
  };

  const scheduleReset = () => {
    if (errorEl) errorEl.textCont
    if (resetScheduled || placeholderActive) return;
    resetScheduled = true;
    setTimeout(() => {
      resetScheduled = false;
      try {
        window.turnstile?.reset?.();
      } catch (_) {}
    }, RESET_DELAY);
  };

  const verifyWithServer = async (token) => {
    try {
      const response = await fetch(VERIFY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token })
      });
      const data = await response.json().catch(() => null);
      return data?.success === true;
    } catch (_) {
      return false;
    }
  };

  const onTurnstileSuccess = async (token) => {
    if (!initialized || verifying) return;
    if (placeholderActive) {
      showError(PLACEHOLDER_MSG);
      return;
    }
    verifying = true;
    showError("");

    try {
      const ok = await verifyWithServer(token);
      if (ok) {
        setVerified();
        unlock();
        return;
      }

      showError("Não foi possível verificar. Tente novamente.");
      scheduleReset();
    } finally {
      verifying = false;
    }
  };

  const onTurnstileError = () => {
    if (!initialized) return;
    if (placeholderActive) {
      showError(PLACEHOLDER_MSG);
      return;
    }
    showError("Não foi possível verificar. Tente novamente.");
    scheduleReset();
  };

  const onTurnstileExpired = () => {
    if (!initialized) return;
    if (placeholderActive) {
      showError(PLACEHOLDER_MSG);
      return;
    }
    showError("Não foi possível verificar. Tente novamente.");
    scheduleReset();
  };

  const checkTurnstileLoaded = () => {
    setTimeout(() => {
      if (!initialized || placeholderActive || typeof window.turnstile !== "undefined") return;
      showError("Não foi possível carregar a verificação. Desative o bloqueador e recarregue.");
    }, SCRIPT_CHECK_DELAY);
  };

  const initPhotosCaptchaGate = () => {
    if (initialized) return;
    overlay = document.getElementById("humanOverlay");
    grid = document.getElementById("mediaGrid");
    errorEl = document.getElementById("humanError") || document.getElementById("photosCaptchaError");
    widgetEl = document.getElementById("turnstileWidget") || document.querySelector("#photosCaptcha .cf-turnstile");

    if (!overlay || !grid || !widgetEl) return;

    const siteKey = widgetEl.dataset.sitekey || "";
    const verifyPlaceholder = !VERIFY_URL || VERIFY_URL.startsWith("__") || VERIFY_URL.includes("TURNSTILE_VERIFY_URL");
    const siteKeyPlaceholder = !siteKey || siteKey.startsWith("__") || siteKey.includes("TURNSTILE_SITE_KEY") || siteKey.includes("PASTE_SITE_KEY_HERE");

    placeholderActive = verifyPlaceholder || siteKeyPlaceholder;
    initialized = true;

    if (placeholderActive) {
      lock();
      showError(PLACEHOLDER_MSG);
      return;
    }

    if (isVerified()) {
      unlock();
    } else {
      lock();
      checkTurnstileLoaded();
    }
  };

  window.initPhotosCaptchaGate = initPhotosCaptchaGate;
  window.onTurnstileSuccess = onTurnstileSuccess;
  window.onTurnstileError = onTurnstileError;
  window.onTurnstileExpired = onTurnstileExpired;
})();
