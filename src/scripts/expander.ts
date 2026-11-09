/**
 * Expanders: animate <details> open and shut (height + content fade, 420ms × 1.2).
 * Without JS, or under reduced motion, the native element works unchanged.
 */
import { M, md, canAnimate } from './motion';

for (const details of document.querySelectorAll<HTMLDetailsElement>('details.xp')) {
  const summary = details.querySelector('summary');
  const body = details.querySelector<HTMLElement>('.more');
  if (!summary || !body) continue;
  let height: Animation | null = null;

  summary.addEventListener('click', (e) => {
    if (!canAnimate()) return;
    e.preventDefault();

    const from = details.offsetHeight;
    height?.cancel();
    details.style.overflow = 'hidden';
    const opening = !details.open || details.classList.contains('closing');
    let to: number;

    body.getAnimations().forEach((a) => a.cancel());
    if (opening) {
      details.classList.remove('closing');
      details.open = true;
      to = summary.offsetHeight + body.offsetHeight;
      body.animate(
        [
          { opacity: 0, transform: 'translateY(-6px)' },
          { opacity: 1, transform: 'none' },
        ],
        { duration: md(420), easing: M.ease, fill: 'backwards' },
      );
    } else {
      details.classList.add('closing');
      to = summary.offsetHeight;
      body.animate([{ opacity: 1 }, { opacity: 0 }], { duration: md(300), easing: M.ease, fill: 'forwards' });
    }

    const anim = details.animate([{ height: `${from}px` }, { height: `${to}px` }], {
      duration: md(420),
      easing: M.ease,
    });
    height = anim;
    anim.onfinish = () => {
      if (!opening) {
        details.open = false;
        details.classList.remove('closing');
        body.getAnimations().forEach((a) => a.cancel());
      }
      details.style.overflow = '';
      height = null;
    };
  });
}
