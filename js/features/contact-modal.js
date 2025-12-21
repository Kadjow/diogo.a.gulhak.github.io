import { SELECTORS } from "../core/config.js";

export function initContactModal() {
  const modal = document.querySelector(SELECTORS.contact.modal);
  if (!modal) return;

  const openBtn = document.querySelector(SELECTORS.contact.open);
  const closeBtn = document.querySelector(SELECTORS.contact.close);

  const open = () => {
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
  };

  const close = () => {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
  };

  openBtn?.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);

  modal.addEventListener("click", (event) => {
    if (event.target === modal) close();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("is-open")) {
      close();
    }
  });
}
