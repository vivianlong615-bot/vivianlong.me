function renderWalSideNav(activePage) {
    document.querySelectorAll('.wal-side-link').forEach((link) => {
        const page = link.dataset.page;
        link.classList.toggle('active', page === activePage);
    });
}

function renderHome(lang) {
    const data = langData[lang];
    const title = document.getElementById('hero-title');
    const sub = document.getElementById('hero-sub');
    const badge = document.getElementById('vibe-badge');
    const btn = document.getElementById('btn-enter');
    const tags = document.getElementById('hero-tags');

    if (title) title.innerHTML = data.heroTitle;
    if (sub) sub.innerHTML = `<p class="hero-intro-text">${data.heroSub}</p>`;
    if (badge) badge.textContent = data.vibeBadge;
    if (btn) btn.textContent = data.btnEnter;

    if (tags) {
        tags.innerHTML = '';
        data.heroTags.forEach((t) => {
            const span = document.createElement('span');
            span.className = 'wal-tag';
            span.textContent = t;
            tags.appendChild(span);
        });
    }

    updateWalLabels(lang);
}

function renderPractice(lang) {
    const data = langData[lang];
    const about = document.getElementById('about-content');
    const title = document.getElementById('about-title');
    const skillTitle = document.getElementById('toolkit-title');
    const focusTitle = document.getElementById('focus-title');
    const skillList = document.getElementById('about-skill-list');
    const likeList = document.getElementById('about-like-list');
    const tags = document.getElementById('hero-tags-container');

    if (title) title.textContent = data.aboutTitle;
    if (about) about.innerHTML = data.aboutContent;
    if (skillTitle) skillTitle.textContent = data.aboutSkillTitle;
    if (focusTitle) focusTitle.textContent = data.aboutLikeTitle;

    if (skillList) {
        skillList.innerHTML = data.aboutSkillList.map((s) => `<li>${s}</li>`).join('');
    }
    if (likeList) {
        likeList.innerHTML = data.aboutLikeList.map((s) => `<li>${s}</li>`).join('');
    }
    if (tags) {
        tags.innerHTML = '';
        data.heroTags.forEach((t) => {
            const span = document.createElement('span');
            span.className = 'wal-tag';
            span.textContent = t;
            tags.appendChild(span);
        });
    }

    updateWalLabels(lang);
}

function onLanguageChange(lang) {
    const page = document.body.dataset.page;
    updateWalLabels(lang);

    if (page === 'home') renderHome(lang);
    if (page === 'practice') renderPractice(lang);
    if (page === 'works') {
        document.getElementById('wal-page-label').textContent = langData[lang].pageWorks;
        renderWorksList(lang);
    }
    if (page === 'work') renderWorkDetail(lang);
}
