(function () {
  const SPLASH_DURATION = 5800;
  const REMOVE_FALLBACK = 1200;
  const SPLASH_TEMPLATE = 'splash.html';

  function hideSplash(splash) {
    if (!splash) return;

    splash.classList.add('splash--hidden');
    splash.addEventListener('transitionend', () => splash.remove(), { once: true });
    setTimeout(() => splash.remove(), REMOVE_FALLBACK);
  }

  async function injectSplash() {
    try {
      const response = await fetch(SPLASH_TEMPLATE, { cache: 'no-cache' });
      if (!response.ok) return null;

      const markup = await response.text();
      const wrapper = document.createElement('div');
      wrapper.innerHTML = markup.trim();

      const nodes = Array.from(wrapper.children);
      if (!nodes.length) return null;

      const fragment = document.createDocumentFragment();
      nodes.forEach((node) => fragment.appendChild(node));
      document.body.prepend(fragment);

      return nodes.find((node) => node.classList.contains('splash')) || null;
    } catch (error) {
      console.error('Splash screen load error:', error);
      return null;
    }
  }

  window.addEventListener('load', async () => {
    const existingSplash = document.querySelector('.splash');
    const splash = existingSplash || (await injectSplash());

    if (!splash) return;

    setTimeout(() => hideSplash(splash), SPLASH_DURATION);
  });
})();
