import { initTextPressure } from './text-pressure.js';

let destroyRhinestone = null;

export function mountRhinestone(text) {
  const el = document.getElementById('rhinestone-title');
  if (!el) return;
  if (destroyRhinestone) destroyRhinestone();
  destroyRhinestone = initTextPressure(el, text, {
    flex: false,
    alpha: false,
    stroke: false,
    width: true,
    weight: true,
    italic: true,
    scale: false,
    textColor: '#ffffff',
    textTransform: 'uppercase',
    minFontSize: 12,
    fontScale: 0.75,
    weightMin: 500,
    weightMax: 900,
  });
}

window.mountRhinestone = mountRhinestone;

function initPhotoStripShake() {
  const photo = document.getElementById('about-photo-strip');
  if (!photo || photo.dataset.shakeBound) return;
  photo.dataset.shakeBound = '1';

  photo.addEventListener('click', () => {
    photo.classList.remove('is-shaking');
    void photo.offsetWidth;
    photo.classList.add('is-shaking');
  });

  photo.addEventListener('animationend', (e) => {
    if (e.animationName !== 'photoStripShake') return;
    photo.classList.remove('is-shaking');
    if (window.openAboutExpand) window.openAboutExpand();
    document.getElementById('about-read-more')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
}

function bootAboutPage() {
  initPhotoStripShake();
  if (window._pendingRhinestone) {
    mountRhinestone(window._pendingRhinestone);
    delete window._pendingRhinestone;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootAboutPage);
} else {
  bootAboutPage();
}
