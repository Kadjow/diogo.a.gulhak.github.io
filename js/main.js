(function themeSetup() {
  const root = document.documentElement;
  const btn = document.getElementById("themeToggle");
  const stored = localStorage.getItem("theme");
  const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;

  if (stored === "light" || (!stored && prefersLight)) {
    root.classList.add("light");
    btn && btn.setAttribute("aria-pressed", "true");
  }

  btn && btn.addEventListener("click", () => {
    const isLight = root.classList.toggle("light");
    localStorage.setItem("theme", isLight ? "light" : "dark");
    btn.setAttribute("aria-pressed", String(isLight));
  });
})();

(function rotatingTyping() {
  const el = document.getElementById("roleRotator");
  if (!el) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const phrases = [
    "um desenvolvedor mobile.",
    "um desenvolvedor full-stack.",
    "um desenvolvedor front-end.",
    "um developer advocate."
  ];
  let p = 0;
  let i = 0;
  let deleting = false;

  function tick() {
    if (reduced) {
      el.textContent = phrases[p];
      p = (p + 1) % phrases.length;
      setTimeout(tick, 2500);
      return;
    }

    const full = phrases[p];

    if (!deleting) {
      i++;
      el.textContent = full.slice(0, i);
      if (i === full.length) {
        deleting = true;
        setTimeout(tick, 1400);
        return;
      }
    } else {
      i--;
      el.textContent = full.slice(0, i);
      if (i === 0) {
        deleting = false;
        p = (p + 1) % phrases.length;
      }
    }

    setTimeout(tick, deleting ? 26 : 54);
  }

  tick();
})();

(function tabs() {
  const tabs = Array.from(document.querySelectorAll(".tab"));
  const panels = Array.from(document.querySelectorAll(".panel"));
  if (!tabs.length) return;

  function activate(tab) {
    tabs.forEach((t) => {
      t.classList.remove("is-active");
      t.setAttribute("aria-selected", "false");
      t.tabIndex = -1;
    });
    panels.forEach((p) => p.classList.remove("is-active"));

    tab.classList.add("is-active");
    tab.setAttribute("aria-selected", "true");
    tab.tabIndex = 0;

    const panelId = tab.getAttribute("aria-controls");
    const panel = panelId ? document.getElementById(panelId) : null;
    if (panel) panel.classList.add("is-active");

    tab.focus();
  }

  tabs.forEach((t) => {
    t.addEventListener("click", () => activate(t));
    t.addEventListener("keydown", (e) => {
      const idx = tabs.indexOf(t);
      if (e.key === "ArrowRight") activate(tabs[(idx + 1) % tabs.length]);
      if (e.key === "ArrowLeft") activate(tabs[(idx - 1 + tabs.length) % tabs.length]);
      if (e.key === "Home") activate(tabs[0]);
      if (e.key === "End") activate(tabs[tabs.length - 1]);
    });
  });
})();

(function projectsModule() {
  const grid = document.getElementById("projectsGrid");
  const filterButtons = document.querySelectorAll("#projectFilters .filter");

  if (!grid || !window.PROJECTS) return;

  function createCard(project) {
    const article = document.createElement("article");
    article.className = `card ${project.accentClass || ""} reveal`;
    article.dataset.tech = project.techs.join(",");

    const head = document.createElement("div");
    head.className = "card-head";

    const title = document.createElement("h3");
    title.textContent = project.name;

    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = project.badge || project.techs[0];

    head.appendChild(title);
    head.appendChild(badge);

    const p = document.createElement("p");
    p.textContent = project.description;

    const actions = document.createElement("div");
    actions.className = "actions";

    const repoLink = document.createElement("a");
    repoLink.className = "btn";
    repoLink.href = project.githubUrl;
    repoLink.target = "_blank";
    repoLink.rel = "noopener";
    repoLink.textContent = "Repositório";
    actions.appendChild(repoLink);

    if (project.readmeUrl) {
      const readmeLink = document.createElement("a");
      readmeLink.className = "btn ghost";
      readmeLink.href = project.readmeUrl;
      readmeLink.target = "_blank";
      readmeLink.rel = "noopener";
      readmeLink.textContent = "README";
      actions.appendChild(readmeLink);
    }

    article.appendChild(head);
    article.appendChild(p);
    article.appendChild(actions);

    return article;
  }

  function setupRevealAnimation() {
    const items = document.querySelectorAll(".card.reveal");
    if (!("IntersectionObserver" in window)) {
      items.forEach((i) => i.classList.add("visible"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    items.forEach((i) => io.observe(i));
  }

  function renderProjects() {
    grid.innerHTML = "";
    const frag = document.createDocumentFragment();
    window.PROJECTS.forEach((project) => {
      const card = createCard(project);
      frag.appendChild(card);
    });
    grid.appendChild(frag);
    setupRevealAnimation();
  }

  function applyFilter(tech) {
    const cards = grid.querySelectorAll(".card");
    cards.forEach((card) => {
      const techs = (card.dataset.tech || "").toLowerCase().split(",");
      const normalized = techs.map((t) => t.trim());
      const show = tech === "all" || normalized.includes(tech.toLowerCase());
      card.style.display = show ? "flex" : "none";
    });
  }

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tech = btn.dataset.tech;

      filterButtons.forEach((b) => {
        b.classList.remove("is-active");
        b.setAttribute("aria-selected", "false");
      });

      btn.classList.add("is-active");
      btn.setAttribute("aria-selected", "true");

      applyFilter(tech || "all");
    });
  });

  renderProjects();
  applyFilter("all");
})();

const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear().toString();

(function dynamicTitle() {
  const map = {
    "#sobre": "Sobre — Diogo Gulhak",
    "#skills": "Skills — Diogo Gulhak",
    "#projetos": "Projetos — Diogo Gulhak",
    "#experiencia": "Experiência — Diogo Gulhak",
    "#sobre-mim": "Quem sou eu — Diogo Gulhak"
  };
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", () => {
      const t = map[a.getAttribute("href") || ""];
      if (t) document.title = t;
    });
  });
})();

document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener("click", (e) => {
    const id = a.getAttribute("href") || "";
    if (id.length > 1) {
      e.preventDefault();
      const target = document.querySelector(id);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});

function buildMailto({ to, subject, body }) {
  const encodedSubject = encodeURIComponent(subject || "");
  const encodedBody = encodeURIComponent(body || "");
  return `mailto:${to}?subject=${encodedSubject}&body=${encodedBody}`;
}

document.querySelectorAll("a.btn[data-mailto]").forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    window.location.href = buildMailto({
      to: "dgulhak@gmail.com",
      subject: "Projeto Mobile — Portfólio",
      body: "Olá Diogo! Vi seu portfólio e gostaria de conversar sobre um projeto. Podemos marcar um papo rápido?\n\nAssunto:\nContexto:\nPrazo:\nOrçamento:"
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

  openBtn && openBtn.addEventListener("click", open);
  closeBtn && closeBtn.addEventListener("click", close);

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
  } catch (e) {}

  const update = () => {
    if (!label) return;
    label.textContent = details.open ? "Esconder sobre mim" : "Mostrar sobre mim";
  };
  update();
  details.addEventListener("toggle", () => {
    update();
    try {
      localStorage.setItem(key, details.open ? "true" : "false");
    } catch (e) {}
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
  const overlay = document.getElementById("galleryOverlay");
  if (!triggers.length || !overlay) return;

  const titleEl = document.getElementById("galleryTitle");
  const imgEl = document.getElementById("galleryImage");
  const captionEl = document.getElementById("galleryCaption");
  const counterEl = document.getElementById("galleryCounter");
  const closeBtn = document.getElementById("closeGallery");
  const prevBtn = document.getElementById("galleryPrev");
  const nextBtn = document.getElementById("galleryNext");

  const galleries = {
    scout: {
      title: "Escotismo — GEAV",
      images: [
        { src: "img/scout/cover.jpeg", alt: "Atividade escoteira em grupo" },
        { src: "img/scout/acamp_senior.jpeg", alt: "Acampamento sênior do grupo escoteiro" },
        { src: "img/scout/congresso.jpeg", alt: "Congresso escoteiro — momento em grupo" },
        { src: "img/scout/congresso2.jpeg", alt: "Congresso escoteiro — registro 2" },
        { src: "img/scout/congresso3.jpeg", alt: "Congresso escoteiro — registro 3" },
        { src: "img/scout/congresso4.jpeg", alt: "Congresso escoteiro — registro 4" },
        { src: "img/scout/pico_caratuva2.jpeg", alt: "Vista do Pico Caratuva" },
        { src: "img/scout/vj_cm.jpeg", alt: "Atividade escoteira em Cascavel" }
      ]
    },
    tech: {
      title: "Tecnologia & Comunidade",
      images: [
        { src: "img/tech/cover.jpeg", alt: "Foto geral em evento de tecnologia" },
        { src: "img/tech/arthur_igreja.jpeg", alt: "Palestra do Arthur Igreja" },
        { src: "img/tech/conf1.jpeg", alt: "Foto em conferência de tecnologia 1" },
        { src: "img/tech/conf3.jpeg", alt: "Foto em conferência de tecnologia 2" },
        { src: "img/tech/elemar.jpeg", alt: "Palestra do Elemar Júnior" },
        { src: "img/tech/guilherme_cavalcanti.jpeg", alt: "Foto com Guilherme Cavalcanti" },
        { src: "img/tech/juliano.jpeg", alt: "Foto com Juliano em evento tech" },
        { src: "img/tech/loovi.jpeg", alt: "Registro em evento Loovi" },
        { src: "img/tech/meetup.jpeg", alt: "Meetup de comunidade de tecnologia" },
        { src: "img/tech/tdw_palestrantes.jpeg", alt: "Palestrantes no TDW" },
        { src: "img/tech/tdw.jpeg", alt: "Foto geral do TDW" }
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

    if (imgEl) {
      imgEl.src = item.src;
      imgEl.alt = item.alt || gallery.title;
    }
    if (titleEl) titleEl.textContent = gallery.title;
    if (captionEl) captionEl.textContent = item.alt || "";
    if (counterEl) counterEl.textContent = `Foto ${currentIndex + 1} de ${gallery.images.length}`;
  }

  function openModal(galleryKey, startIndex) {
    if (!galleries[galleryKey]) return;
    currentGallery = galleryKey;
    currentIndex = startIndex || 0;

    updateView();
    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
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
      const galleryKey = figure.getAttribute("data-gallery");
      if (!galleryKey) return;
      openModal(galleryKey, 0);
    });
  });

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeModal();
  });
  closeBtn && closeBtn.addEventListener("click", closeModal);
  nextBtn && nextBtn.addEventListener("click", next);
  prevBtn && prevBtn.addEventListener("click", prev);

  document.addEventListener("keydown", (e) => {
    if (!overlay.classList.contains("is-open")) return;
    if (e.key === "Escape") closeModal();
    if (e.key === "ArrowRight") next();
    if (e.key === "ArrowLeft") prev();
  });
})();
