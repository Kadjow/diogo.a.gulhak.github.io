import { SELECTORS } from "../core/config.js";

const galleries = {
  scout: {
    title: "Escotismo — GEAV",
    images: [
      { src: "img/scout/cover.jpeg", alt: "Atividade escoteira em grupo" },
      { src: "img/scout/acamp_senior.jpeg", alt: "Acampamento sênior do grupo escoteiro" },
      { src: "img/scout/congresso.jpeg", alt: "Congresso escoteiro — registro 1" },
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
      { src: "img/tech/cover.jpeg", alt: "Evento de tecnologia" },
      { src: "img/tech/arthur_igreja.jpeg", alt: "Palestra com Arthur Igreja" },
      { src: "img/tech/conf1.jpeg", alt: "Conferência de tecnologia 1" },
      { src: "img/tech/conf3.jpeg", alt: "Conferência de tecnologia 3" },
      { src: "img/tech/elemar.jpeg", alt: "Palestra com Elemar" },
      { src: "img/tech/guilherme_cavalcanti.jpeg", alt: "Palestra com Guilherme Cavalcanti" },
      { src: "img/tech/juliano.jpeg", alt: "Palestra com Juliano" },
      { src: "img/tech/loovi.jpeg", alt: "Evento Loovi" },
      { src: "img/tech/meetup.jpeg", alt: "Meetup de tecnologia" },
      { src: "img/tech/tdw_palestrantes.jpeg", alt: "Palestrantes do TDW" },
      { src: "img/tech/tdw.jpeg", alt: "Painel no TDW" }
    ]
  }
};

export function initGalleryModal() {
  const triggers = Array.from(document.querySelectorAll(SELECTORS.gallery.triggers));
  const modal = document.querySelector(SELECTORS.gallery.overlay);
  if (!triggers.length || !modal) return;

  const imageEl = document.querySelector(SELECTORS.gallery.image);
  const captionEl = document.querySelector(SELECTORS.gallery.caption);
  const counterEl = document.querySelector(SELECTORS.gallery.counter);
  const titleEl = document.querySelector(SELECTORS.gallery.title);
  const prevBtn = document.querySelector(SELECTORS.gallery.prev);
  const nextBtn = document.querySelector(SELECTORS.gallery.next);
  const closeBtn = document.querySelector(SELECTORS.gallery.close);

  let currentGallery = null;
  let currentIndex = 0;

  const updateView = () => {
    if (!currentGallery) return;
    const gallery = galleries[currentGallery];
    const item = gallery?.images?.[currentIndex];
    if (!gallery || !item) return;

    if (imageEl) {
      imageEl.src = item.src;
      imageEl.alt = item.alt || gallery.title;
    }
    if (titleEl) titleEl.textContent = gallery.title;
    if (captionEl) captionEl.textContent = item.alt || "";
    if (counterEl) counterEl.textContent = `Foto ${currentIndex + 1} de ${gallery.images.length}`;
  };

  const openModal = (galleryKey, startIdx = 0) => {
    if (!galleries[galleryKey]) return;
    currentGallery = galleryKey;
    currentIndex = startIdx;
    updateView();
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };

  const next = () => {
    if (!currentGallery) return;
    const gallery = galleries[currentGallery];
    currentIndex = (currentIndex + 1) % gallery.images.length;
    updateView();
  };

  const prev = () => {
    if (!currentGallery) return;
    const gallery = galleries[currentGallery];
    currentIndex = (currentIndex - 1 + gallery.images.length) % gallery.images.length;
    updateView();
  };

  triggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const key = trigger.dataset.gallery;
      if (!key) return;
      openModal(key, 0);
    });
    trigger.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        trigger.click();
      }
    });
  });

  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });

  closeBtn?.addEventListener("click", closeModal);
  nextBtn?.addEventListener("click", next);
  prevBtn?.addEventListener("click", prev);

  document.addEventListener("keydown", (event) => {
    if (!modal.classList.contains("is-open")) return;
    if (event.key === "Escape") closeModal();
    if (event.key === "ArrowRight") next();
    if (event.key === "ArrowLeft") prev();
  });
}
