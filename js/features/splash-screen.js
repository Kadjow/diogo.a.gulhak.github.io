const promptText = 'diogo@portfolio:~$ ';
const commandText = 'sh start_portfolio.sh';
const bootLogs = [
  '[    0.000] Loading Flutter environment...',
  '[    0.003] Initializing React Native modules...',
  '[    0.006] Connecting to Firebase services...',
  '[    0.010] Fetching portfolio projects...',
  '[    0.015] Applying dark theme...',
  '[    0.017] Preparing Angular dashboards...',
  '[    0.020] Starting Diogo Gulhak portfolio UI...'
];
const finalLine = 'Initialising Diogo Gulhak portfolio UI...';
const FINAL_LINE_HOLD_TIME = 2000;

const randomDelay = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const scrollTerm = (term) => {
  term.scrollTop = term.scrollHeight;
};

const appendLine = (term, cursor, text) => {
  const line = document.createTextNode('\n' + text);
  term.insertBefore(line, cursor);
  scrollTerm(term);
};

const printLogs = (term, cursor, lines, onDone, index = 0) => {
  if (index >= lines.length) {
    onDone();
    return;
  }
  const delay = randomDelay(140, 260);
  window.setTimeout(() => {
    appendLine(term, cursor, lines[index]);
    printLogs(term, cursor, lines, onDone, index + 1);
  }, delay);
};

const typeCommand = (term, commandSpan, cursor, command, onDone) => {
  let index = 0;
  const tick = () => {
    if (index < command.length) {
      commandSpan.textContent += command[index];
      scrollTerm(term);
      index += 1;
      window.setTimeout(tick, randomDelay(60, 120));
      return;
    }

    window.setTimeout(() => {
      appendLine(term, cursor, '');
      onDone();
    }, 200);
  };

  window.setTimeout(tick, 300);
};

const fadeOutSplash = (body, splash) => {
  body.classList.remove('is-loading');
  body.classList.add('is-loaded');

  splash.classList.add('is-fading');

  const removeSplash = () => splash.remove();
  splash.addEventListener('transitionend', removeSplash, { once: true });

  window.setTimeout(removeSplash, 1200);
};

export function initSplashScreen() {
  const body = document.body;
  if (!body) return;

  if (!body.classList.contains('is-loading')) {
    body.classList.add('is-loading');
  }

  const existing = document.getElementById('portfolio-splash');
  const splash = existing || document.createElement('div');
  splash.className = 'load';
  splash.id = 'portfolio-splash';
  splash.innerHTML = '';

  const term = document.createElement('pre');
  term.className = 'term';
  term.setAttribute('aria-label', 'Terminal de inicialização do portfólio');
  term.textContent = promptText;

  const commandSpan = document.createElement('span');
  const cursor = document.createElement('span');
  cursor.className = 'cursor';
  cursor.textContent = '_';

  term.appendChild(commandSpan);
  term.appendChild(cursor);

  splash.appendChild(term);
  if (!existing) {
    body.appendChild(splash);
  }

  typeCommand(term, commandSpan, cursor, commandText, () => {
    printLogs(term, cursor, bootLogs, () => {
      appendLine(term, cursor, finalLine);
      window.setTimeout(() => {
        fadeOutSplash(body, splash);
      }, FINAL_LINE_HOLD_TIME);
    });
  });
}
