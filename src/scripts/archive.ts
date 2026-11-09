/**
 * Archive: filter chips and the tile dialogs.
 * Dialogs open natively through commandfor; this script adds the motion and a fallback
 * for browsers without Invoker Commands or closedby.
 */
import { M, md, canAnimate } from './motion';

/* ---------- dialogs ---------- */

const closing = new WeakSet<HTMLDialogElement>();

function open(dialog: HTMLDialogElement) {
  if (dialog.open) return;
  dialog.showModal();
  if (canAnimate()) {
    dialog.animate(
      [
        { opacity: 0, transform: 'translateY(14px)' },
        { opacity: 1, transform: 'none' },
      ],
      { duration: md(420), easing: M.ease },
    );
  }
}

function close(dialog: HTMLDialogElement) {
  if (!dialog.open || closing.has(dialog)) return;
  if (!canAnimate()) return dialog.close();
  closing.add(dialog);
  const out = dialog.animate(
    [
      { opacity: 1, transform: 'none' },
      { opacity: 0, transform: 'translateY(8px)' },
    ],
    { duration: md(260), easing: M.ease },
  );
  out.onfinish = () => {
    closing.delete(dialog);
    dialog.close();
  };
}

document.addEventListener('click', (e) => {
  const button = (e.target as Element | null)?.closest?.('button[commandfor]');
  if (!(button instanceof HTMLButtonElement)) return;
  const dialog = document.getElementById(button.getAttribute('commandfor') ?? '');
  if (!(dialog instanceof HTMLDialogElement)) return;
  e.preventDefault(); // take over from the native command so we can animate
  if (button.getAttribute('command') === 'close') close(dialog);
  else open(dialog);
});

for (const dialog of document.querySelectorAll<HTMLDialogElement>('dialog.aview')) {
  // Escape and native light dismiss
  dialog.addEventListener('cancel', (e) => {
    e.preventDefault();
    close(dialog);
  });
  // Backdrop click, for browsers without closedby="any"
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) close(dialog);
  });
}

/* ---------- filters ---------- */

const bar = document.querySelector<HTMLElement>('[data-filters]');
const count = document.querySelector<HTMLElement>('[data-count]');

if (bar) {
  const chips = [...bar.querySelectorAll<HTMLButtonElement>('.chip')];
  const tiles = [...document.querySelectorAll<HTMLElement>('.agrid > li')];
  const groups = [...document.querySelectorAll<HTMLElement>('.agroup')];

  bar.addEventListener('click', (e) => {
    const chip = (e.target as Element | null)?.closest?.('.chip');
    if (!(chip instanceof HTMLButtonElement)) return;
    const f = chip.dataset.f ?? 'all';
    chips.forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));

    for (const t of tiles) t.hidden = !(f === 'all' || (t.dataset.tags ?? '').split(' ').includes(f));
    for (const g of groups) g.hidden = !g.querySelector('.agrid > li:not([hidden])');

    const shown = tiles.filter((t) => !t.hidden);
    if (count) count.textContent = `Showing ${shown.length} ${shown.length === 1 ? 'project' : 'projects'}`;
    if (canAnimate()) {
      shown.forEach((t, i) =>
        t.animate(
          [
            { opacity: 0, transform: 'translateY(10px)' },
            { opacity: 1, transform: 'none' },
          ],
          { duration: md(420), delay: md(i * M.stagger * 0.5), easing: M.ease, fill: 'backwards' },
        ),
      );
    }
  });
}
