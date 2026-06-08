function buildPreviewArt(work) {
    return `
        <div class="wal-preview-art" style="background: linear-gradient(145deg, ${work.color} 0%, ${work.color}88 40%, #000 100%);">
            <span class="wal-preview-art-cat">${work.category}</span>
            <span class="wal-preview-art-label" style="color: ${work.accent}">${work.imageLabel}</span>
        </div>
    `;
}

function renderWorksList(lang) {
    const data = langData[lang];
    const list = document.getElementById('wal-works-list');
    const previewInner = document.getElementById('wal-preview-inner');
    const mobilePreview = document.getElementById('wal-mobile-preview');
    if (!list || !previewInner) return;

    list.innerHTML = '';
    previewInner.innerHTML = '';

    data.works.forEach((work, i) => {
        const li = document.createElement('li');
        li.className = 'wal-work-item' + (i === 0 ? ' is-active' : '');
        li.dataset.index = i;
        li.innerHTML = `
            <a href="work.html?slug=${work.slug}" class="wal-work-link" data-index="${i}">
                <span class="wal-work-title">${work.listTitle}</span>
                <span class="wal-work-location">${work.location}</span>
                <span class="wal-work-cat">${work.category}</span>
            </a>
        `;
        list.appendChild(li);

        const media = document.createElement('div');
        media.className = 'wal-preview-media' + (i === 0 ? ' is-visible' : '');
        media.dataset.index = i;
        media.innerHTML = buildPreviewArt(work);
        previewInner.appendChild(media);
    });

    if (mobilePreview && data.works[0]) {
        mobilePreview.innerHTML = buildPreviewArt(data.works[0]);
    }

    initWorksHover();
}

function setActiveWork(index) {
    document.querySelectorAll('.wal-work-item').forEach((el, i) => {
        el.classList.toggle('is-active', i === index);
    });
    document.querySelectorAll('.wal-preview-media').forEach((el, i) => {
        el.classList.toggle('is-visible', i === index);
    });

    const counter = document.getElementById('wal-preview-counter');
    const total = langData[currentLang].works.length;
    if (counter) {
        counter.textContent = `${String(index + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;
    }

    const mobilePreview = document.getElementById('wal-mobile-preview');
    const work = langData[currentLang].works[index];
    if (mobilePreview && work) {
        mobilePreview.innerHTML = buildPreviewArt(work);
    }
}

function initWorksHover() {
    const items = document.querySelectorAll('.wal-work-item');
    const frame = document.querySelector('.wal-preview-frame');
    let activeIndex = 0;

    items.forEach((item) => {
        const index = parseInt(item.dataset.index, 10);

        item.addEventListener('mouseenter', () => {
            activeIndex = index;
            setActiveWork(index);
        });
    });

    if (frame) {
        document.addEventListener('mousemove', (e) => {
            if (window.innerWidth <= 1024) return;
            const rect = frame.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const dx = (e.clientX - cx) / rect.width;
            const dy = (e.clientY - cy) / rect.height;
            frame.style.transform = `translate3d(${dx * 14}px, ${dy * 10}px, 0)`;
        });
    }

    setActiveWork(0);

    if (window.innerWidth <= 1024 && 'IntersectionObserver' in window) {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const index = parseInt(entry.target.dataset.index, 10);
                        setActiveWork(index);
                    }
                });
            },
            { rootMargin: '-30% 0px -30% 0px', threshold: 0 }
        );
        items.forEach((item) => observer.observe(item));
    }
}

function renderWorkDetail(lang) {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug');
    const work = getWorkBySlug(slug, lang);
    const root = document.getElementById('wal-detail-root');
    if (!root) return;

    if (!work) {
        root.innerHTML = `<p class="wal-body-text">Work not found. <a href="works.html">← Back to Works</a></p>`;
        return;
    }

    document.title = `${work.listTitle} | Vivian Long`;

    const bullets = work.bullets.map((b) => `<li>${b}</li>`).join('');

    root.innerHTML = `
        <a href="works.html" class="wal-detail-back">← Works</a>
        <p class="wal-work-cat">${work.category}</p>
        <h1 class="wal-detail-title">${work.detailTitle}</h1>
        <p class="wal-detail-meta">
            ${work.role}
            <span class="wal-detail-time">${work.time}</span>
        </p>
        <p class="wal-work-location" style="margin-bottom:2rem">${work.location}</p>
        <div class="wal-detail-sticky">
            <ul class="wal-detail-bullets">${bullets}</ul>
            <aside class="wal-preview" style="position:sticky;top:0;height:80vh;width:100%">
                <div class="wal-preview-inner" style="position:relative;inset:auto;height:100%">
                    <div class="wal-preview-frame" style="height:100%">
                        ${buildPreviewArt(work)}
                    </div>
                </div>
            </aside>
        </div>
    `;
}

function updateWalLabels(lang) {
    const data = langData[lang];
    document.querySelectorAll('[data-wal]').forEach((el) => {
        const key = el.getAttribute('data-wal');
        const keys = key.split('.');
        let val = data;
        keys.forEach((k) => { val = val?.[k]; });
        if (val) el.textContent = val;
    });
}
