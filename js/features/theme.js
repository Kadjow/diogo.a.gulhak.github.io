import { SELECTORS, STORAGE_KEYS, prefersReducedMotion } from "../core/config.js";
import { safeLocalGet, safeLocalSet } from "../core/storage.js";

export function initTheme() {
  const root = document.documentElement;
  const body = document.body;
  const toggleButton = document.querySelector(SELECTORS.themeSwitch) || document.querySelector(SELECTORS.themeFallback);
  const storedTheme = safeLocalGet(STORAGE_KEYS.theme);
  const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;

  const applyStoredTheme = () => {
    if (storedTheme === "light" || (!storedTheme && prefersLight)) {
      root.classList.add("light");
    }
  };

  applyStoredTheme();

  const syncSwitchState = () => {
    if (!toggleButton) return;
    const isDark = !root.classList.contains("light");
    toggleButton.setAttribute("aria-checked", String(isDark));
  };

  syncSwitchState();

  const toggleTheme = () => {
    const isLight = root.classList.toggle("light");
    safeLocalSet(STORAGE_KEYS.theme, isLight ? "light" : "dark");
    syncSwitchState();
  };

  const withTransition = (runner) => {
    if (prefersReducedMotion()) {
      runner();
      return;
    }
    body.classList.add("is-theme-switching");
    requestAnimationFrame(() => {
      runner();
      window.setTimeout(() => body.classList.remove("is-theme-switching"), 280);
    });
  };

  const handleToggle = () => withTransition(toggleTheme);

  if (!toggleButton) return;
  toggleButton.addEventListener("click", handleToggle);
  toggleButton.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleToggle();
    }
  });
}
