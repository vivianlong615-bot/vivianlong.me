/**
 * Desktop home page logic (index.html)
 */
let currentLang = window.readPortfolioLang ? window.readPortfolioLang() : 'zh';
window.currentLang = currentLang;

function toggleMenu() {
  const overlay = document.getElementById('menu-overlay');
  const isOpen = overlay.classList.toggle('open');
  document.body.style.overflow = 'hidden';
  document.getElementById('menu-btn-label').innerText = isOpen
    ? window.langData[currentLang].menuClose
    : window.langData[currentLang].menuBtn;
}

function toggleLang() {
  currentLang = currentLang === 'zh' ? 'en' : 'zh';
  window.currentLang = currentLang;
  if (window.writePortfolioLang) window.writePortfolioLang(currentLang);
  renderInterface();
}

function renderInterface() {
  const data = window.langData[currentLang];

  document.querySelectorAll('.menu-link').forEach(a => {
    const key = a.dataset.section;
    if (data.menuLinks[key]) a.innerText = data.menuLinks[key];
  });
  document.getElementById('menu-close-label').innerText = data.menuClose;
  if (!document.getElementById('menu-overlay').classList.contains('open')) {
    document.getElementById('menu-btn-label').innerText = data.menuBtn;
  }
  const langLabel = currentLang === 'zh' ? 'EN' : 'CN';
  document.getElementById('lang-btn').innerText = langLabel;
  document.getElementById('menu-lang-btn').innerText = langLabel;

  document.getElementById('hero-tag').innerText = data.heroTag;
  document.getElementById('hero-title-accessible').innerText = data.heroMainTitle || data.fuzzyName;
  if (window.mountHeroSub) {
    window.mountHeroSub(data.heroSub);
  } else {
    window._pendingHeroSub = data.heroSub;
  }
  const mainTitle = data.heroMainTitle || data.fuzzyName;
  if (window.mountFuzzyName) {
    window.mountFuzzyName(mainTitle);
  } else {
    window._pendingFuzzyName = mainTitle;
  }
  document.getElementById('desktop-entry-btn').setAttribute('aria-label', data.desktopEntryLabel);
}

window.addEventListener('DOMContentLoaded', renderInterface);

(function initLoader() {
  const counter = document.getElementById('loader-counter');
  let n = 0;
  const tick = setInterval(() => {
    n = Math.min(n + 17, 100);
    counter.innerText = String(n).padStart(3, '0');
    if (n >= 100) {
      clearInterval(tick);
      setTimeout(() => document.getElementById('loader').classList.add('hide'), 300);
    }
  }, 40);
})();
