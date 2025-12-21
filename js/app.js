import { ready } from "./core/dom.js";
import { initSplashScreen } from "./features/splash-screen.js";
import { initTheme } from "./features/theme.js";
import { initPhotosGate } from "./features/photos-gate.js";
import { initProjects } from "./features/projects.js";
import { initSkillsTabs } from "./features/skills-tabs.js";
import { initGalleryModal } from "./features/gallery-modal.js";
import { initBackToTop } from "./features/back-to-top.js";
import { initContactModal } from "./features/contact-modal.js";
import { initSiteEnhancements } from "./features/site.js";

ready(() => {
  initSplashScreen();
  initTheme();
  initPhotosGate();
  initProjects();
  initSkillsTabs();
  initGalleryModal();
  initBackToTop();
  initContactModal();
  initSiteEnhancements();
});
