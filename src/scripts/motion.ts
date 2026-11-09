/**
 * Motion layer: scroll reveals and the page exit fade.
 * Entrances above the fold are CSS (src/styles/motion.css). Values follow the motion spec.
 */

export const M = {
  speed: 1.2,
  ease: 'cubic-bezier(.65,0,.35,1)',
  scroll: 900,
  text: 560,
  stagger: 60,
  exit: 360,
} as const;

/** Spec milliseconds to real milliseconds. */
export const md = (ms: number) => ms * M.speed;

const reduced = matchMedia('(prefers-reduced-motion: reduce)');

/** Live check: motion allowed right now. */
export const canAnimate = () => !reduced.matches && typeof Element.prototype.animate === 'function';

/** Entrances only run on a fresh visit with motion allowed (see the gate in Base.astro). */
const entrances = document.documentElement.classList.contains('m') && canAnimate();

/* ---------- scroll reveal ---------- */

const CANDIDATES = [
  '.h2',
  '.stat',
  '.meta',
  '.fnote',
  '.ph',
  '.vid',
  '.grid',
  '.trio',
  '.decision',
  '.quote',
  '.quotes',
  '.tq',
  '.next',
  '.closing > .eyebrow',
  '.ctext > p',
  '.ctext > details',
  '.prose p',
  '.foot',
].join(',');

// Never revealed on scroll: the home stage and strip, closed expanders, next-project images,
// archive tiles and dialogs. Above-the-fold entrances are already animated by CSS.
const EXCLUDED = '[data-enter], .stage, .mstrip, details .more, .next .ph, .atile, dialog, .grid .ph, .grid .vid';

function reveal(el: HTMLElement) {
  el.classList.remove('m-arm');
  const delay = md(Number(el.dataset.mDelay ?? 0));
  const isImage = el.matches('.ph, .vid, .grid');
  const frames = isImage
    ? [{ opacity: 0 }, { opacity: 1 }]
    : [
        { opacity: 0, transform: 'translateY(14px)' },
        { opacity: 1, transform: 'none' },
      ];
  el.animate(frames, {
    duration: md(isImage ? M.scroll : M.text),
    delay,
    easing: M.ease,
    fill: 'backwards',
  });
}

if (entrances && 'IntersectionObserver' in window) {
  const armed = new Set<HTMLElement>();
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const el = e.target as HTMLElement;
        io.unobserve(el);
        armed.delete(el);
        reveal(el);
      }
    },
    { rootMargin: '0px 0px -10% 0px' },
  );

  // A fast jump (End key, anchor link, scrollbar drag) can skip an element without it ever
  // intersecting. Anything left above the viewport is shown at once, never left invisible.
  let queued = false;
  const sweep = () => {
    queued = false;
    for (const el of armed) {
      if (el.getBoundingClientRect().bottom > 0) continue;
      io.unobserve(el);
      armed.delete(el);
      el.classList.remove('m-arm');
    }
    if (!armed.size) removeEventListener('scroll', onScroll);
  };
  const onScroll = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(sweep);
  };
  addEventListener('scroll', onScroll, { passive: true });

  const fold = innerHeight * 0.9;
  for (const el of document.querySelectorAll<HTMLElement>(CANDIDATES)) {
    if (el.closest(EXCLUDED)) continue;
    if (el.parentElement?.closest('.m-arm')) continue; // an ancestor already reveals it
    const box = el.getBoundingClientRect();
    if (box.height === 0 || box.top < fold) continue; // hidden, or already in view at rest
    if (el.classList.contains('stat')) {
      el.dataset.mDelay = String([...el.parentElement!.children].indexOf(el) * M.stagger);
    }
    el.classList.add('m-arm');
    armed.add(el);
    io.observe(el);
  }
}

/* ---------- page exit ---------- */

const page = document.querySelector<HTMLElement>('.page');

document.addEventListener('click', (e) => {
  if (!page || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const a = (e.target as Element | null)?.closest?.('a[href]');
  if (!(a instanceof HTMLAnchorElement)) return;
  if ((a.target && a.target !== '_self') || a.hasAttribute('download')) return;
  const url = new URL(a.href, location.href);
  if (url.origin !== location.origin) return;
  if (url.pathname === location.pathname && url.search === location.search) return; // same page
  if (!canAnimate()) return;

  e.preventDefault();
  const exit = page.animate(
    [
      { opacity: 1, transform: 'none' },
      { opacity: 0, transform: 'translateY(-8px)' },
    ],
    { duration: md(M.exit), easing: M.ease, fill: 'forwards' },
  );
  exit.onfinish = () => location.assign(url.href);
});

// Back and forward stay instant: a page restored from the back/forward cache must not stay faded out.
addEventListener('pageshow', (e) => {
  if (e.persisted) page?.getAnimations().forEach((a) => a.cancel());
});
