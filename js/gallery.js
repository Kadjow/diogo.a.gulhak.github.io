(function galleryModule() {
  const triggers = document.querySelectorAll(".js-gallery");
  const galleryModal = document.getElementById("galleryOverlay");
  const humanModal = document.getElementById("humanCheckOverlay");
  if (!triggers.length || !galleryModal || !humanModal) return;

  const imgEl = document.getElementById("galleryImage");
  const captionEl = document.getElementById("galleryCaption");
  const counterEl = document.getElementById("galleryCounter");
  const titleEl = document.getElementById("galleryTitle");

  const closeGalleryBtn = document.getElementById("closeGallery");
  const prevBtn = document.getElementById("galleryPrev");
  const nextBtn = document.getElementById("galleryNext");

  const humanStatus = document.getElementById("humanStatusText");
  const humanJoke = document.getElementById("humanJokeText");
  const humanActions = document.getElementById("humanActions");
  const humanConfirm = document.getElementById("humanConfirm");
  const closeHumanBtn = document.getElementById("closeHumanCheck");

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
        { src: "img/scout/pico_caratuva.jpeg", alt: "Trilha até o Pico Caratuva" },
        { src: "img/scout/pico_caratuva2.jpeg", alt: "Vista do Pico Caratuva" },
        { src: "img/scout/vj_cm.jpeg", alt: "Atividade escoteira em Cascavel" }
      ]
    },
    tech: {
      title: "Tecnologia & Comunidade",
      images: [
        { src: "img/tech/cover.jpeg", alt: "Evento de tecnologia" },
        { src: "img/tech/??.jpeg", alt: "Registro em evento de tecnologia" },
        { src: "img/tech/arthur_igreja.jpeg", alt: "Palestra com Arthur Igreja" },
        { src: "img/tech/conf1.jpeg", alt: "Conferência de tecnologia 1" },
        { src: "img/tech/conf3.jpeg", alt: "Conferência de tecnologia 3" },
        { src: "img/tech/elemar.jpeg", alt: "Foto com Elemar" },
        { src: "img/tech/guilherme_cavalcanti.jpeg", alt: "Foto com Guilherme Cavalcanti" },
        { src: "img/tech/juliano.jpeg", alt: "Registro com Juliano" },
        { src: "img/tech/loovj.jpeg", alt: "Foto em evento Loovj" },
        { src: "img/tech/meetup.jpeg", alt: "Meetup de tecnologia" },
        { src: "img/tech/tdw_palestrantes.jpeg", alt: "Time de palestrantes no TDW" },
        { src: "img/tech/tdw.jpeg", alt: "Foto geral do TDW" }
      ]
    }
  };

  let currentGallery = null;
  let currentIndex = 0;
  let pendingGalleryKey = null;
  let humanVerified = false;

  try {
    humanVerified = localStorage.getItem("human-gallery-ok") === "1";
  } catch (_) {
    humanVerified = false;
  }

  function updateView() {
    if (!currentGallery) return;
    const gallery = galleries[currentGallery];
    const item = gallery.images[currentIndex];
    if (!item) return;

    imgEl.src = item.src;
    imgEl.alt = item.alt || gallery.title;
    titleEl.textContent = gallery.title;
    captionEl.textContent = item.alt || "";
    counterEl.textContent = `Foto ${currentIndex + 1} de ${gallery.images.length}`;
  }

  function openGallery(galleryKey, startIndex) {
    if (!galleries[galleryKey]) return;
    currentGallery = galleryKey;
    currentIndex = startIndex ?? 0;

    updateView();
    galleryModal.classList.add("is-open");
    galleryModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeGallery() {
    galleryModal.classList.remove("is-open");
    galleryModal.setAttribute("aria-hidden", "true");
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

  function openHumanCheck(galleryKey) {
    pendingGalleryKey = galleryKey;
    humanStatus.textContent = "Verificando...";
    humanJoke.classList.add("hidden");
    humanActions.classList.add("hidden");

    humanModal.classList.add("is-open");
    humanModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    setTimeout(() => {
      humanStatus.textContent = "Brincadeira 😄";
      humanJoke.classList.remove("hidden");
      humanActions.classList.remove("hidden");
    }, 1400);
  }

  function closeHumanCheck() {
    humanModal.classList.remove("is-open");
    humanModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function confirmHuman() {
    humanVerified = true;
    try {
      localStorage.setItem("human-gallery-ok", "1");
    } catch (_) {}
    closeHumanCheck();
    if (pendingGalleryKey) {
      openGallery(pendingGalleryKey, 0);
      pendingGalleryKey = null;
    }
  }

  triggers.forEach(figure => {
    figure.addEventListener("click", () => {
      const galleryKey = figure.dataset.gallery;
      if (!galleryKey) return;

      if (!humanVerified) {
        openHumanCheck(galleryKey);
      } else {
        openGallery(galleryKey, 0);
      }
    });

    figure.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        figure.click();
      }
    });
  });

  galleryModal.addEventListener("click", e => {
    if (e.target === galleryModal) closeGallery();
  });

  humanModal.addEventListener("click", e => {
    if (e.target === humanModal) closeHumanCheck();
  });

  closeGalleryBtn?.addEventListener("click", closeGallery);
  prevBtn?.addEventListener("click", prev);
  nextBtn?.addEventListener("click", next);

  closeHumanBtn?.addEventListener("click", closeHumanCheck);
  humanConfirm?.addEventListener("click", confirmHuman);

  document.addEventListener("keydown", e => {
    if (galleryModal.classList.contains("is-open")) {
      if (e.key === "Escape") closeGallery();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    } else if (humanModal.classList.contains("is-open")) {
      if (e.key === "Escape") closeHumanCheck();
    }
  });
})();
