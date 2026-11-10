/**
 * Product videos autoplay and loop while on screen, and pause offscreen to save battery.
 * Under reduced motion they stay on their poster. Native controls remain if this script never runs.
 */
const reduced = matchMedia('(prefers-reduced-motion: reduce)');

for (const wrap of document.querySelectorAll<HTMLElement>('[data-video]')) {
  const video = wrap.querySelector('video');
  if (!video) continue;
  video.controls = false;
  let visible = false;

  const sync = () => {
    const play = visible && !reduced.matches;
    if (play && video.paused) video.play().catch(() => {});
    if (!play && !video.paused) video.pause();
  };

  new IntersectionObserver(
    ([entry]) => {
      visible = !!entry?.isIntersecting;
      sync();
    },
    { threshold: 0.25 },
  ).observe(wrap);
  reduced.addEventListener('change', sync);
}
