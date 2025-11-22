(function () {
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

  /**
   * Creates the splash DOM nodes and kicks off the typing + log flow.
   */
  function initSplash() {
    document.body.classList.add('splash-active');

    const splash = document.createElement('div');
    splash.className = 'load';
    splash.id = 'portfolio-splash';

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
    document.body.appendChild(splash);

    typeCommand(term, commandSpan, cursor, commandText, () => {
      printLogs(term, cursor, bootLogs, () => {
        appendLine(term, cursor, finalLine);
        fadeOutSplash(splash);
      });
    });
  }

  /**
   * Types the command text character by character.
   */
  function typeCommand(term, commandSpan, cursor, command, onDone) {
    let index = 0;

    const tick = () => {
      if (index < command.length) {
        commandSpan.textContent += command[index];
        scrollTerm(term);
        index += 1;
        setTimeout(tick, randomDelay(60, 120));
        return;
      }

      // After finishing the command, add a new line and move on.
      setTimeout(() => {
        appendLine(term, cursor, '');
        onDone();
      }, 200);
    };

    setTimeout(tick, 300);
  }

  /**
   * Prints each boot log line with slight random delays.
   */
  function printLogs(term, cursor, lines, onDone, index = 0) {
    if (index >= lines.length) {
      onDone();
      return;
    }

    const delay = randomDelay(140, 260);
    setTimeout(() => {
      appendLine(term, cursor, lines[index]);
      printLogs(term, cursor, lines, onDone, index + 1);
    }, delay);
  }

  /**
   * Adds a text line above the cursor and keeps the terminal scrolled.
   */
  function appendLine(term, cursor, text) {
    const line = document.createTextNode('\n' + text);
    term.insertBefore(line, cursor);
    scrollTerm(term);
  }

  /**
   * Smoothly fades out the splash and removes it from the DOM.
   */
  function fadeOutSplash(splash) {
    splash.classList.add('is-fading');

    const removeSplash = () => {
      document.body.classList.remove('splash-active');
      splash.remove();
    };
    splash.addEventListener('transitionend', removeSplash, { once: true });

    // Fallback removal in case transitionend doesn't fire.
    setTimeout(removeSplash, 1200);
  }

  function scrollTerm(term) {
    term.scrollTop = term.scrollHeight;
  }

  function randomDelay(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  window.addEventListener('load', initSplash);
})();
