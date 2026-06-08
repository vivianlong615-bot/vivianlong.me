import { initFuzzyText } from './fuzzy-text.js';
import { initHeroReveal } from './hero-reveal.js';

let destroyFuzzyMain = null;

const FUZZY_MAIN_OPTS = {
  fontSize: 'clamp(2.85rem, 12vw, 7rem)',
  fontWeight: 900,
  fontFamily: '"DM Sans", system-ui, sans-serif',
  color: '#4E22A8',
  enableHover: true,
  baseIntensity: 0.22,
  hoverIntensity: 0.55,
  fuzzRange: 32,
  letterSpacing: 2,
};

export function mountFuzzyName(text) {
  const el = document.getElementById('fuzzy-name');
  if (!el) return;
  if (destroyFuzzyMain) destroyFuzzyMain();
  destroyFuzzyMain = initFuzzyText(el, text, FUZZY_MAIN_OPTS);
}

window.mountFuzzyName = mountFuzzyName;

const hero = document.getElementById('hero');
if (hero) initHeroReveal(hero);

if (window._pendingFuzzyName) {
  mountFuzzyName(window._pendingFuzzyName);
  delete window._pendingFuzzyName;
}
