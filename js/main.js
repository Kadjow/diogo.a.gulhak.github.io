(function themeSetup(){
  const root = document.documentElement;
  const btn = document.getElementById('themeToggle');
  const stored = localStorage.getItem('theme');
  const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
  if (stored === 'light' || (!stored && prefersLight)) {
    root.classList.add('light'); btn.setAttribute('aria-pressed','true');
  }
  btn.addEventListener('click', () => {
    const isLight = root.classList.toggle('light');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    btn.setAttribute('aria-pressed', String(isLight));
  });
})();

(function rotatingTyping(){
  const el = document.getElementById('roleRotator');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const phrases = [
    'um desenvolvedor mobile.',
    'um desenvolvedor full-stack.',
    'um desenvolvedor front-end.',
    'um developer advocate.'
  ];
  let p = 0, i = 0, deleting = false;

  function tick(){
    if (reduced){
      el.textContent = phrases[p];
      p = (p + 1) % phrases.length;
      return setTimeout(tick, 2500);
    }
    const full = phrases[p];
    if (!deleting){
      i++; el.textContent = full.slice(0, i);
      if (i === full.length){ deleting = true; return setTimeout(tick, 1400); }
    } else {
      i--; el.textContent = full.slice(0, i);
      if (i === 0){ deleting = false; p = (p + 1) % phrases.length; }
    }
    setTimeout(tick, deleting ? 26 : 54);
  }
  tick();
})();

(function tabs(){
  const tabs = [...document.querySelectorAll('.tab')];
  const panels = [...document.querySelectorAll('.panel')];

  function activate(tab){
    tabs.forEach(t => { t.classList.remove('is-active'); t.setAttribute('aria-selected','false'); t.tabIndex = -1; });
    panels.forEach(p => p.classList.remove('is-active'));
    tab.classList.add('is-active'); tab.setAttribute('aria-selected','true'); tab.tabIndex = 0;
    document.getElementById(tab.getAttribute('aria-controls')).classList.add('is-active');
    tab.focus();
  }

  tabs.forEach((t) => {
    t.addEventListener('click', () => activate(t));
    t.addEventListener('keydown', (e) => {
      const idx = tabs.indexOf(t);
      if (e.key === 'ArrowRight') activate(tabs[(idx+1)%tabs.length]);
      if (e.key === 'ArrowLeft')  activate(tabs[(idx-1+tabs.length)%tabs.length]);
      if (e.key === 'Home')       activate(tabs[0]);
      if (e.key === 'End')        activate(tabs[tabs.length-1]);
    });
  });
})();

(function projectFilters(){
  const buttons = [...document.querySelectorAll('.filter')];
  const cards = [...document.querySelectorAll('.card')];

  function setActive(btn){
    buttons.forEach(b => { b.classList.remove('is-active'); b.setAttribute('aria-selected','false'); });
    btn.classList.add('is-active'); btn.setAttribute('aria-selected','true');
  }
  function apply(key){
    cards.forEach(card => {
      if (key === 'all') { card.hidden = false; return; }
      const tags = (card.getAttribute('data-tags') || '').toLowerCase();
      card.hidden = !tags.includes(key);
    });
  }
  buttons.forEach(btn => {
    btn.addEventListener('click', () => { setActive(btn); apply(btn.dataset.filter); });
  });

  const items = document.querySelectorAll('.card.reveal');
  if (!('IntersectionObserver' in window)){
    items.forEach(i => i.classList.add('visible')); 
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting){ e.target.classList.add('visible'); io.unobserve(e.target); }});
    }, {threshold: 0.12});
    items.forEach(i => io.observe(i));
  }
})();

document.getElementById('year').textContent = new Date().getFullYear();
(function dynamicTitle(){
  const map = {
    '#projetos':'Projetos — Diogo Gulhak',
    '#skills':'Skills — Diogo Gulhak',
    '#sobre':'Sobre — Diogo Gulhak',
    '#experiencia':'Experiência — Diogo Gulhak',
    '#comunidade':'Comunidade — Diogo Gulhak'
  };
  document.querySelectorAll('a[href^="#"]').forEach(a=>{
    a.addEventListener('click', ()=>{
      const t = map[a.getAttribute('href')];
      if (t) document.title = t;
    });
  });
})();
document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click', e=>{
    const id=a.getAttribute('href');
    if(id.length>1){ e.preventDefault(); document.querySelector(id)?.scrollIntoView({behavior:'smooth',block:'start'}); }
  });
});

function buildMailto({ to, subject, body }) {
  const encodedSubject = encodeURIComponent(subject ?? '');
  const encodedBody = encodeURIComponent(body ?? '');
  return `mailto:${to}?subject=${encodedSubject}&body=${encodedBody}`;
}
document.querySelectorAll('a.btn[data-mailto]').forEach((link) => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = buildMailto({
      to: 'dgulhak@gmail.com',
      subject: 'Projeto Mobile — Portfólio',
      body: 'Olá Diogo! Vi seu portfólio e gostaria de conversar sobre um projeto. Podemos marcar um papo rápido?\n\nAssunto:\nContexto:\nPrazo:\nOrçamento:'
    });
  });
});

(function contactModal(){
  const modal = document.getElementById('contactModal');
  const openBtn = document.getElementById('openContact');
  const closeBtn = document.getElementById('closeContact');

  const open = () => { modal.classList.add('is-open'); modal.setAttribute('aria-hidden','false'); };
  const close = () => { modal.classList.remove('is-open'); modal.setAttribute('aria-hidden','true'); };

  openBtn?.addEventListener('click', open);
  closeBtn?.addEventListener('click', close);

  modal?.addEventListener('click', (e) => {
    if (e.target === modal) close();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) close();
  });
})();
