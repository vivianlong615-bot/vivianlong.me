let destroyHeroSub = null;

export function mountHeroSub(text) {
  const el = document.getElementById('hero-sub');
  if (!el) return;
  if (destroyHeroSub) destroyHeroSub();
  el.innerHTML = `<p class="hero-intro-text">${text}</p>`;
  destroyHeroSub = () => {
    el.innerHTML = '';
  };
}

window.mountHeroSub = mountHeroSub;

if (window._pendingHeroSub) {
  mountHeroSub(window._pendingHeroSub);
  delete window._pendingHeroSub;
}
