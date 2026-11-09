/**
 * Product videos: play only while on screen, never automatically under reduced motion,
 * and always pausable (WCAG 2.2.2). Native controls remain if this script never runs.
 */
const reduced = matchMedia('(prefers-reduced-motion: reduce)');

for (const wrap of document.querySelectorAll<HTMLElement>('[data-video]')) {
  const video = wrap.querySelector('video');
  const button = wrap.querySelector<HTMLButtonElement>('.vbtn');
  if (!video || !button) continue;
  const label = button.querySelector('.visually-hidden');

  video.controls = false;
  button.hidden = false;

  let paused = reduced.matches; // the viewer's choice (or their motion setting)
  let visible = false;

  const sync = () => {
    const play = visible && !paused;
    if (play && video.paused) video.play().catch(() => {});
    if (!play && !video.paused) video.pause();
    wrap.toggleAttribute('data-paused', paused);
    if (label) label.textContent = paused ? 'Play video' : 'Pause video';
  };

  new IntersectionObserver(
    ([entry]) => {
      visible = !!entry?.isIntersecting;
      sync();
    },
    { threshold: 0.25 },
  ).observe(wrap);

  button.addEventListener('click', () => {
    paused = !paused;
    sync();
  });
  reduced.addEventListener('change', () => {
    paused = reduced.matches;
    sync();
  });
  sync();
}
