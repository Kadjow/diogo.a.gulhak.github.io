import { SELECTORS, prefersReducedMotion } from "../core/config.js";

const SKILLS_ANIMATION_DURATION = 260;
const skillsAnimationTimers = new WeakMap();

const animateSkillsSwap = (container, mutateFn) => {
  if (!container) {
    mutateFn?.();
    return;
  }

  const timers = skillsAnimationTimers.get(container) ?? { exitTimer: null, enterTimer: null };

  const cleanupTimers = () => {
    if (timers.exitTimer) {
      clearTimeout(timers.exitTimer);
      timers.exitTimer = null;
    }
    if (timers.enterTimer) {
      clearTimeout(timers.enterTimer);
      timers.enterTimer = null;
    }
    container.classList.remove("is-exiting", "is-entering");
    if (!timers.exitTimer && !timers.enterTimer) {
      skillsAnimationTimers.delete(container);
    }
  };

  if (prefersReducedMotion()) {
    cleanupTimers();
    mutateFn?.();
    return;
  }

  cleanupTimers();
  container.classList.add("is-exiting");

  timers.exitTimer = window.setTimeout(() => {
    timers.exitTimer = null;
    mutateFn?.();
    container.classList.remove("is-exiting");
    container.classList.add("is-entering");

    timers.enterTimer = window.setTimeout(() => {
      timers.enterTimer = null;
      container.classList.remove("is-entering");
      if (!timers.exitTimer) {
        skillsAnimationTimers.delete(container);
      }
    }, SKILLS_ANIMATION_DURATION);
  }, SKILLS_ANIMATION_DURATION);

  skillsAnimationTimers.set(container, timers);
};

export function initSkillsTabs() {
  const tabs = Array.from(document.querySelectorAll(SELECTORS.skills.tabs));
  const panels = Array.from(document.querySelectorAll(SELECTORS.skills.panels));
  const animationContainer = document.querySelector(SELECTORS.skills.animationContainer);

  if (!tabs.length) return;

  const activate = (tab) => {
    tabs.forEach((item) => {
      item.classList.remove("is-active");
      item.setAttribute("aria-selected", "false");
      item.tabIndex = -1;
    });

    tab.classList.add("is-active");
    tab.setAttribute("aria-selected", "true");
    tab.tabIndex = 0;

    const panelId = tab.getAttribute("aria-controls");
    const panel = panelId ? document.getElementById(panelId) : null;

    animateSkillsSwap(animationContainer, () => {
      panels.forEach((p) => p.classList.remove("is-active"));
      if (panel) panel.classList.add("is-active");
    });

    tab.focus();
  };

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => activate(tab));
    tab.addEventListener("keydown", (event) => {
      if (event.key === "ArrowRight") activate(tabs[(index + 1) % tabs.length]);
      if (event.key === "ArrowLeft") activate(tabs[(index - 1 + tabs.length) % tabs.length]);
      if (event.key === "Home") activate(tabs[0]);
      if (event.key === "End") activate(tabs[tabs.length - 1]);
    });
  });
}
