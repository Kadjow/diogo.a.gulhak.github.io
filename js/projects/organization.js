(function () {
  const PROJECTS_PER_PAGE = 3;

  let activeTech = 'all';
  let currentPage = 0;
  let filteredProjects = [];

  const grid = document.getElementById('projectsGrid');
  const filterButtons = document.querySelectorAll('#projectFilters .filter');
  const prevBtn = document.getElementById('projectsPrev');
  const nextBtn = document.getElementById('projectsNext');

  if (!grid || !window.PROJECTS) return;

  function createProjectCard(project) {
    const article = document.createElement('article');
    article.className = `card ${project.accentClass || ''}`;
    article.dataset.tech = (project.techs || []).join(',');

    article.innerHTML = `
      <div class="card-head">
        <h3>${project.name}</h3>
        <span class="badge">${project.badge}</span>
      </div>
      <p class="muted">${project.description}</p>
      <div class="actions">
        <a class="btn small ghost" href="${project.githubUrl}" target="_blank" rel="noopener">
          Repositório
        </a>
        <a class="btn small" href="${project.readmeUrl}" target="_blank" rel="noopener">
          README
        </a>
      </div>
    `;

    return article;
  }

  function applyFilter(tech) {
    activeTech = tech;
    currentPage = 0;

    filteredProjects = window.PROJECTS.filter(p =>
      tech === 'all' ? true : p.techs.includes(tech)
    );

    renderPage('next');
  }

  function renderPage(direction = 'next') {
    if (!filteredProjects.length) {
      grid.innerHTML = `<p class="muted">Nenhum projeto encontrado para esse filtro.</p>`;
      if (prevBtn && nextBtn) {
        prevBtn.setAttribute('disabled', 'true');
        nextBtn.setAttribute('disabled', 'true');
      }
      return;
    }

    const totalPages = Math.ceil(filteredProjects.length / PROJECTS_PER_PAGE);
    if (totalPages <= 0) return;

    currentPage = (currentPage + totalPages) % totalPages;

    const start = currentPage * PROJECTS_PER_PAGE;
    const end = start + PROJECTS_PER_PAGE;
    const pageProjects = filteredProjects.slice(start, end);

    grid.innerHTML = '';

    grid.classList.remove('is-sliding-next', 'is-sliding-prev');
    void grid.offsetWidth; 

    pageProjects.forEach((project, index) => {
      const card = createProjectCard(project);
      grid.appendChild(card);

      setTimeout(() => {
        card.classList.add('visible');
      }, 80 * index); // 0ms, 80ms, 160ms...
    });

    const cls = direction === 'prev' ? 'is-sliding-prev' : 'is-sliding-next';
    grid.classList.add(cls);

    if (prevBtn && nextBtn) {
      if (totalPages <= 1) {
        prevBtn.setAttribute('disabled', 'true');
        nextBtn.setAttribute('disabled', 'true');
      } else {
        prevBtn.removeAttribute('disabled');
        nextBtn.removeAttribute('disabled');
      }
    }
  }

  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => {
        b.classList.remove('is-active');
        b.setAttribute('aria-selected', 'false');
      });

      btn.classList.add('is-active');
      btn.setAttribute('aria-selected', 'true');

      const tech = btn.dataset.tech || 'all';
      applyFilter(tech);
    });
  });

  prevBtn?.addEventListener('click', () => {
    if (!filteredProjects.length) return;
    const totalPages = Math.ceil(filteredProjects.length / PROJECTS_PER_PAGE);
    if (totalPages <= 1) return;

    currentPage = (currentPage - 1 + totalPages) % totalPages;
    renderPage('prev');
  });

  nextBtn?.addEventListener('click', () => {
    if (!filteredProjects.length) return;
    const totalPages = Math.ceil(filteredProjects.length / PROJECTS_PER_PAGE);
    if (totalPages <= 1) return;

    currentPage = (currentPage + 1) % totalPages;
    renderPage('next');
  });

  document.addEventListener('DOMContentLoaded', () => {
    filteredProjects = window.PROJECTS.slice();
    renderPage('next');
  });
})();
