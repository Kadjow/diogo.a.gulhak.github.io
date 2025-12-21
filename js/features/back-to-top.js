import { SELECTORS } from "../core/config.js";

export function initBackToTop() {
  const button = document.querySelector(SELECTORS.backToTop);
  if (!button) return;

  window.addEventListener("scroll", () => {
    const show = window.scrollY > 400;
    button.classList.toggle("is-visible", show);
  });

  button.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}
