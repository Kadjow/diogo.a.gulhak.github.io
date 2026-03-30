(function i18nBootstrap() {
  const FALLBACK_LOCALE = "pt-BR";
  const ENGLISH_LOCALE = "en";
  const locales = window.__I18N_LOCALES || {};

  function getPathSegments() {
    const pathname = window.location.pathname || "/";
    return pathname.split("/").filter(Boolean);
  }

  function resolvePathContext() {
    const segments = getPathSegments();
    const lower = segments.map((segment) => segment.toLowerCase());
    const enIndex = lower.indexOf(ENGLISH_LOCALE);
    const hasIndexHtml = lower[lower.length - 1] === "index.html";
    const isLocaleRoute = enIndex !== -1 && (enIndex === lower.length - 1 || (hasIndexHtml && enIndex === lower.length - 2));
    const baseSegments = isLocaleRoute ? segments.slice(0, enIndex) : (hasIndexHtml ? segments.slice(0, -1) : segments);
    const basePath = baseSegments.length ? `/${baseSegments.join("/")}/` : "/";

    return {
      isLocaleRoute,
      locale: isLocaleRoute ? ENGLISH_LOCALE : FALLBACK_LOCALE,
      basePath
    };
  }

  const pathContext = resolvePathContext();
  let currentLocale = pathContext.locale;

  function getLocaleData(locale) {
    return locales[locale] || null;
  }

  function getNestedValue(source, key) {
    return key.split(".").reduce((acc, part) => {
      if (acc && typeof acc === "object" && part in acc) return acc[part];
      return undefined;
    }, source);
  }

  function interpolate(template, vars) {
    if (typeof template !== "string" || !vars || typeof vars !== "object") return template;
    return template.replace(/\{(\w+)\}/g, (_, token) => {
      if (token in vars) return String(vars[token]);
      return `{${token}}`;
    });
  }

  function t(key, vars, localeOverride) {
    const locale = localeOverride || currentLocale;
    const localeData = getLocaleData(locale);
    const fallbackData = getLocaleData(FALLBACK_LOCALE);

    const value = getNestedValue(localeData, key);
    if (value !== undefined) return interpolate(value, vars);

    const fallbackValue = getNestedValue(fallbackData, key);
    if (fallbackValue !== undefined) return interpolate(fallbackValue, vars);

    return key;
  }

  function localePath(locale) {
    if (locale === ENGLISH_LOCALE) return `${pathContext.basePath}en/`;
    return pathContext.basePath;
  }

  function absoluteUrl(path) {
    const origin = window.location.origin && window.location.origin !== "null" ? window.location.origin : "";
    return `${origin}${path}`;
  }

  function updateSeoLinks() {
    const canonical = document.getElementById("canonicalLink");
    const altPt = document.getElementById("altPtLink");
    const altEn = document.getElementById("altEnLink");
    const altDefault = document.getElementById("altDefaultLink");

    const ptPath = localePath(FALLBACK_LOCALE);
    const enPath = localePath(ENGLISH_LOCALE);
    const currentPath = localePath(currentLocale);

    if (canonical) canonical.setAttribute("href", absoluteUrl(currentPath));
    if (altPt) altPt.setAttribute("href", absoluteUrl(ptPath));
    if (altEn) altEn.setAttribute("href", absoluteUrl(enPath));
    if (altDefault) altDefault.setAttribute("href", absoluteUrl(ptPath));
  }

  function setLanguageSwitcherLinks() {
    const ptLink = document.getElementById("langPtLink");
    const enLink = document.getElementById("langEnLink");
    const container = document.getElementById("localeSwitch");

    if (ptLink) {
      ptLink.setAttribute("href", localePath(FALLBACK_LOCALE));
      ptLink.textContent = t("locale.pt");
    }
    if (enLink) {
      enLink.setAttribute("href", localePath(ENGLISH_LOCALE));
      enLink.textContent = t("locale.en");
    }

    if (container) container.setAttribute("aria-label", t("locale.switcherAria"));
  }

  function applyDomTranslations() {
    document.documentElement.lang = currentLocale === ENGLISH_LOCALE ? "en" : "pt-BR";
    document.title = t("seo.title");

    const description = document.querySelector('meta[name="description"]');
    if (description) description.setAttribute("content", t("seo.description"));

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute("content", t("seo.ogTitle"));

    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) ogDescription.setAttribute("content", t("seo.ogDescription"));

    const ogLocale = document.querySelector('meta[property="og:locale"]');
    if (ogLocale) ogLocale.setAttribute("content", t("seo.ogLocale"));

    document.querySelectorAll("[data-i18n]").forEach((node) => {
      const key = node.getAttribute("data-i18n");
      if (!key) return;
      node.textContent = t(key);
    });

    document.querySelectorAll("[data-i18n-html]").forEach((node) => {
      const key = node.getAttribute("data-i18n-html");
      if (!key) return;
      node.innerHTML = t(key);
    });

    document.querySelectorAll("[data-i18n-aria-label]").forEach((node) => {
      const key = node.getAttribute("data-i18n-aria-label");
      if (!key) return;
      node.setAttribute("aria-label", t(key));
    });

    document.querySelectorAll("[data-i18n-title]").forEach((node) => {
      const key = node.getAttribute("data-i18n-title");
      if (!key) return;
      node.setAttribute("title", t(key));
    });

    document.querySelectorAll("[data-i18n-alt]").forEach((node) => {
      const key = node.getAttribute("data-i18n-alt");
      if (!key) return;
      node.setAttribute("alt", t(key));
    });

    document.querySelectorAll("[data-i18n-content]").forEach((node) => {
      const key = node.getAttribute("data-i18n-content");
      if (!key) return;
      node.setAttribute("content", t(key));
    });

    setLanguageSwitcherLinks();
    updateSeoLinks();
  }

  function setLocale(locale) {
    if (!getLocaleData(locale)) return;
    currentLocale = locale;
    applyDomTranslations();
  }

  function assetPath(relativePath) {
    const normalized = String(relativePath || "").replace(/^\/+/, "");
    return `${pathContext.basePath}${normalized}`;
  }

  window.I18N = {
    fallbackLocale: FALLBACK_LOCALE,
    getLocale: () => currentLocale,
    setLocale,
    localePath,
    assetPath,
    t,
    applyDomTranslations
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyDomTranslations, { once: true });
  } else {
    applyDomTranslations();
  }
})();
