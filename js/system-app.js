/**
 * System window page logic (about.html)
 */
const DETAIL_TABS = ['about', 'experience', 'design', 'projects', 'research'];
let currentLang = window.readPortfolioLang ? window.readPortfolioLang() : 'zh';
window.currentLang = currentLang;
let activeDetailTab = 'about';
let activeVenture = null;
let detailTabsInited = false;

function syncAboutPhotoExpandState(isOpen) {
  const photo = document.getElementById('about-photo-strip');
  if (photo) photo.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
}

function toggleExpand(id) {
  const panel = document.getElementById(id);
  const arrow = document.getElementById('about-read-arrow');
  panel.classList.toggle('open');
  const isOpen = panel.classList.contains('open');
  if (arrow) arrow.style.transform = isOpen ? 'rotate(45deg)' : '';
  if (id === 'about-expand') syncAboutPhotoExpandState(isOpen);
}
window.toggleExpand = toggleExpand;

function openAboutExpand() {
  const panel = document.getElementById('about-expand');
  const arrow = document.getElementById('about-read-arrow');
  if (!panel || panel.classList.contains('open')) return;
  panel.classList.add('open');
  if (arrow) arrow.style.transform = 'rotate(45deg)';
  syncAboutPhotoExpandState(true);
}
window.openAboutExpand = openAboutExpand;

function switchDetailTab(tab) {
  if (!DETAIL_TABS.includes(tab)) return;
  activeDetailTab = tab;
  DETAIL_TABS.forEach(id => {
    const btn = document.getElementById(`tab-${id}`);
    const panel = document.getElementById(`${id}-container`);
    const active = id === tab;
    if (btn) {
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    }
    if (panel) panel.classList.toggle('hidden', !active);
  });
}

function initDetailTabs() {
  if (detailTabsInited) return;
  detailTabsInited = true;
  document.querySelectorAll('.detail-tab[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => switchDetailTab(btn.dataset.tab));
  });
}

function applyDetailHash() {
  const tab = location.hash.replace('#', '');
  if (tab === 'contact') {
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
    return;
  }
  if (!DETAIL_TABS.includes(tab)) return;
  switchDetailTab(tab);
}

function exitToDesktop() {
  if (window.parent !== window) {
    window.parent.location.href = '/';
    return;
  }
  window.location.href = 'cover.html';
}
window.exitToDesktop = exitToDesktop;

function toggleVenture(type, index) {
  const key = `${type}-${index}`;
  const panel = document.getElementById(`panel-${key}`);
  const row = document.getElementById(`row-${key}`);
  if (activeVenture === key) {
    panel.classList.remove('open');
    row.classList.remove('active');
    activeVenture = null;
    return;
  }
  document.querySelectorAll('.expand-panel.open').forEach(p => {
    if (p.id !== `panel-${key}`) p.classList.remove('open');
  });
  document.querySelectorAll('.venture-row.active').forEach(r => r.classList.remove('active'));
  panel.classList.add('open');
  row.classList.add('active');
  activeVenture = key;
}
window.toggleVenture = toggleVenture;

function renderDesignImages(item, title) {
  const frameCls = 'shrink-0 snap-start m-0 flex items-end bg-transparent';
  const imgCls = 'design-specimen-img';
  const thumbBtn = (src, alt) =>
    `<button type="button" class="design-specimen-thumb ${frameCls}" data-lightbox-src="${src}" data-lightbox-alt="${alt}" aria-label="放大查看：${alt}">` +
    `<img class="${imgCls}" src="${src}" alt="${alt}" loading="lazy" decoding="async">` +
    `</button>`;

  if (item.images?.length) {
    return `<div class="design-specimen-gallery">${item.images.map((img) => {
      const src = img.src || img;
      const alt = img.alt || title;
      return thumbBtn(src, alt);
    }).join('')}</div>`;
  }
  if (item.image) {
    const alt = item.imageAlt || title;
    return `<div class="design-specimen-gallery design-specimen-gallery--single mt-5">${thumbBtn(item.image, alt)}</div>`;
  }
  return '';
}

const designLightbox = {
  items: [],
  index: 0,
  root: null,
  img: null,
  caption: null,
  prev: null,
  next: null,
};

function ensureDesignLightbox() {
  if (designLightbox.root) return;

  const root = document.createElement('div');
  root.id = 'design-lightbox';
  root.className = 'design-lightbox hidden';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-hidden', 'true');
  root.innerHTML = `
    <button type="button" class="design-lightbox-backdrop" aria-label="关闭预览"></button>
    <div class="design-lightbox-panel">
      <button type="button" class="design-lightbox-close" aria-label="关闭预览"><span aria-hidden="true">&times;</span></button>
      <button type="button" class="design-lightbox-nav design-lightbox-prev" aria-label="上一张"><span aria-hidden="true">&#8249;</span></button>
      <button type="button" class="design-lightbox-nav design-lightbox-next" aria-label="下一张"><span aria-hidden="true">&#8250;</span></button>
      <figure class="design-lightbox-figure">
        <img class="design-lightbox-img" src="" alt="">
        <figcaption class="design-lightbox-caption"></figcaption>
      </figure>
    </div>`;
  document.body.appendChild(root);

  designLightbox.root = root;
  designLightbox.img = root.querySelector('.design-lightbox-img');
  designLightbox.caption = root.querySelector('.design-lightbox-caption');
  designLightbox.prev = root.querySelector('.design-lightbox-prev');
  designLightbox.next = root.querySelector('.design-lightbox-next');

  root.querySelector('.design-lightbox-backdrop').addEventListener('click', closeDesignLightbox);
  root.querySelector('.design-lightbox-close').addEventListener('click', closeDesignLightbox);
  designLightbox.prev.addEventListener('click', (e) => {
    e.stopPropagation();
    stepDesignLightbox(-1);
  });
  designLightbox.next.addEventListener('click', (e) => {
    e.stopPropagation();
    stepDesignLightbox(1);
  });
  root.querySelector('.design-lightbox-panel').addEventListener('click', (e) => e.stopPropagation());
}

function renderDesignLightboxSlide() {
  const { items, index, img, caption, prev, next } = designLightbox;
  const item = items[index];
  if (!item || !img) return;

  img.src = item.src;
  img.alt = item.alt;
  caption.textContent = item.alt;
  const multi = items.length > 1;
  prev.classList.toggle('hidden', !multi);
  next.classList.toggle('hidden', !multi);
  prev.disabled = index <= 0;
  next.disabled = index >= items.length - 1;
  designLightbox.root.setAttribute('aria-label', `设计作品预览 ${index + 1} / ${items.length}`);
}

function openDesignLightbox(items, index) {
  ensureDesignLightbox();
  designLightbox.items = items;
  designLightbox.index = index;
  renderDesignLightboxSlide();
  designLightbox.root.classList.remove('hidden');
  designLightbox.root.setAttribute('aria-hidden', 'false');
  document.body.classList.add('design-lightbox-open');
  designLightbox.root.querySelector('.design-lightbox-close').focus();
}

function closeDesignLightbox() {
  if (!designLightbox.root) return;
  designLightbox.root.classList.add('hidden');
  designLightbox.root.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('design-lightbox-open');
  designLightbox.items = [];
  designLightbox.index = 0;
  if (designLightbox.img) {
    designLightbox.img.removeAttribute('src');
  }
}

function stepDesignLightbox(delta) {
  const nextIndex = designLightbox.index + delta;
  if (nextIndex < 0 || nextIndex >= designLightbox.items.length) return;
  designLightbox.index = nextIndex;
  renderDesignLightboxSlide();
}

function collectGalleryItems(thumb) {
  const gallery = thumb.closest('.design-specimen-gallery');
  if (!gallery) {
    return {
      items: [{ src: thumb.dataset.lightboxSrc, alt: thumb.dataset.lightboxAlt || '' }],
      index: 0,
    };
  }

  const thumbs = [...gallery.querySelectorAll('.design-specimen-thumb')];
  const items = thumbs.map((el) => ({
    src: el.dataset.lightboxSrc,
    alt: el.dataset.lightboxAlt || '',
  }));
  const index = thumbs.indexOf(thumb);
  return { items, index: index >= 0 ? index : 0 };
}

function initDesignLightbox() {
  ensureDesignLightbox();

  document.addEventListener('click', (e) => {
    const thumb = e.target.closest('.design-specimen-thumb');
    if (!thumb) return;
    e.preventDefault();
    e.stopPropagation();
    const { items, index } = collectGalleryItems(thumb);
    openDesignLightbox(items, index);
  });

  document.addEventListener('keydown', (e) => {
    if (designLightbox.root?.classList.contains('hidden')) return;
    if (e.key === 'Escape') closeDesignLightbox();
    if (e.key === 'ArrowLeft') stepDesignLightbox(-1);
    if (e.key === 'ArrowRight') stepDesignLightbox(1);
  });
}

function renderList(containerId, items, type) {
  const data = window.langData[currentLang];
  const total = items.length;
  document.getElementById(containerId).innerHTML = items.map((item, i) => {
    const num = String(i + 1).padStart(3, '0');
    const key = `${type}-${i}`;
    const isExp = type === 'exp';
    const isProj = type === 'proj';
    const isDesign = type === 'design';
    const isResearch = type === 'research';

    let title = item.title || item.name;
    let sub = isResearch ? item.type : (item.role || item.type || '');
    let time = item.time || '';
    let expandContent = '';
    let previewLine = '';

    if (isExp) {
      expandContent = `<ul class="space-y-3 text-sm text-muted leading-relaxed pt-4">${item.bullets.map(b => `<li class="flex gap-2"><span class="text-ink">→</span><span>${b}</span></li>`).join('')}</ul>`;
      if (item.short) previewLine = `<p class="text-sm text-ink/60 mt-2 max-w-2xl">${item.short}</p>`;
    } else if (isProj) {
      expandContent = `<p class="text-sm text-muted leading-relaxed pt-4">${item.detail}</p>`;
      if (item.short) previewLine = `<p class="text-sm text-ink/60 mt-2 max-w-2xl">${item.short}</p>`;
    } else if (isResearch) {
      expandContent = `<p class="text-sm text-muted leading-relaxed pt-4">${item.detail}</p>`;
      if (item.short) previewLine = `<p class="text-sm text-ink/60 mt-2 max-w-2xl">${item.short}</p>`;
    } else if (isDesign) {
      const imageBlock = renderDesignImages(item, title);
      expandContent = `<p class="text-sm text-muted leading-relaxed pt-4">${item.desc}</p><p class="text-xs text-muted/70 mt-2">${item.tag}</p>${imageBlock}`;
    }

    const expandBodyCls = isDesign
      ? 'design-expand-body pl-0 md:pl-4 w-full border-l-2 border-butter ml-1 md:ml-2'
      : 'pl-0 md:pl-4 max-w-3xl border-l-2 border-butter ml-1 md:ml-2';

    return `
    <div class="venture-row" id="row-${key}">
      <button onclick="toggleVenture('${type}', ${i})" class="w-full text-left py-6 md:py-8 flex flex-wrap items-start justify-between gap-4 group">
        <div class="flex-1 min-w-0">
          <span class="section-num block mb-2">${num}/${String(total).padStart(3, '0')}</span>
          <h3 class="text-xl md:text-2xl font-bold tracking-tight mb-1">${title}</h3>
          <p class="text-sm text-ink venture-meta">${sub}${time ? ' · ' + time : ''}</p>
          ${previewLine}
        </div>
        <span class="discover-btn text-sm font-medium shrink-0 flex items-center gap-1 mt-2">
          <span>${data.discover}</span>
          <span class="text-lg leading-none">+</span>
        </span>
      </button>
      <div class="expand-panel pb-6" id="panel-${key}">
        <div class="${expandBodyCls}">${expandContent}</div>
      </div>
    </div>`;
  }).join('');
}

function renderInterface() {
  const data = window.langData[currentLang];
  activeVenture = null;

  const aeroTitle = document.getElementById('aero-window-title');
  if (aeroTitle) aeroTitle.textContent = data.aeroWindowTitle || 'About_Vivian Long';
  const aeroClose = document.getElementById('aero-win-close');
  if (aeroClose) aeroClose.setAttribute('aria-label', data.closeWindowLabel);

  document.getElementById('about-hello').innerText = data.aboutHello;
  const aboutOverlay = document.getElementById('about-overlay');
  if (aboutOverlay) aboutOverlay.innerText = data.aboutOverlay;
  document.getElementById('about-body').innerHTML = data.aboutBody;
  document.getElementById('about-read-more-text').innerText = data.aboutReadMore;
  document.getElementById('about-skill-title').innerText = data.aboutSkillTitle;
  document.getElementById('about-like-title').innerText = data.aboutLikeTitle;
  document.getElementById('about-skill-list').innerHTML = data.aboutSkillList.map(i => `<li>${i}</li>`).join('');
  document.getElementById('about-like-list').innerHTML = data.aboutLikeList.map(i => `<li>${i}</li>`).join('');

  DETAIL_TABS.forEach(key => {
    document.getElementById(`tab-${key}`).innerText = data.detailTabs[key];
  });

  document.getElementById('exp-label').innerText = data.expLabel;
  document.getElementById('exp-heading').innerText = data.expHeading;
  document.getElementById('exp-sub').innerText = data.expSub;
  renderList('experience-list', data.experience, 'exp');

  document.getElementById('design-label').innerText = data.designLabel;
  document.getElementById('design-heading').innerText = data.designHeading;
  const designBadgeEl = document.getElementById('design-badge');
  if (designBadgeEl) {
    designBadgeEl.innerText = data.designBadge || '';
    designBadgeEl.hidden = !data.designBadge;
  }
  renderList('design-list', data.designs, 'design');

  document.getElementById('proj-label').innerText = data.projLabel;
  document.getElementById('proj-heading').innerText = data.projHeading;
  renderList('projects-list', data.projects, 'proj');

  document.getElementById('research-label').innerText = data.researchLabel;
  document.getElementById('research-heading').innerText = data.researchHeading;
  renderList('research-list', data.research, 'research');

  switchDetailTab(activeDetailTab);

  document.getElementById('contact-title-accessible').innerText = data.contactTitle;
  document.getElementById('contact-xhs').innerText = data.contactXhsLabel;
  document.getElementById('contact-douyin').innerText = data.contactDouyinLabel;
  if (window.mountRhinestone) {
    window.mountRhinestone(data.contactTitle);
  } else {
    window._pendingRhinestone = data.contactTitle;
  }
  const footerSlogan = document.getElementById('footer-slogan');
  if (footerSlogan) footerSlogan.innerText = data.footerSlogan;
}

window.addEventListener('DOMContentLoaded', () => {
  initDetailTabs();
  initDesignLightbox();
  renderInterface();
  if (location.hash) applyDetailHash();
});
window.addEventListener('hashchange', applyDetailHash);
