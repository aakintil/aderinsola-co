/**
 * Home project list.
 * Desktop: hover or focus a project to crossfade the stage image; click opens it.
 * Mobile: the swipe strip and the list stay in sync. Tapping a project that is not
 * centered scrolls to it first; tapping the centered one opens it. Both end with the archive.
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

  /* ---------- videos ----------
     Desktop plays the selected stage video; phones play the centered card's video.
     Each plays only while its area is on screen, and never autoplays under reduced motion. */
  const wrap = root.querySelector<HTMLElement>('.stage-wrap')!;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const onScreen = (el: Element) => {
    const r = el.getBoundingClientRect();
    return r.height > 0 && r.top < innerHeight && r.bottom > 0;
  };
  // Start from the actual positions, so a hover right after load can play a video
  // before the IntersectionObservers below report in.
  let stageVisible = onScreen(wrap);
  let stripVisible = onScreen(strip);

  // Videos autoplay natively; stop them straight away if the viewer asked for less motion.
  if (reduced.matches) root.querySelectorAll('video').forEach((v) => v.pause());

  const syncVideo = () => {
    const motion = !reduced.matches;
    layers.forEach((l, k) => {
      const video = l.querySelector('video');
      if (!video) return;
      const play = motion && !small.matches && stageVisible && k === current;
      if (play && video.paused) video.play().catch(() => {});
      if (!play && !video.paused) video.pause();
    });
    cards.forEach((c, k) => {
      const video = c.querySelector('video');
      if (!video) return;
      const play = motion && small.matches && stripVisible && k === current;
      if (play && video.paused) video.play().catch(() => {});
      if (!play && !video.paused) video.pause();
    });
  };

  const watch = (el: Element, set: (v: boolean) => void) =>
    new IntersectionObserver(
      ([entry]) => {
        set(!!entry?.isIntersecting);
        syncVideo();
      },
      { threshold: 0.25 },
    ).observe(el);
  watch(wrap, (v) => (stageVisible = v));
  watch(strip, (v) => (stripVisible = v));
  reduced.addEventListener('change', syncVideo);
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
