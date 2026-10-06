// Page-wide interaction effects. Every effect is progressive: without JS (or with reduced motion)
// the content is already in its final state.

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const GLYPHS = 'ACGT01<>/{}[]#*+=';

/** "Decode" text: random glyphs settle into the real characters from left to right. */
function scramble(el: HTMLElement, duration = 900) {
  const final = el.textContent ?? '';
  if (reduceMotion || !final.trim()) return;
  el.setAttribute('aria-label', final);
  const start = performance.now();
  const tick = (now: number) => {
    const p = Math.min(1, (now - start) / duration);
    const settled = Math.floor(p * final.length);
    let out = final.slice(0, settled);
    for (let i = settled; i < final.length; i++) {
      out += final[i] === ' ' ? ' ' : GLYPHS[(Math.random() * GLYPHS.length) | 0];
    }
    el.textContent = out;
    if (p < 1) requestAnimationFrame(tick);
    else el.textContent = final;
  };
  requestAnimationFrame(tick);
}

/** Type text in one character at a time. */
function typewrite(el: HTMLElement, delay = 0, speed = 32) {
  const final = el.textContent ?? '';
  if (reduceMotion) return;
  el.setAttribute('aria-label', final);
  el.textContent = '';
  let i = 0;
  const step = () => {
    el.textContent = final.slice(0, ++i);
    if (i < final.length) setTimeout(step, speed + Math.random() * 30);
  };
  setTimeout(step, delay);
}

/** Count a number up from zero. */
function countUp(el: HTMLElement) {
  const target = Number(el.dataset.count);
  if (reduceMotion || !Number.isFinite(target)) return;
  const decimals = (el.dataset.count!.split('.')[1] ?? '').length;
  const start = performance.now();
  const duration = 1400;
  const tick = (now: number) => {
    const p = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = (target * eased).toFixed(decimals);
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// ---- Hero: name decodes, tagline types ----
document.querySelectorAll<HTMLElement>('[data-hero-scramble]').forEach((el) => scramble(el, 1400));
document.querySelectorAll<HTMLElement>('[data-type]').forEach((el) => typewrite(el, 900));

// ---- Reveal on scroll, plus the effects that wait for an element to come into view ----
const revealObserver = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const el = entry.target as HTMLElement;
      el.classList.add('is-visible');
      el.querySelectorAll<HTMLElement>('[data-scramble]').forEach((t) => scramble(t));
      el.querySelectorAll<HTMLElement>('[data-count]').forEach(countUp);
      revealObserver.unobserve(el);
    }
  },
  { threshold: 0.15, rootMargin: '0px 0px -40px 0px' },
);
document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

// ---- Cursor-following glow on cards ----
document.querySelectorAll<HTMLElement>('.card').forEach((card) => {
  card.addEventListener('pointermove', (e) => {
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--x', `${e.clientX - rect.left}px`);
    card.style.setProperty('--y', `${e.clientY - rect.top}px`);
  });
});

// ---- Copy buttons ----
document.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach((btn) => {
  btn.addEventListener('click', async () => {
    const source = btn.dataset.copy!;
    const text = source.startsWith('#') ? (document.querySelector(source)?.textContent ?? '') : source;
    const label = btn.querySelector('[data-copy-label]');
    const original = label?.textContent;
    try {
      await navigator.clipboard.writeText(text.trim());
      if (label) label.textContent = 'copied ✓';
    } catch {
      if (label) label.textContent = 'press ⌘/Ctrl+C';
    }
    setTimeout(() => label && original && (label.textContent = original), 1800);
  });
});
