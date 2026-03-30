(function () {
  const body = document.body;
  if (!body.classList.contains("is-loading")) {
    body.classList.add("is-loading");
  }

  const i18n = window.I18N;
  const t = (key) => (i18n && typeof i18n.t === "function" ? i18n.t(key) : key);

  const promptText = t("splash.promptText");
  const commandText = t("splash.commandText");
  const bootLogs = t("splash.bootLogs");
  const finalLine = t("splash.finalLine");

  const FINAL_LINE_HOLD_TIME = 2000;

  function initSplash() {
    const existing = document.getElementById("portfolio-splash");
    const splash = existing || document.createElement("div");
    splash.className = "load";
    splash.id = "portfolio-splash";
    splash.innerHTML = "";

    const term = document.createElement("pre");
    term.className = "term";
    term.setAttribute("aria-label", t("splash.ariaLabel"));
    term.textContent = promptText;

    const commandSpan = document.createElement("span");
    const cursor = document.createElement("span");
    cursor.className = "cursor";
    cursor.textContent = "_";

    term.appendChild(commandSpan);
    term.appendChild(cursor);

    splash.appendChild(term);
    if (!existing) {
      document.body.appendChild(splash);
    }

    typeCommand(term, commandSpan, cursor, commandText, () => {
      printLogs(term, cursor, Array.isArray(bootLogs) ? bootLogs : [], () => {
        appendLine(term, cursor, finalLine);

        setTimeout(() => {
          fadeOutSplash(splash);
        }, FINAL_LINE_HOLD_TIME);
      });
    });
  }

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

      setTimeout(() => {
        appendLine(term, cursor, "");
        onDone();
      }, 200);
    };

    setTimeout(tick, 300);
  }

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

  function appendLine(term, cursor, text) {
    const line = document.createTextNode(`\n${text}`);
    term.insertBefore(line, cursor);
    scrollTerm(term);
  }

  function fadeOutSplash(splash) {
    body.classList.remove("is-loading");
    body.classList.add("is-loaded");

    splash.classList.add("is-fading");

    const removeSplash = () => splash.remove();
    splash.addEventListener("transitionend", removeSplash, { once: true });

    setTimeout(removeSplash, 1200);
  }

  function scrollTerm(term) {
    term.scrollTop = term.scrollHeight;
  }

  function randomDelay(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  document.addEventListener("DOMContentLoaded", initSplash);
})();
