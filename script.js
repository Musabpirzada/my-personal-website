(() => {
  const root = document.documentElement;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOutExpo = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

  /* ---------- Loader: count to 100, then lift the curtain ---------- */
  const loader = document.querySelector('.loader');
  const countEl = loader.querySelector('[data-count]');
  const portrait = document.querySelector('.portrait-frame img');

  function finishIntro() {
    root.classList.add('is-loaded');
    setTimeout(() => loader.remove(), 1400);
  }

  if (reduceMotion) {
    finishIntro();
  } else {
    let seen = false;
    try { seen = sessionStorage.getItem('smp-intro') === '1'; sessionStorage.setItem('smp-intro', '1'); } catch (e) {}
    const duration = seen ? 500 : 1500;
    const imageReady = portrait.complete
      ? Promise.resolve()
      : new Promise((resolve) => { portrait.addEventListener('load', resolve, { once: true }); portrait.addEventListener('error', resolve, { once: true }); });
    const start = performance.now();
    const tick = (now) => {
      const t = clamp((now - start) / duration, 0, 1);
      const p = easeOutExpo(t);
      countEl.textContent = Math.round(p * 100);
      loader.style.setProperty('--p', p);
      if (t < 1) requestAnimationFrame(tick);
      else Promise.race([imageReady, new Promise((r) => setTimeout(r, 1200))]).then(finishIntro);
    };
    requestAnimationFrame(tick);
  }

  /* ---------- Live Lahore clock ---------- */
  const clock = document.querySelector('[data-clock]');
  const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Karachi', hour: '2-digit', minute: '2-digit' });
  const updateClock = () => { clock.textContent = fmt.format(new Date()); };
  updateClock();
  setInterval(updateClock, 15000);

  /* ---------- Split the about paragraph into words ---------- */
  const words = [];
  document.querySelectorAll('[data-words]').forEach((block) => {
    const walk = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            const span = document.createElement('span');
            span.className = 'w';
            span.textContent = part;
            words.push(span);
            frag.appendChild(span);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          walk(child);
        }
      });
    };
    walk(block);
  });
  const wordsBlock = document.querySelector('[data-words]');

  /* ---------- Reveal on view ---------- */
  const revealer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in');
      revealer.unobserve(entry.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
  document.querySelectorAll('.reveal, .contact-title .line, .stage').forEach((el) => revealer.observe(el));

  // Stagger siblings that reveal together.
  document.querySelectorAll('.cap-list, .cred-list, .metrics').forEach((group) => {
    [...group.children].forEach((child, i) => { child.style.transitionDelay = `${i * 110}ms`; });
  });

  /* ---------- Count-up metrics ---------- */
  const counter = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      counter.unobserve(entry.target);
      const el = entry.target;
      const to = Number(el.dataset.to);
      if (reduceMotion) { el.textContent = to; return; }
      const start = performance.now();
      const dur = 1800;
      const step = (now) => {
        const t = clamp((now - start) / dur, 0, 1);
        el.textContent = Math.round(easeOutExpo(t) * to);
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: 0.6 });
  document.querySelectorAll('[data-to]').forEach((el) => counter.observe(el));

  /* ---------- Scroll-driven effects (one rAF loop) ---------- */
  const header = document.querySelector('.site-header');
  const progress = document.querySelector('.progress');
  const track = document.querySelector('.marquee-track');
  const portraitFrame = document.querySelector('.portrait-frame');
  let lastY = scrollY;
  let skew = 0;

  function onFrame() {
    const y = scrollY;
    const vh = innerHeight;
    const max = document.documentElement.scrollHeight - vh;
    progress.style.setProperty('--scroll', max > 0 ? y / max : 0);

    const delta = y - lastY;
    header.classList.toggle('is-scrolled', y > 40);
    if (Math.abs(delta) > 4) header.classList.toggle('is-hidden', delta > 0 && y > 240);

    if (!reduceMotion) {
      skew = lerp(skew, clamp(delta * 0.35, -10, 10), 0.12);
      track.style.setProperty('--skew', `${skew.toFixed(2)}deg`);

      const r = portraitFrame.getBoundingClientRect();
      if (r.bottom > 0 && r.top < vh) {
        const t = clamp((vh - r.top) / (vh + r.height), 0, 1);
        portraitFrame.style.setProperty('--py', `${(-12 + t * 12).toFixed(2)}%`);
      }

      const w = wordsBlock.getBoundingClientRect();
      if (w.top < vh && w.bottom > 0) {
        const p = clamp((vh * 0.82 - w.top) / (w.height + vh * 0.2), 0, 1);
        const lit = Math.round(p * words.length);
        words.forEach((word, i) => word.classList.toggle('on', i < lit));
      }
    }

    lastY = y;
    requestAnimationFrame(onFrame);
  }
  requestAnimationFrame(onFrame);

  if (reduceMotion || !finePointer) return;

  /* ---------- Toolkit stage: depth parallax + spotlight ---------- */
  const stage = document.querySelector('.stage');
  stage.addEventListener('pointermove', (e) => {
    const r = stage.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    stage.style.setProperty('--mx', ((x - 0.5) * -2).toFixed(3));
    stage.style.setProperty('--my', ((y - 0.5) * -2).toFixed(3));
    stage.style.setProperty('--gx', `${(x * 100).toFixed(1)}%`);
    stage.style.setProperty('--gy', `${(y * 100).toFixed(1)}%`);
  });
  stage.addEventListener('pointerleave', () => {
    stage.style.setProperty('--mx', 0);
    stage.style.setProperty('--my', 0);
  });

  /* ---------- Custom cursor + magnetic buttons ---------- */
  root.classList.add('has-cursor');
  const cursor = document.querySelector('.cursor');
  const pos = { x: innerWidth / 2, y: innerHeight / 2 };
  const cur = { ...pos };
  addEventListener('pointermove', (e) => { pos.x = e.clientX; pos.y = e.clientY; cursor.classList.remove('is-hidden'); });
  document.addEventListener('pointerleave', () => cursor.classList.add('is-hidden'));
  document.querySelectorAll('a, button, .cap, .cred-list li, .chips li').forEach((el) => {
    el.addEventListener('pointerenter', () => cursor.classList.add('is-hover'));
    el.addEventListener('pointerleave', () => cursor.classList.remove('is-hover'));
  });

  const magnets = [...document.querySelectorAll('[data-magnetic]')].map((el) => ({ el, x: 0, y: 0, tx: 0, ty: 0 }));
  magnets.forEach((m) => {
    m.el.addEventListener('pointermove', (e) => {
      const r = m.el.getBoundingClientRect();
      m.tx = (e.clientX - (r.left + r.width / 2)) * 0.3;
      m.ty = (e.clientY - (r.top + r.height / 2)) * 0.4;
    });
    m.el.addEventListener('pointerleave', () => { m.tx = 0; m.ty = 0; });
  });

  (function follow() {
    cur.x = lerp(cur.x, pos.x, 0.2);
    cur.y = lerp(cur.y, pos.y, 0.2);
    cursor.style.transform = `translate3d(${cur.x}px, ${cur.y}px, 0)`;
    magnets.forEach((m) => {
      m.x = lerp(m.x, m.tx, 0.15);
      m.y = lerp(m.y, m.ty, 0.15);
      m.el.style.translate = `${m.x.toFixed(2)}px ${m.y.toFixed(2)}px`;
    });
    requestAnimationFrame(follow);
  })();
})();
