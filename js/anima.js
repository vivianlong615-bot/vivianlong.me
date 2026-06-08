let currentLang = localStorage.getItem('vivian-lang') || 'zh';
let carouselIndex = 0;
let heroLineIndex = 0;
let heroLineTimer = null;

function t(keyPath) {
    const keys = keyPath.split('.');
    let v = langData[currentLang];
    keys.forEach((k) => { v = v?.[k]; });
    return v;
}

function padNum(n, total) {
    return `${String(n).padStart(3, '0')} / ${String(total).padStart(3, '0')}`;
}

/* ── Loader ── */
function initLoader() {
    const loader = document.getElementById('an-loader');
    const countEl = document.getElementById('an-loader-count');
    if (!loader || !countEl) return;

    document.body.classList.add('is-loading');
    let progress = 0;
    const tick = () => {
        progress += Math.random() * 12 + 4;
        if (progress >= 100) {
            progress = 100;
            countEl.textContent = String(Math.floor(progress)).padStart(3, '0');
            setTimeout(() => {
                loader.classList.add('is-done');
                document.body.classList.remove('is-loading');
            }, 400);
            return;
        }
        countEl.textContent = String(Math.floor(progress)).padStart(3, '0');
        requestAnimationFrame(() => setTimeout(tick, 40 + Math.random() * 60));
    };
    tick();
}

/* ── Menu ── */
function initMenu() {
    const overlay = document.getElementById('an-menu');
    const openBtn = document.getElementById('an-menu-open');
    const closeBtn = document.getElementById('an-menu-close');
    if (!overlay) return;

    const toggle = (open) => {
        overlay.classList.toggle('is-open', open);
        document.body.style.overflow = open ? 'hidden' : '';
    };

    openBtn?.addEventListener('click', () => toggle(true));
    closeBtn?.addEventListener('click', () => toggle(false));
    overlay.querySelectorAll('a').forEach((a) => {
        a.addEventListener('click', () => toggle(false));
    });
}

/* ── Header scroll ── */
function initHeader() {
    const header = document.getElementById('an-header');
    if (!header) return;
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
}

/* ── Scroll reveal ── */
function initReveal() {
    const els = document.querySelectorAll('.an-reveal');
    if (!els.length) return;
    const io = new IntersectionObserver(
        (entries) => {
            entries.forEach((e) => {
                if (e.isIntersecting) {
                    e.target.classList.add('is-visible');
                    io.unobserve(e.target);
                }
            });
        },
        { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    els.forEach((el) => io.observe(el));
}

/* ── Hero rotating lines ── */
function initHeroLines() {
    const container = document.getElementById('an-hero-lines');
    if (!container) return;
    const lines = langData[currentLang].heroLines;
    container.innerHTML = lines
        .map((text, i) => `<p class="an-hero-line${i === 0 ? ' is-active' : ''}" data-i="${i}">${text}</p>`)
        .join('');

    heroLineTimer = setInterval(() => {
        const items = container.querySelectorAll('.an-hero-line');
        items.forEach((el) => el.classList.remove('is-active'));
        heroLineIndex = (heroLineIndex + 1) % lines.length;
        items[heroLineIndex]?.classList.add('is-active');
    }, 3200);
}

/* ── Ventures carousel ── */
function buildVentureVisual(work) {
    return `
        <div class="an-venture-visual-inner" style="background: linear-gradient(145deg, ${work.color} 0%, ${work.color}99 100%); color: ${work.accent}">
            <span class="an-venture-visual-cat">${work.category}</span>
            <span class="an-venture-visual-label">${work.imageLabel}</span>
        </div>
    `;
}

function renderCarousel(lang) {
    const data = langData[lang];
    const track = document.getElementById('an-carousel');
    const dots = document.getElementById('an-carousel-dots');
    if (!track) return;

    track.innerHTML = data.works
        .map(
            (w) => `
        <article class="an-venture-slide" data-slug="${w.slug}">
            <div class="an-venture-visual">${buildVentureVisual(w)}</div>
            <div class="an-venture-content">
                <p class="an-venture-meta">${w.location} · ${w.time}</p>
                <h3>${w.listTitle}</h3>
                <p class="an-venture-desc">${w.desc}</p>
                <a href="work.html?slug=${w.slug}" class="an-venture-link">${data.venturesDiscover} →</a>
            </div>
        </article>
    `
        )
        .join('');

    if (dots) {
        dots.innerHTML = data.works
            .map(
                (w, i) =>
                    `<button type="button" class="an-carousel-dot${i === 0 ? ' is-active' : ''}" data-i="${i}" aria-label="${w.listTitle}">${w.imageLabel}</button>`
            )
            .join('');
        dots.querySelectorAll('.an-carousel-dot').forEach((btn) => {
            btn.addEventListener('click', () => goToSlide(parseInt(btn.dataset.i, 10)));
        });
    }

    carouselIndex = 0;
    updateCarousel();
}

function updateCarousel() {
    const track = document.getElementById('an-carousel');
    const counter = document.getElementById('an-carousel-counter');
    const data = langData[currentLang];
    if (!track) return;

    track.style.transform = `translateX(-${carouselIndex * 100}%)`;
    if (counter) counter.textContent = padNum(carouselIndex + 1, data.works.length);
    document.querySelectorAll('.an-carousel-dot').forEach((d, i) => {
        d.classList.toggle('is-active', i === carouselIndex);
    });
}

function goToSlide(i) {
    const total = langData[currentLang].works.length;
    carouselIndex = ((i % total) + total) % total;
    updateCarousel();
}

function initCarousel() {
    document.getElementById('an-carousel-prev')?.addEventListener('click', () => goToSlide(carouselIndex - 1));
    document.getElementById('an-carousel-next')?.addEventListener('click', () => goToSlide(carouselIndex + 1));

    let touchX = 0;
    const wrap = document.querySelector('.an-carousel-wrap');
    wrap?.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
    wrap?.addEventListener('touchend', (e) => {
        const dx = e.changedTouches[0].clientX - touchX;
        if (Math.abs(dx) > 50) goToSlide(carouselIndex + (dx < 0 ? 1 : -1));
    });
}

function renderDesign(lang) {
    const grid = document.getElementById('an-design-grid');
    if (!grid) return;
    const data = langData[lang];
    grid.innerHTML = data.designs
        .map(
            (d) => {
                const visual = d.images?.length
                    ? `<div class="an-design-visual-gallery">${d.images.map((img) => {
                        const src = img.src || img;
                        const alt = img.alt || d.title;
                        return `<figure class="an-design-visual an-design-visual--photo"><img src="${src}" alt="${alt}" loading="lazy" decoding="async"></figure>`;
                    }).join('')}</div>`
                    : d.image
                    ? `<div class="an-design-visual an-design-visual--photo"><img src="${d.image}" alt="${d.imageAlt || d.title}" loading="lazy" decoding="async"></div>`
                    : `<div class="an-design-visual" style="background:linear-gradient(145deg,${d.color},${d.color}99);color:${d.accent}"><span style="font-family:var(--font-serif);font-size:1.25rem;font-weight:500">${d.code}</span></div>`;
                return `
        <article class="an-design-item an-reveal">
            <span class="an-research-tag">DESIGN ${d.code}</span>
            ${visual}
            <h3>${d.title}</h3>
            <p style="font-size:0.9rem;color:var(--text-muted);line-height:1.65">${d.desc}</p>
            <span class="an-research-tag" style="margin-top:0.75rem;display:inline-block">${d.tag}</span>
        </article>
    `;
            }
        )
        .join('');
}

function renderResearch(lang) {
    const awardsEl = document.getElementById('an-awards-list');
    const blockEl = document.getElementById('an-research-block');
    const data = langData[lang];

    if (awardsEl) {
        awardsEl.innerHTML = `
            <h3 class="an-section-title" style="font-size:1.5rem;margin-bottom:1rem">${data.awardsTitle}</h3>
            ${data.awards
                .map(
                    (a) => `
                <div class="an-award-item an-reveal">
                    <strong>${a.name}</strong>
                    <span>${a.proj}</span>
                </div>
            `
                )
                .join('')}
        `;
    }

    if (blockEl && data.researchBlock) {
        const r = data.researchBlock;
        blockEl.innerHTML = `
            <article class="an-research-block an-reveal">
                <span class="an-research-tag">${r.dir}</span>
                <h3 style="font-family:var(--font-serif);font-size:1.5rem;font-weight:500;margin:1rem 0;line-height:1.3">${r.name}</h3>
                <p style="font-size:0.95rem;color:var(--text-muted);line-height:1.7;margin-bottom:1rem">${r.content}</p>
                <p style="font-size:0.9rem;padding:1rem;background:rgba(255,255,255,0.5);border-left:2px solid var(--accent-sage)">${r.focus}</p>
            </article>
        `;
    }
}

function renderFacts(lang) {
    const box = document.getElementById('an-facts-cloud');
    if (!box) return;
    box.innerHTML = langData[lang].facts
        .map((f) => `<span class="an-fact-pill an-reveal">${f}</span>`)
        .join('');
}

/* ── Full page render ── */
function renderPage(lang) {
    const data = langData[lang];

    document.querySelectorAll('[data-t]').forEach((el) => {
        const key = el.getAttribute('data-t');
        const keys = key.split('.');
        let v = data;
        keys.forEach((k) => { v = v?.[k]; });
        if (v != null) {
            if (el.tagName === 'INPUT') el.placeholder = v;
            else el.innerHTML = v;
        }
    });

    const heroH1 = document.getElementById('an-hero-headline');
    if (heroH1) heroH1.textContent = data.heroHeadline;

    const aboutLead = document.getElementById('an-about-lead');
    const aboutBody = document.getElementById('an-about-body');
    if (aboutLead) aboutLead.textContent = data.aboutLead;
    if (aboutBody) aboutBody.innerHTML = data.aboutBodyHtml;

    const skillsGrid = document.getElementById('an-skills-grid');
    if (skillsGrid) {
        skillsGrid.innerHTML = `
            <div class="an-skill-box an-reveal">
                <h4>${data.aboutSkillTitle}</h4>
                <ul>${data.aboutSkillList.map((s) => `<li>${s}</li>`).join('')}</ul>
            </div>
            <div class="an-skill-box an-reveal">
                <h4>${data.aboutLikeTitle}</h4>
                <ul>${data.aboutLikeList.map((s) => `<li>${s}</li>`).join('')}</ul>
            </div>
        `;
    }

    const aboutList = document.getElementById('an-about-list');
    if (aboutList) {
        aboutList.innerHTML = data.aboutPoints.map((p) => `<li>${p}</li>`).join('');
    }

    const steps = document.getElementById('an-steps');
    if (steps) {
        steps.innerHTML = data.methodSteps
            .map((s) => `<div class="an-step an-reveal"><h3>${s.title}</h3><p>${s.desc}</p></div>`)
            .join('');
    }

    const cards = document.getElementById('an-studio-cards');
    if (cards) {
        cards.innerHTML = data.studioCards
            .map((c) => `<div class="an-card an-reveal"><h3>${c.title}</h3><p>${c.desc}</p></div>`)
            .join('');
    }

    const tags = document.getElementById('an-tags');
    if (tags) {
        tags.innerHTML = data.heroTags.map((tag) => `<span class="an-tag">${tag}</span>`).join('');
    }

    const menuNav = document.getElementById('an-menu-nav');
    if (menuNav) {
        const links = [
            ['#about', data.nav.about],
            ['#mission', data.nav.mission],
            ['#studio', data.nav.studio],
            ['#ventures', data.nav.ventures],
            ['#design', data.nav.design],
            ['#research', data.nav.research],
            ['#facts', data.sections.facts.label],
            ['#contact', data.nav.contact]
        ];
        menuNav.innerHTML = links.map(([href, label]) => `<li><a href="${href}">${label}</a></li>`).join('');
    }

    const contactDetails = document.getElementById('an-contact-details');
    if (contactDetails) {
        contactDetails.innerHTML = `
            <div>Email ｜ <a href="mailto:${data.footerEmail}">${data.footerEmail}</a></div>
            <div>Phone ｜ <strong style="color:var(--text)">${data.contactPhone}</strong></div>
        `;
    }

    const footerSlogan = document.getElementById('an-footer-slogan');
    if (footerSlogan) footerSlogan.textContent = data.footerSlogan;

    const contactBtn = document.getElementById('an-contact-btn');
    if (contactBtn) {
        contactBtn.href = `mailto:${data.footerEmail}`;
        contactBtn.textContent = data.footerContact;
    }

    renderCarousel(lang);
    renderDesign(lang);
    renderResearch(lang);
    renderFacts(lang);
    initReveal();
}

function renderWorkDetail(lang) {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug');
    const work = getWorkBySlug(slug, lang);
    const root = document.getElementById('an-detail-root');
    if (!root) return;

    if (!work) {
        root.innerHTML = `<p>Not found. <a href="cover.html#ventures">Back</a></p>`;
        return;
    }

    document.title = `${work.listTitle} | Vivian Long`;
    const bullets = work.bullets.map((b) => `<li>${b}</li>`).join('');
    const kw = (work.keywords || [])
        .map((k) => `<span class="an-tag" style="margin-right:0.35rem;margin-bottom:0.35rem;display:inline-block">${k}</span>`)
        .join('');

    root.innerHTML = `
        <a href="cover.html#ventures" class="an-detail-back">← ${langData[lang].nav.ventures}</a>
        <div class="an-detail-visual" style="background: linear-gradient(145deg, ${work.color}, ${work.color}88)">
            <span class="an-venture-visual-label" style="color:${work.accent};font-family:var(--font-serif);font-size:2.5rem">${work.imageLabel}</span>
        </div>
        <span class="an-research-tag">${work.category} · ${work.time}</span>
        <h1>${work.detailTitle}</h1>
        <p class="an-detail-meta">${work.role} · ${work.location}</p>
        <div class="an-tags" style="margin:1rem 0">${kw}</div>
        <p class="an-section-intro">${work.desc}</p>
        <ul class="an-detail-bullets">${bullets}</ul>
    `;
}

function switchLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('vivian-lang', lang);
    document.querySelectorAll('.an-lang-btn').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.lang === lang);
    });
    document.documentElement.lang = lang === 'zh' ? 'zh' : 'en';

    if (document.body.dataset.page === 'detail') {
        renderWorkDetail(lang);
    } else {
        clearInterval(heroLineTimer);
        renderPage(lang);
        initHeroLines();
    }
}

function initLang() {
    document.querySelectorAll('.an-lang-btn').forEach((btn) => {
        btn.addEventListener('click', () => switchLanguage(btn.dataset.lang));
    });
    switchLanguage(currentLang);
}

function initAnima() {
    initLoader();
    initMenu();
    initHeader();
    initCarousel();

    if (document.body.dataset.page === 'detail') {
        initLang();
    } else {
        initLang();
        initHeroLines();
    }
}

document.addEventListener('DOMContentLoaded', initAnima);
