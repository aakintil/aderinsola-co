/**
 * Home project list.
 * Desktop: hover or focus a project to crossfade the stage image; click opens it.
 * Mobile: the swipe strip and the list stay in sync. Tapping a project that is not
 * centered scrolls to it first; tapping the centered one opens it.
 */
import { canAnimate } from './motion';

const root = document.querySelector<HTMLElement>('[data-work]');

if (root) {
  const small = matchMedia('(max-width: 720px)');
  const stage = root.querySelector<HTMLAnchorElement>('.stage')!;
  const layers = [...root.querySelectorAll<HTMLElement>('.stage .layer')];
  const picks = [...root.querySelectorAll<HTMLAnchorElement>('.pick')];
  const strip = root.querySelector<HTMLElement>('[data-mstrip]')!;
  const cards = [...strip.querySelectorAll<HTMLAnchorElement>('.mcard')];
  const dots = [...root.querySelectorAll<HTMLElement>('.dots i')];
  const num = root.querySelector<HTMLElement>('[data-mnum]')!;
  const hint = root.querySelector<HTMLElement>('[data-mhint]')!;
  const total = String(cards.length).padStart(2, '0');
  let current = 0;

  /* ---------- stage video ----------
     Plays only on desktop, while its project is selected and the stage is on screen.
     Starts paused under reduced motion; the button pauses and resumes it (WCAG 2.2.2). */
  const wrap = root.querySelector<HTMLElement>('.stage-wrap')!;
  const toggle = root.querySelector<HTMLButtonElement>('[data-stage-toggle]')!;
  const toggleLabel = toggle.querySelector('.visually-hidden');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = reduced.matches;
  let stageVisible = false;

  const syncVideo = () => {
    const layer = layers[current];
    const hasVideo = !!layer?.classList.contains('vlayer');
    toggle.hidden = !hasVideo || small.matches;
    wrap.toggleAttribute('data-paused', paused);
    if (toggleLabel) toggleLabel.textContent = paused ? 'Play video' : 'Pause video';
    for (const l of layers) {
      const video = l.querySelector('video');
      if (!video) continue;
      const play = l === layer && stageVisible && !paused && !small.matches;
      if (play && video.paused) video.play().catch(() => {});
      if (!play && !video.paused) video.pause();
    }
  };

  new IntersectionObserver(
    ([entry]) => {
      stageVisible = !!entry?.isIntersecting;
      syncVideo();
    },
    { threshold: 0.25 },
  ).observe(wrap);
  toggle.addEventListener('click', () => {
    paused = !paused;
    syncVideo();
  });
  reduced.addEventListener('change', () => {
    paused = reduced.matches;
    syncVideo();
  });
  small.addEventListener('change', syncVideo);

  const select = (i: number) => {
    if (i === current) return;
    current = i;
    layers.forEach((el, k) => el.classList.toggle('on', k === i));
    syncVideo();
    cards.forEach((el, k) => el.classList.toggle('on', k === i));
    dots.forEach((el, k) => el.classList.toggle('on', k === i));
    picks.forEach((el, k) => el.toggleAttribute('data-on', k === i));
    stage.href = picks[i]!.href;
    num.textContent = `${String(i + 1).padStart(2, '0')} / ${total} · Tap to open`;
  };

  /** Center card i in the strip. */
  const scrollToCard = (i: number) => {
    const card = cards[i];
    if (!card) return;
    strip.scrollTo({
      left: card.offsetLeft - (strip.clientWidth - card.offsetWidth) / 2,
      behavior: canAnimate() ? 'smooth' : 'auto',
    });
  };

  picks.forEach((pick, i) => {
    pick.addEventListener('pointerenter', () => !small.matches && select(i));
    pick.addEventListener('focus', () => !small.matches && select(i));
    pick.addEventListener('click', (e) => {
      if (small.matches && i !== current) {
        e.preventDefault();
        select(i);
        scrollToCard(i);
      }
    });
  });

  cards.forEach((card, i) => {
    card.addEventListener('click', (e) => {
      if (i !== current) {
        e.preventDefault();
        scrollToCard(i);
      }
    });
    // Keyboard focus moving onto a card brings it to the center.
    card.addEventListener('focus', () => {
      if (i !== current) scrollToCard(i);
    });
  });

  // The centered card is the current one.
  let queued = false;
  strip.addEventListener(
    'scroll',
    () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        const mid = strip.scrollLeft + strip.clientWidth / 2;
        let best = 0;
        let bestDistance = Infinity;
        cards.forEach((c, k) => {
          const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid);
          if (d < bestDistance) [best, bestDistance] = [k, d];
        });
        select(best);
        hint.style.opacity = best > 0 ? '0' : '1';
      });
    },
    { passive: true },
  );

  strip.addEventListener('keydown', (e) => {
    if (e.target !== strip) return;
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    scrollToCard(Math.max(0, Math.min(cards.length - 1, current + step)));
  });
}
