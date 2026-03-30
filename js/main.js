function i18nT(key, vars) {
  if (window.I18N && typeof window.I18N.t === "function") return window.I18N.t(key, vars);
  return key;
}

function i18nAsset(path) {
  if (window.I18N && typeof window.I18N.assetPath === "function") return window.I18N.assetPath(path);
  return path;
}

function setText(selector, value) {
  const node = document.querySelector(selector);
  if (node) node.textContent = value;
}

function setHtml(selector, value) {
  const node = document.querySelector(selector);
  if (node) node.innerHTML = value;
}

function setAttr(selector, attr, value) {
  const node = document.querySelector(selector);
  if (node) node.setAttribute(attr, value);
}

(function localizeStaticContent() {
  function apply() {
    document.title = i18nT("seo.title");

    const description = document.querySelector('meta[name="description"]');
    if (description) description.setAttribute("content", i18nT("seo.description"));

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute("content", i18nT("seo.ogTitle"));

    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) ogDescription.setAttribute("content", i18nT("seo.ogDescription"));

    const ogLocale = document.querySelector('meta[property="og:locale"]');
    if (ogLocale) ogLocale.setAttribute("content", i18nT("seo.ogLocale"));

    setAttr(".nav", "aria-label", i18nT("a11y.navMain"));
    setAttr(".brand", "aria-label", i18nT("a11y.top"));
    setAttr("#themeSwitch", "aria-label", i18nT("a11y.themeToggle"));
    setText("#openContact", i18nT("hero.contactButton"));
    setAttr(".hero-photo", "alt", i18nT("hero.photoAlt"));
    setText("#rolePrefix", i18nT("hero.rolePrefix"));
    setHtml(".bio-short", i18nT("hero.bioHtml"));

    const heroCtas = document.querySelectorAll(".hero .cta a");
    if (heroCtas[0]) heroCtas[0].textContent = i18nT("hero.ctaGithub");
    if (heroCtas[1]) heroCtas[1].textContent = i18nT("hero.ctaProjects");

    const socialLinks = document.querySelectorAll(".social a");
    if (socialLinks[0]) socialLinks[0].setAttribute("aria-label", i18nT("a11y.socialEmail"));
    if (socialLinks[1]) socialLinks[1].setAttribute("aria-label", i18nT("a11y.socialGithub"));
    if (socialLinks[2]) socialLinks[2].setAttribute("aria-label", i18nT("a11y.socialLinkedin"));

    setText("#sobre h2", i18nT("sections.aboutTitle"));
    const aboutParagraphs = document.querySelectorAll("#sobre p");
    if (aboutParagraphs[0]) aboutParagraphs[0].textContent = i18nT("sections.aboutP1");
    if (aboutParagraphs[1]) aboutParagraphs[1].textContent = i18nT("sections.aboutP2");

    setText("#skills h2", i18nT("sections.skillsTitle"));
    setAttr("#skills .tabs", "aria-label", i18nT("a11y.skillsGroups"));
    setText("#tab-mobile", i18nT("sections.skillsTabs.mobile"));
    setText("#tab-web", i18nT("sections.skillsTabs.web"));
    setText("#tab-backend", i18nT("sections.skillsTabs.backend"));
    setText("#tab-devops", i18nT("sections.skillsTabs.devops"));

    setText("#projetos h2", i18nT("sections.projectsTitle"));
    setAttr("#projectFilters", "aria-label", i18nT("a11y.projectFilters"));
    setText('#projectFilters .filter[data-tech="all"]', i18nT("sections.projectFilters.all"));
    setText('#projectFilters .filter[data-tech="flutter"]', i18nT("sections.projectFilters.flutter"));
    setText('#projectFilters .filter[data-tech="react-native"]', i18nT("sections.projectFilters.reactNative"));
    setText('#projectFilters .filter[data-tech="web"]', i18nT("sections.projectFilters.web"));
    setAttr("#projectsPrev", "aria-label", i18nT("a11y.prevProjects"));
    setAttr("#projectsNext", "aria-label", i18nT("a11y.nextProjects"));

    setText("#experiencia h2", i18nT("sections.experienceTitle"));
    const xpCards = document.querySelectorAll("#experiencia .xp-card");
    if (xpCards[0]) {
      const title = xpCards[0].querySelector("h3");
      const items = xpCards[0].querySelectorAll("li");
      if (title) title.innerHTML = `${i18nT("sections.experience.atlasTitle")} <small>${i18nT("sections.experience.atlasPeriod")}</small>`;
      if (items[0]) items[0].textContent = i18nT("sections.experience.atlasItem1");
      if (items[1]) items[1].textContent = i18nT("sections.experience.atlasItem2");
    }
    if (xpCards[1]) {
      const title = xpCards[1].querySelector("h3");
      const items = xpCards[1].querySelectorAll("li");
      if (title) title.innerHTML = `${i18nT("sections.experience.adsTitle")} <small>${i18nT("sections.experience.adsPeriod")}</small>`;
      if (items[0]) items[0].textContent = i18nT("sections.experience.adsItem1");
      if (items[1]) items[1].textContent = i18nT("sections.experience.adsItem2");
    }
    if (xpCards[2]) {
      const title = xpCards[2].querySelector("h3");
      const items = xpCards[2].querySelectorAll("li");
      if (title) title.textContent = i18nT("sections.experience.academicTitle");
      if (items[0]) items[0].textContent = i18nT("sections.experience.academicItem1");
      if (items[1]) items[1].textContent = i18nT("sections.experience.academicItem2");
    }

    setText("#sobre-mim h2", i18nT("sections.aboutMeTitle"));

    const aboutCards = document.querySelectorAll("#sobre-mim .about-card");
    if (aboutCards[0]) {
      setText("#sobre-mim .about-card:nth-of-type(1) h3", i18nT("aboutCards.scoutingTitle"));
      const items = aboutCards[0].querySelectorAll("li");
      if (items[0]) items[0].innerHTML = i18nT("aboutCards.scoutingItem1");
      if (items[1]) items[1].innerHTML = i18nT("aboutCards.scoutingItem2");
    }
    if (aboutCards[1]) {
      setText("#sobre-mim .about-card:nth-of-type(2) h3", i18nT("aboutCards.natureTitle"));
      const items = aboutCards[1].querySelectorAll("li");
      if (items[0]) items[0].textContent = i18nT("aboutCards.natureItem1");
      if (items[1]) items[1].textContent = i18nT("aboutCards.natureItem2");
    }
    if (aboutCards[2]) {
      setText("#sobre-mim .about-card:nth-of-type(3) h3", i18nT("aboutCards.coffeeTitle"));
      const items = aboutCards[2].querySelectorAll("li");
      if (items[0]) items[0].textContent = i18nT("aboutCards.coffeeItem1");
    }

    setText(".media-title", i18nT("media.title"));

    const mediaItems = document.querySelectorAll("#mediaGrid .media-item");
    if (mediaItems[0]) {
      const img = mediaItems[0].querySelector("img");
      const cap = mediaItems[0].querySelector("figcaption");
      if (img) img.setAttribute("alt", i18nT("media.scoutAlt"));
      if (cap) cap.textContent = i18nT("media.scoutCaption");
    }
    if (mediaItems[1]) {
      const img = mediaItems[1].querySelector("img");
      const cap = mediaItems[1].querySelector("figcaption");
      if (img) img.setAttribute("alt", i18nT("media.techAlt"));
      if (cap) cap.textContent = i18nT("media.techCaption");
    }
    setText(".media-note", i18nT("media.note"));

    setAttr("#backToTop", "aria-label", i18nT("a11y.backToTop"));
    setAttr("#closeContact", "aria-label", i18nT("a11y.close"));
    setText("#contactTitle", i18nT("contact.title"));
    setText("#contactModal .muted", i18nT("contact.subtitle"));

    const contactItems = document.querySelectorAll("#contactModal .contact-item");
    if (contactItems[1]) {
      const strong = contactItems[1].querySelector("strong");
      const span = contactItems[1].querySelector("span");
      if (strong) strong.textContent = i18nT("contact.whatsappLabel");
      if (span) span.textContent = i18nT("contact.whatsappSubtitle");
    }
    if (contactItems[2]) {
      const strong = contactItems[2].querySelector("strong");
      const span = contactItems[2].querySelector("span");
      if (strong) strong.textContent = i18nT("contact.linkedinLabel");
      if (span) span.textContent = i18nT("contact.linkedinSubtitle");
    }

    const emailLink = document.querySelector('#contactModal a[href^="mailto:"]');
    if (emailLink) {
      const subject = encodeURIComponent(i18nT("contact.emailSubject"));
      emailLink.setAttribute("href", `mailto:dgulhak@gmail.com?subject=${subject}`);
    }

    const whatsappLink = document.querySelector('#contactModal a[href*="wa.me"]');
    if (whatsappLink) {
      const text = encodeURIComponent(i18nT("contact.whatsappText"));
      whatsappLink.setAttribute("href", `https://wa.me/5545998549198?text=${text}`);
    }

    setAttr("#closeGallery", "aria-label", i18nT("a11y.closeGallery"));
    setText("#galleryTitle", i18nT("gallery.title"));
    setAttr("#galleryPrev", "aria-label", i18nT("a11y.previousPhoto"));
    setAttr("#galleryNext", "aria-label", i18nT("a11y.nextPhoto"));
    setText(".gallery-hint", i18nT("gallery.hint"));
  }

  document.addEventListener("DOMContentLoaded", apply, { once: true });
})();

(function themeSetup() {
  const root = document.documentElement;
  const body = document.body;
  const btn = document.getElementById("themeSwitch") || document.getElementById("themeToggle");
  const stored = localStorage.getItem("theme");
  const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;

  function withThemeTransition(run) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      run();
      return;
    }
    body.classList.add("is-theme-switching");
    requestAnimationFrame(() => {
      run();
      window.setTimeout(() => body.classList.remove("is-theme-switching"), 280);
    });
  }

  const syncSwitch = () => {
    if (!btn) return;
    const isDark = !root.classList.contains("light");
    btn.setAttribute("aria-checked", String(isDark));
  };

  if (stored === "light" || (!stored && prefersLight)) {
    root.classList.add("light");
  }

  syncSwitch();

  const toggle = () => {
    const isLight = root.classList.toggle("light");
    localStorage.setItem("theme", isLight ? "light" : "dark");
    syncSwitch();
  };

  const onToggle = () => withThemeTransition(() => toggle());

  btn?.addEventListener("click", onToggle);
  btn?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onToggle();
    }
  });
})();

(function rotatingTyping() {
  const el = document.getElementById("roleRotator");
  if (!el) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const phrases = i18nT("hero.rotatingPhrases");
  const phraseList = Array.isArray(phrases) ? phrases : [];
  if (!phraseList.length) return;

  let phraseIndex = 0;
  let charIndex = 0;
  let deleting = false;

  function tick() {
    if (reduced) {
      el.textContent = phraseList[phraseIndex];
      phraseIndex = (phraseIndex + 1) % phraseList.length;
      setTimeout(tick, 2500);
      return;
    }

    const full = phraseList[phraseIndex];

    if (!deleting) {
      charIndex += 1;
      el.textContent = full.slice(0, charIndex);
      if (charIndex === full.length) {
        deleting = true;
        setTimeout(tick, 1400);
        return;
      }
    } else {
      charIndex -= 1;
      el.textContent = full.slice(0, charIndex);
      if (charIndex === 0) {
        deleting = false;
        phraseIndex = (phraseIndex + 1) % phraseList.length;
      }
    }

    setTimeout(tick, deleting ? 26 : 54);
  }

  tick();
})();

const SKILLS_ANIMATION_DURATION = 260;
const skillsAnimationTimers = new WeakMap();

function animateSkillsSwap(container, mutateFn) {
  if (!container) {
    mutateFn();
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

  const prefersReduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduce) {
    cleanupTimers();
    mutateFn();
    return;
  }

  cleanupTimers();
  container.classList.add("is-exiting");

  timers.exitTimer = window.setTimeout(() => {
    timers.exitTimer = null;
    mutateFn();
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
}

(function tabs() {
  const tabs = [...document.querySelectorAll(".tab")];
  const panels = [...document.querySelectorAll(".panel")];
  const skillsPanelContainer = document.querySelector(".skills-anim");
  if (!tabs.length) return;

  function activate(tab) {
    tabs.forEach((currentTab) => {
      currentTab.classList.remove("is-active");
      currentTab.setAttribute("aria-selected", "false");
      currentTab.tabIndex = -1;
    });

    tab.classList.add("is-active");
    tab.setAttribute("aria-selected", "true");
    tab.tabIndex = 0;

    const panelId = tab.getAttribute("aria-controls");
    const panel = document.getElementById(panelId);

    animateSkillsSwap(skillsPanelContainer, () => {
      panels.forEach((currentPanel) => currentPanel.classList.remove("is-active"));
      if (panel) panel.classList.add("is-active");
    });

    tab.focus();
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => activate(tab));
    tab.addEventListener("keydown", (e) => {
      const idx = tabs.indexOf(tab);
      if (e.key === "ArrowRight") activate(tabs[(idx + 1) % tabs.length]);
      if (e.key === "ArrowLeft") activate(tabs[(idx - 1 + tabs.length) % tabs.length]);
      if (e.key === "Home") activate(tabs[0]);
      if (e.key === "End") activate(tabs[tabs.length - 1]);
    });
  });
})();

const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear().toString();

(function dynamicTitle() {
  const map = {
    "#sobre": "seo.navTitle.about",
    "#skills": "seo.navTitle.skills",
    "#projetos": "seo.navTitle.projects",
    "#experiencia": "seo.navTitle.experience",
    "#sobre-mim": "seo.navTitle.aboutMe"
  };

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", () => {
      const titleKey = map[link.getAttribute("href")];
      if (titleKey) document.title = i18nT(titleKey);
    });
  });
})();

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const id = link.getAttribute("href");
    if (id && id.length > 1) {
      event.preventDefault();
      const target = document.querySelector(id);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});

function buildMailto({ to, subject, body }) {
  const encodedSubject = encodeURIComponent(subject ?? "");
  const encodedBody = encodeURIComponent(body ?? "");
  return `mailto:${to}?subject=${encodedSubject}&body=${encodedBody}`;
}

document.querySelectorAll("a.btn[data-mailto]").forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    window.location.href = buildMailto({
      to: "dgulhak@gmail.com",
      subject: i18nT("contact.mailto.subject"),
      body: i18nT("contact.mailto.body")
    });
  });
});

(function contactModal() {
  const modal = document.getElementById("contactModal");
  if (!modal) return;

  const openBtn = document.getElementById("openContact");
  const closeBtn = document.getElementById("closeContact");

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

  modal.addEventListener("click", (e) => {
    if (e.target === modal) close();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("is-open")) close();
  });
})();

(function aboutRemember() {
  const details = document.querySelector("#aboutDetails");
  if (!details) return;
  const label = details.querySelector(".summary-label");
  const key = details.dataset.remember || "about-open";

  try {
    const saved = localStorage.getItem(key);
    if (saved === "true") details.setAttribute("open", "");
  } catch (_) {}

  const update = () => {
    if (!label) return;
    label.textContent = details.open ? i18nT("sections.aboutToggleHide") : i18nT("sections.aboutToggleShow");
  };
  update();
  details.addEventListener("toggle", () => {
    update();
    try {
      localStorage.setItem(key, details.open ? "true" : "false");
    } catch (_) {}
  });
})();

(function backToTop() {
  const btn = document.getElementById("backToTop");
  if (!btn) return;

  window.addEventListener("scroll", () => {
    const show = window.scrollY > 400;
    btn.classList.toggle("is-visible", show);
  });

  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
})();

(function photoGallery() {
  const triggers = document.querySelectorAll(".js-gallery");
  const modal = document.getElementById("galleryOverlay");
  if (!triggers.length || !modal) return;

  const titleEl = document.getElementById("galleryTitle");
  const imgEl = document.getElementById("galleryImage");
  const captionEl = document.getElementById("galleryCaption");
  const counterEl = document.getElementById("galleryCounter");
  const prevBtn = document.getElementById("galleryPrev");
  const nextBtn = document.getElementById("galleryNext");
  const closeBtn = document.getElementById("closeGallery");

  const galleries = {
    scout: {
      titleKey: "gallery.groups.scout",
      images: [
        { src: i18nAsset("img/scout/cover.jpeg"), altKey: "gallery.scout.cover" },
        { src: i18nAsset("img/scout/acamp_senior.jpeg"), altKey: "gallery.scout.camp" },
        { src: i18nAsset("img/scout/congresso.jpeg"), altKey: "gallery.scout.congresso1" },
        { src: i18nAsset("img/scout/congresso2.jpeg"), altKey: "gallery.scout.congresso2" },
        { src: i18nAsset("img/scout/congresso3.jpeg"), altKey: "gallery.scout.congresso3" },
        { src: i18nAsset("img/scout/congresso4.jpeg"), altKey: "gallery.scout.congresso4" },
        { src: i18nAsset("img/scout/pico_caratuva2.jpeg"), altKey: "gallery.scout.pico" },
        { src: i18nAsset("img/scout/vj_cm.jpeg"), altKey: "gallery.scout.cascavel" }
      ]
    },
    tech: {
      titleKey: "gallery.groups.tech",
      images: [
        { src: i18nAsset("img/tech/cover.jpeg"), altKey: "gallery.tech.cover" },
        { src: i18nAsset("img/tech/arthur_igreja.jpeg"), altKey: "gallery.tech.arthur" },
        { src: i18nAsset("img/tech/conf1.jpeg"), altKey: "gallery.tech.conf1" },
        { src: i18nAsset("img/tech/conf3.jpeg"), altKey: "gallery.tech.conf3" },
        { src: i18nAsset("img/tech/elemar.jpeg"), altKey: "gallery.tech.elemar" },
        { src: i18nAsset("img/tech/guilherme_cavalcanti.jpeg"), altKey: "gallery.tech.guilherme" },
        { src: i18nAsset("img/tech/juliano.jpeg"), altKey: "gallery.tech.juliano" },
        { src: i18nAsset("img/tech/loovi.jpeg"), altKey: "gallery.tech.loovi" },
        { src: i18nAsset("img/tech/meetup.jpeg"), altKey: "gallery.tech.meetup" },
        { src: i18nAsset("img/tech/tdw_palestrantes.jpeg"), altKey: "gallery.tech.tdwSpeakers" },
        { src: i18nAsset("img/tech/tdw.jpeg"), altKey: "gallery.tech.tdwPanel" }
      ]
    }
  };

  let currentGallery = null;
  let currentIndex = 0;

  function updateView() {
    if (!currentGallery) return;
    const gallery = galleries[currentGallery];
    const item = gallery.images[currentIndex];
    if (!item) return;

    const title = i18nT(gallery.titleKey);
    const alt = i18nT(item.altKey);

    imgEl.src = item.src;
    imgEl.alt = alt || title;
    if (titleEl) titleEl.textContent = title;
    if (captionEl) captionEl.textContent = alt || "";
    if (counterEl) counterEl.textContent = i18nT("gallery.counter", {
      current: currentIndex + 1,
      total: gallery.images.length
    });
  }

  function openModal(galleryKey, startIndex) {
    if (!galleries[galleryKey]) return;
    currentGallery = galleryKey;
    currentIndex = startIndex ?? 0;
    updateView();
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function next() {
    if (!currentGallery) return;
    const gallery = galleries[currentGallery];
    currentIndex = (currentIndex + 1) % gallery.images.length;
    updateView();
  }

  function prev() {
    if (!currentGallery) return;
    const gallery = galleries[currentGallery];
    currentIndex = (currentIndex - 1 + gallery.images.length) % gallery.images.length;
    updateView();
  }

  triggers.forEach((figure) => {
    figure.addEventListener("click", () => {
      const galleryKey = figure.dataset.gallery;
      openModal(galleryKey, 0);
    });
    figure.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const galleryKey = figure.dataset.gallery;
        openModal(galleryKey, 0);
      }
    });
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });
  closeBtn?.addEventListener("click", closeModal);
  nextBtn?.addEventListener("click", next);
  prevBtn?.addEventListener("click", prev);

  document.addEventListener("keydown", (e) => {
    if (!modal.classList.contains("is-open")) return;
    if (e.key === "Escape") closeModal();
    if (e.key === "ArrowRight") next();
    if (e.key === "ArrowLeft") prev();
  });
})();
