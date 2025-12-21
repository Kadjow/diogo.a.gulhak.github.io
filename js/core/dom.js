export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
export const on = (element, event, handler, options) => element?.addEventListener(event, handler, options);
export const addClass = (element, className) => element?.classList?.add(className);
export const removeClass = (element, className) => element?.classList?.remove(className);
export const toggleClass = (element, className, state) => {
  if (!element) return;
  if (typeof state === "boolean") {
    element.classList.toggle(className, state);
  } else {
    element.classList.toggle(className);
  }
};
export const ready = (callback) => {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", callback, { once: true });
  } else {
    callback();
  }
};
export const delegate = (parent, selector, event, handler) => {
  if (!parent) return;
  parent.addEventListener(event, (e) => {
    const target = e.target instanceof Element ? e.target.closest(selector) : null;
    if (target) {
      handler(e, target);
    }
  });
};
