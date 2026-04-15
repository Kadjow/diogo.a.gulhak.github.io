(function () {
  const PROJECTS_PER_PAGE = 3;
  const i18n = window.I18N;
  const t = (key, vars) => (i18n && typeof i18n.t === "function" ? i18n.t(key, vars) : key);

  let activeTech = "all";
  let currentPage = 0;
  let filteredProjects = [];

  const grid = document.getElementById("projectsGrid");
  const filterButtons = document.querySelectorAll("#projectFilters .filter");
  const prevBtn = document.getElementById("projectsPrev");
  const nextBtn = document.getElementById("projectsNext");

  if (!grid || !window.PROJECTS) return;

  window.__PROJECTS_MODULE_HANDLED = true;

  function getProjectLabel(project, field, fallback = "") {
    const keyField = `${field}Key`;
    if (project && project[keyField]) return t(project[keyField]);
    if (project && project[field]) return project[field];
    return fallback;
  }

  function localizeFilters() {
    const labels = {
      all: t("sections.projectFilters.all"),
      flutter: t("sections.projectFilters.flutter"),
      "react-native": t("sections.projectFilters.reactNative"),
      web: t("sections.projectFilters.web")
    };

    filterButtons.forEach((button) => {
      const tech = (button.dataset.tech || "").toLowerCase();
      if (labels[tech]) button.textContent = labels[tech];
    });

    if (prevBtn) prevBtn.setAttribute("aria-label", t("a11y.prevProjects"));
    if (nextBtn) nextBtn.setAttribute("aria-label", t("a11y.nextProjects"));
  }

  function createProjectCard(project) {
    const article = document.createElement("article");
    article.className = `card ${project.accentClass || ""}`;
    article.dataset.tech = (project.techs || []).join(",");

    const projectName = getProjectLabel(project, "name");
    const projectDescription = getProjectLabel(project, "description");
    const repoButtonLabel = t("projects.repoButton");
    const readmeButtonLabel = t("projects.readmeButton");

    article.innerHTML = `
      <div class="card-head">
        <h3>${projectName}</h3>
        <span class="badge">${project.badge || (project.techs && project.techs[0]) || ""}</span>
      </div>
      <p class="muted">${projectDescription}</p>
      <div class="actions">
        <a class="btn small ghost" href="${project.githubUrl}" target="_blank" rel="noopener">
          ${repoButtonLabel}
        </a>
        <a class="btn small" href="${project.readmeUrl}" target="_blank" rel="noopener">
          ${readmeButtonLabel}
        </a>
      </div>
    `;

    return article;
  }

  function applyFilter(tech) {
    activeTech = tech;
    currentPage = 0;

    filteredProjects = window.PROJECTS.filter((project) => (
      tech === "all" ? true : (project.techs || []).includes(tech)
    ));

    renderPage("next");
  }

  function renderPage(direction = "next") {
    if (!filteredProjects.length) {
      grid.innerHTML = `<p class="muted">${t("projects.empty")}</p>`;
      if (prevBtn && nextBtn) {
        prevBtn.setAttribute("disabled", "true");
        nextBtn.setAttribute("disabled", "true");
      }
      return;
    }

    const totalPages = Math.ceil(filteredProjects.length / PROJECTS_PER_PAGE);
    if (totalPages <= 0) return;

    currentPage = (currentPage + totalPages) % totalPages;

    const start = currentPage * PROJECTS_PER_PAGE;
    const end = start + PROJECTS_PER_PAGE;
    const pageProjects = filteredProjects.slice(start, end);

    grid.innerHTML = "";

    grid.classList.remove("is-sliding-next", "is-sliding-prev");
    void grid.offsetWidth;

    pageProjects.forEach((project, index) => {
      const card = createProjectCard(project);
      grid.appendChild(card);

      setTimeout(() => {
        card.classList.add("visible");
      }, 80 * index);
    });

    const cls = direction === "prev" ? "is-sliding-prev" : "is-sliding-next";
    grid.classList.add(cls);

    if (prevBtn && nextBtn) {
      if (totalPages <= 1) {
        prevBtn.setAttribute("disabled", "true");
        nextBtn.setAttribute("disabled", "true");
      } else {
        prevBtn.removeAttribute("disabled");
        nextBtn.removeAttribute("disabled");
      }
    }
  }

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      filterButtons.forEach((otherButton) => {
        otherButton.classList.remove("is-active");
        otherButton.setAttribute("aria-selected", "false");
      });

      button.classList.add("is-active");
      button.setAttribute("aria-selected", "true");

      const tech = button.dataset.tech || "all";
      applyFilter(tech);
    });
  });

  prevBtn?.addEventListener("click", () => {
    if (!filteredProjects.length) return;
    const totalPages = Math.ceil(filteredProjects.length / PROJECTS_PER_PAGE);
    if (totalPages <= 1) return;

    currentPage = (currentPage - 1 + totalPages) % totalPages;
    renderPage("prev");
  });

  nextBtn?.addEventListener("click", () => {
    if (!filteredProjects.length) return;
    const totalPages = Math.ceil(filteredProjects.length / PROJECTS_PER_PAGE);
    if (totalPages <= 1) return;

    currentPage = (currentPage + 1) % totalPages;
    renderPage("next");
  });

  document.addEventListener("DOMContentLoaded", () => {
    localizeFilters();
    filteredProjects = window.PROJECTS.slice();
    applyFilter(activeTech);
  });
})();
