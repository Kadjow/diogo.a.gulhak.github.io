import { prefersReducedMotion } from "../core/config.js";
import { safeLocalGet, safeLocalSet } from "../core/storage.js";

const ROTATOR_PHRASES = [
  "um desenvolvedor mobile.",
  "um desenvolvedor full-stack.",
  "um desenvolvedor front-end.",
  "um developer advocate."
];

const TITLE_MAP = {
  "#sobre": "Sobre — Diogo Gulhak",
  "#skills": "Skills — Diogo Gulhak",
  "#projetos": "Projetos — Diogo Gulhak",
  "#experiencia": "Experiência — Diogo Gulhak",
  "#sobre-mim": "Quem sou eu — Diogo Gulhak"
};

const ROTATOR_REDUCED_DELAY = 2500;
const ROTATOR_REGULAR_DELAY = { typing: 54, deleting: 26, pause: 1400 };

const updateRoleRotator = () => {
  const element = document.getElementById("roleRotator");
  if (!element) return;

  const reduced = prefersReducedMotion();
  let phraseIndex = 0;
  let charIndex = 0;
  let deleting = false;

  const tick = () => {
    if (reduced) {
      element.textContent = ROTATOR_PHRASES[phraseIndex];
      phraseIndex = (phraseIndex + 1) % ROTATOR_PHRASES.length;
      setTimeout(tick, ROTATOR_REDUCED_DELAY);
      return;
    }

    const currentPhrase = ROTATOR_PHRASES[phraseIndex];

    if (!deleting) {
      charIndex++;
      element.textContent = currentPhrase.slice(0, charIndex);
      if (charIndex === currentPhrase.length) {
        deleting = true;
        setTimeout(tick, ROTATOR_REGULAR_DELAY.pause);
        return;
      }
    } else {
      charIndex--;
      element.textContent = currentPhrase.slice(0, charIndex);
      if (charIndex === 0) {
        deleting = false;
        phraseIndex = (phraseIndex + 1) % ROTATOR_PHRASES.length;
      }
    }

    setTimeout(tick, deleting ? ROTATOR_REGULAR_DELAY.deleting : ROTATOR_REGULAR_DELAY.typing);
  };

  tick();
};

const bindAnchors = () => {
  const anchors = document.querySelectorAll("a[href^='#']");
  anchors.forEach((anchor) => {
    anchor.addEventListener("click", (event) => {
      const targetId = anchor.getAttribute("href");
      const mappedTitle = targetId ? TITLE_MAP[targetId] : null;
      if (mappedTitle) {
        document.title = mappedTitle;
      }
      if (targetId && targetId.length > 1) {
        event.preventDefault();
        const target = document.querySelector(targetId);
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    });
  });
};

const bindMailtoLinks = () => {
  const links = document.querySelectorAll("a.btn[data-mailto]");
  const buildMailto = ({ to, subject, body }) => {
    const encodedSubject = encodeURIComponent(subject ?? "");
    const encodedBody = encodeURIComponent(body ?? "");
    return `mailto:${to}?subject=${encodedSubject}&body=${encodedBody}`;
  };

  links.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      window.location.href = buildMailto({
        to: "dgulhak@gmail.com",
        subject: "Projeto Mobile — Portfólio",
        body: "Olá Diogo! Vi seu portfólio e gostaria de conversar sobre um projeto. Podemos marcar um papo rápido?\n\nAssunto:\nContexto:\nPrazo:\nOrçamento:"
      });
    });
  });
};

const rememberAboutSection = () => {
  const details = document.querySelector("#aboutDetails");
  if (!details) return;

  const label = details.querySelector(".summary-label");
  const storageKey = details.dataset.remember || "about-open";
  if (safeLocalGet(storageKey) === "true") {
    details.setAttribute("open", "");
  }

  const updateLabel = () => {
    if (!label) return;
    label.textContent = details.open ? "Esconder sobre mim" : "Mostrar sobre mim";
  };

  updateLabel();
  details.addEventListener("toggle", () => {
    updateLabel();
    safeLocalSet(storageKey, details.open ? "true" : "false");
  });
};

export function initSiteEnhancements() {
  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear().toString();
  }
  updateRoleRotator();
  bindAnchors();
  bindMailtoLinks();
  rememberAboutSection();
}
