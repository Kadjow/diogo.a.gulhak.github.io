import { SELECTORS, STORAGE_KEYS, ENDPOINTS } from "../core/config.js";
import { safeSessionGet, safeSessionSet } from "../core/storage.js";
import { postJSON } from "../core/http.js";

const LOCK_BLUR_CLASS = "media-grid--blur";
const PLACEHOLDER_MSG = "Captcha ainda não está configurado. Verifique as chaves e o endpoint de verificação.";
const VERIFY_ERROR_MSG = "Não foi possível verificar. Tente novamente.";
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

const isVerified = () => safeSessionGet(STORAGE_KEYS.photosHuman) === "1";
const markVerified = () => safeSessionSet(STORAGE_KEYS.photosHuman, "1");
const showError = (message) => {
  if (errorEl) {
    errorEl.textContent = message || "";
  }
};

const lock = () => {
  overlay?.classList.remove("hidden");
  grid?.classList.add(LOCK_BLUR_CLASS);
};

const unlock = () => {
  overlay?.classList.add("hidden");
  grid?.classList.remove(LOCK_BLUR_CLASS);
  showError("");
};

const scheduleReset = () => {
  if (errorEl) errorEl.textContent = "";
  if (resetScheduled || placeholderActive) return;
  resetScheduled = true;
  setTimeout(() => {
    resetScheduled = false;
    try {
      window.turnstile?.reset?.();
    } catch (_error) {
      // ignore
    }
  }, RESET_DELAY);
};

const verifyWithServer = async (token) => {
  const url = ENDPOINTS.turnstileVerifyUrl;
  if (!url) return false;
  const { ok, data } = await postJSON(url, { token });
  return ok && data?.success === true;
};

const handleSuccess = async (token) => {
  if (!initialized || verifying) return;
  if (placeholderActive) {
    showError(PLACEHOLDER_MSG);
    return;
  }
  verifying = true;
  showError("");
  try {
    const verified = await verifyWithServer(token);
    if (verified) {
      markVerified();
      unlock();
      return;
    }
    showError(VERIFY_ERROR_MSG);
    scheduleReset();
  } finally {
    verifying = false;
  }
};

const handleError = () => {
  if (!initialized) return;
  if (placeholderActive) {
    showError(PLACEHOLDER_MSG);
    return;
  }
  showError(VERIFY_ERROR_MSG);
  scheduleReset();
};

const handleExpired = () => {
  if (!initialized) return;
  if (placeholderActive) {
    showError(PLACEHOLDER_MSG);
    return;
  }
  showError(VERIFY_ERROR_MSG);
  scheduleReset();
};

const checkTurnstileLoaded = () => {
  setTimeout(() => {
    if (!initialized || placeholderActive || typeof window.turnstile !== "undefined") return;
    showError("Não foi possível carregar a verificação. Desative o bloqueador e recarregue.");
  }, SCRIPT_CHECK_DELAY);
};

const initPhotosGate = () => {
  if (initialized) return;

  overlay = document.querySelector(SELECTORS.photosGate.overlay);
  grid = document.querySelector(SELECTORS.photosGate.grid);
  errorEl = document.querySelector(SELECTORS.photosGate.error) || document.querySelector(SELECTORS.photosGate.alternateError);
  widgetEl = document.querySelector(SELECTORS.photosGate.widget);

  if (!overlay || !grid || !widgetEl) return;

  const siteKey = widgetEl.dataset.sitekey || "";
  const verifyUrl = ENDPOINTS.turnstileVerifyUrl;
  const verifyPlaceholder = !verifyUrl || verifyUrl.startsWith("__") || verifyUrl.includes("TURNSTILE_VERIFY_URL");
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

window.onTurnstileSuccess = handleSuccess;
window.onTurnstileError = handleError;
window.onTurnstileExpired = handleExpired;

export { initPhotosGate };
