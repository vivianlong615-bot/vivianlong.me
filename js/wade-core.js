const burstTexts = ["💥 INSIGHT", "🔥 VIBE", "🎨 ART", "💡 LOGIC", "🧠 EMOTION", "⚡ CREATIVE", "🍷 ROMANCE"];

let currentLang = localStorage.getItem('wade-lang') || 'zh';

function initWadeCursor() {
    const cursor = document.getElementById('wade-cursor');
    if (!cursor) return;

    document.addEventListener('mousemove', (e) => {
        cursor.style.left = `${e.clientX}px`;
        cursor.style.top = `${e.clientY}px`;

        const target = e.target;
        if (
            target.tagName === 'BUTTON' ||
            target.tagName === 'A' ||
            target.closest('.wade-tag') ||
            target.closest('.wal-tag') ||
            target.closest('.wade-exp-card') ||
            target.closest('.wal-work-link') ||
            target.closest('.wal-side-link') ||
            target.closest('.wal-btn') ||
            target.closest('#portrait-trigger')
        ) {
            document.body.classList.add('hovering');
        } else {
            document.body.classList.remove('hovering');
        }
    });
}

function initClickBurst() {
    document.addEventListener('click', (e) => {
        const burst = document.createElement('div');
        burst.className = 'click-burst';
        burst.innerText = burstTexts[Math.floor(Math.random() * burstTexts.length)];
        burst.style.left = `${e.clientX}px`;
        burst.style.top = `${e.clientY}px`;
        document.body.appendChild(burst);
        setTimeout(() => burst.remove(), 600);
    });
}

function initCardTilt() {
    document.querySelectorAll('.wade-exp-card').forEach((card) => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const rotateX = (rect.height / 2 - y) / 10;
            const rotateY = (x - rect.width / 2) / 15;
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
        });
    });
}

function initPortraitInteraction() {
    const trigger = document.getElementById('portrait-trigger');
    const bgBlock = document.getElementById('vibe-bg-block');
    const imgRed = document.getElementById('img-red');
    const imgCyan = document.getElementById('img-cyan');
    const imgMain = document.getElementById('img-main');
    const vibeBadge = document.getElementById('vibe-badge');

    if (!trigger) return;

    trigger.addEventListener('mousemove', (e) => {
        const rect = trigger.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const offsetX = (x - rect.width / 2) / (rect.width / 2);
        const offsetY = (y - rect.height / 2) / (rect.height / 2);

        bgBlock.style.transform = `translate(${offsetX * -25 + 16}px, ${offsetY * -25 + 16}px)`;
        vibeBadge.style.transform = `rotate(${offsetX * 15 - 6}deg) translate(${offsetX * 10}px, ${offsetY * 10}px)`;
        imgRed.style.transform = `translate(${offsetX * 14 - 4}px, ${offsetY * 6}px) scale(1.05)`;
        imgCyan.style.transform = `translate(${offsetX * -14 + 4}px, ${offsetY * -6}px) scale(1.05)`;
        imgMain.style.transform = `translate(${offsetX * 4}px, ${offsetY * 4}px)`;
    });

    trigger.addEventListener('mouseleave', () => {
        bgBlock.style.transform = 'translate(16px, 16px)';
        vibeBadge.style.transform = 'rotate(-6deg) translate(0px, 0px)';
        imgRed.style.transform = 'translate(-3px, 0px) scale(1.05)';
        imgCyan.style.transform = 'translate(3px, 0px) scale(1.05)';
        imgMain.style.transform = 'translate(0px, 0px)';
    });
}

function updateLangButtons(lang) {
    const btnZh = document.getElementById('btn-zh');
    const btnEn = document.getElementById('btn-en');
    if (!btnZh || !btnEn) return;

    [btnZh, btnEn].forEach((btn) => {
        btn.classList.remove('text-yellow-300', 'underline', 'active');
        btn.classList.add('opacity-60');
    });

    const active = lang === 'zh' ? btnZh : btnEn;
    active.classList.add('text-yellow-300', 'underline', 'active');
    active.classList.remove('opacity-60');
}

function switchLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('wade-lang', lang);
    updateLangButtons(lang);
    if (typeof onLanguageChange === 'function') onLanguageChange(lang);
}

function initWadeShell() {
    initWadeCursor();
    initClickBurst();
    initCardTilt();
    initPortraitInteraction();
    updateLangButtons(currentLang);
}

document.addEventListener('DOMContentLoaded', initWadeShell);
