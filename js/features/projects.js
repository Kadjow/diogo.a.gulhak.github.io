import { SELECTORS } from "../core/config.js";
import { PROJECTS } from "./projects-data.js";

const PROJECTS_PER_PAGE = 3;

const createProjectCard = (project) => {
  const article = document.createElement("article");
  article.className = `card ${project.accentClass || ""}`.trim();
  article.dataset.tech = (project.techs || []).join(",");

  const head = document.createElement("div");
  head.className = "card-head";

  const title = document.createElement("h3");
  title.textContent = project.name;

  const badge = document.createElement("span");
  badge.className = "badge";
  badge.textContent = project.badge || (project.techs || [])[0] || "";

  head.append(title, badge);

  const description = document.createElement("p");
  description.className = "muted";
  description.textContent = project.description;

  const actions = document.createElement("div");
  actions.className = "actions";

  const repoLink = document.createElement("a");
  repoLink.className = "btn small ghost";
  repoLink.href = project.githubUrl;
  repoLink.target = "_blank";
  repoLink.rel = "noopener";
  repoLink.textContent = "Repositório";
  actions.appendChild(repoLink);

  if (project.readmeUrl) {
    const readmeLink = document.createElement("a");
    readmeLink.className = "btn small";
    readmeLink.href = project.readmeUrl;
    readmeLink.target = "_blank";
    readmeLink.rel = "noopener";
    readmeLink.textContent = "README";
    actions.appendChild(readmeLink);
  }

  article.append(head, description, actions);
  return article;
};

export function initProjects() {
  const grid = document.querySelector(SELECTORS.projects.grid);
  const filterButtons = Array.from(document.querySelectorAll(SELECTORS.projects.filters));
  const prevBtn = document.querySelector(SELECTORS.projects.prev);
  const nextBtn = document.querySelector(SELECTORS.projects.next);

  if (!grid || !filterButtons.length || !PROJECTS.length) return;

  let activeTech = "all";
  let currentPage = 0;
  let filteredProjects = PROJECTS.slice();

  const updatePaginationButtons = (totalPages) => {
    if (!prevBtn || !nextBtn) return;
    if (totalPages <= 1) {
      prevBtn.setAttribute("disabled", "true");
      nextBtn.setAttribute("disabled", "true");
      return;
    }
    prevBtn.removeAttribute("disabled");
    nextBtn.removeAttribute("disabled");
  };

  const renderPage = (direction = "next") => {
    if (!filteredProjects.length) {
      grid.innerHTML = `<p class="muted">Nenhum projeto encontrado para esse filtro.</p>`;
      updatePaginationButtons(0);
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
      window.setTimeout(() => {
        card.classList.add("visible");
      }, 80 * index);
    });

    const directionClass = direction === "prev" ? "is-sliding-prev" : "is-sliding-next";
    grid.classList.add(directionClass);

    updatePaginationButtons(totalPages);
  };

  const applyFilter = (tech) => {
    activeTech = tech;
    currentPage = 0;
    filteredProjects = PROJECTS.filter((project) =>
      tech === "all" ? true : (project.techs || []).includes(tech)
    );
    renderPage("next");
  };

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      filterButtons.forEach((btn) => {
        btn.classList.remove("is-active");
        btn.setAttribute("aria-selected", "false");
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

  renderPage("next");
}
