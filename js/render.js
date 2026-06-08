function renderExperience(container, items) {
    container.innerHTML = '';
    items.forEach((exp) => {
        const card = document.createElement('div');
        card.className = 'wade-exp-card p-6 md:p-8 space-y-4';
        const bulletsHtml = exp.bullets
            .map((b) => `<li class="text-sm text-neutral-400 font-medium leading-relaxed">${b}</li>`)
            .join('');
        card.innerHTML = `
            <div class="inner-3d flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-neutral-800 pb-3 gap-2">
                <div>
                    <h3 class="text-lg font-black text-white tracking-wide">${exp.company}</h3>
                    <p class="text-xs font-bold text-blue-500 uppercase mt-0.5">// ${exp.role}</p>
                </div>
                <span class="text-xs font-mono font-bold border-2 border-white px-2 py-0.5 bg-white text-black">${exp.time}</span>
            </div>
            <ul class="inner-3d list-disc pl-4 space-y-2 mt-2">${bulletsHtml}</ul>
        `;
        container.appendChild(card);
    });
    initCardTilt();
}

function renderProjects(container, items) {
    container.innerHTML = '';
    items.forEach((proj) => {
        const card = document.createElement('div');
        card.className = 'wade-exp-card p-6 md:p-8 flex flex-col justify-between space-y-4';
        card.innerHTML = `
            <div class="inner-3d space-y-2">
                <span class="text-xs font-mono font-black text-black bg-yellow-300 px-1.5 py-0.5 inline-block">${proj.tag}</span>
                <h3 class="text-base font-black text-white leading-tight pt-1">${proj.title}</h3>
                <p class="text-xs font-bold text-neutral-500">${proj.time}</p>
                <p class="text-sm text-neutral-400 leading-relaxed pt-2 text-justify">${proj.desc}</p>
            </div>
            <div class="inner-3d text-xs font-mono text-blue-500 font-bold pt-2 border-t border-neutral-900 flex justify-between">
                <span>CASE STUDY</span><span>→</span>
            </div>
        `;
        container.appendChild(card);
    });
    initCardTilt();
}

function renderResearch(container, items) {
    container.innerHTML = '';
    items.forEach((res) => {
        const card = document.createElement('div');
        card.className = 'wade-exp-card p-6 md:p-8 space-y-3';
        card.innerHTML = `
            <div class="inner-3d flex flex-wrap items-center gap-3">
                <span class="text-xs font-black border-2 border-blue-500 text-blue-500 px-2 py-0.5 bg-black">${res.tag}</span>
            </div>
            <h3 class="inner-3d text-lg font-black text-white tracking-wide">${res.title}</h3>
            <p class="inner-3d text-sm text-neutral-400 leading-relaxed text-justify">${res.desc}</p>
        `;
        container.appendChild(card);
    });
    initCardTilt();
}

function renderTags(container, tags) {
    container.innerHTML = '';
    tags.forEach((tag) => {
        const btn = document.createElement('button');
        btn.className = 'wade-tag';
        btn.type = 'button';
        btn.innerText = tag;
        container.appendChild(btn);
    });
}

function renderList(container, items, itemClass) {
    container.innerHTML = '';
    items.forEach((text) => {
        const li = document.createElement('li');
        li.className = itemClass;
        li.innerText = text;
        container.appendChild(li);
    });
}

function updateNavLabels(lang) {
    const data = langData[lang].nav;
    document.querySelectorAll('[data-nav]').forEach((el) => {
        const key = el.getAttribute('data-nav');
        if (data[key]) el.textContent = data[key];
    });
}
