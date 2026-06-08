/**
 * TextPressure — vanilla port of React Bits component
 * https://codepen.io/JuanFuentes/full/rgXKGQ
 */

const dist = (a, b) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
};

const getAttr = (distance, maxDist, minVal, maxVal) => {
  const val = maxVal - Math.abs((maxVal * distance) / maxDist);
  return Math.max(minVal, val + minVal);
};

function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export function initTextPressure(container, text, opts = {}) {
  const {
    fontFamily = 'Compressa VF',
    fontUrl = 'https://res.cloudinary.com/dr6lvwubh/raw/upload/v1529908256/CompressaPRO-GX.woff2',
    flex = true,
    scale = false,
    alpha = false,
    stroke = false,
    width = true,
    weight = true,
    italic = true,
    textColor = '#FFFFFF',
    strokeColor = '#FF0000',
    className = '',
    minFontSize = 24,
    fontScale = 1,
    weightMin = 100,
    weightMax = 900,
    textTransform = 'uppercase',
  } = opts;

  const styleId = `text-pressure-font-${fontFamily.replace(/\s+/g, '-')}`;
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @font-face {
        font-family: '${fontFamily}';
        src: url('${fontUrl}');
        font-style: normal;
      }
      .text-pressure-root {
        position: relative;
        width: 100%;
        height: 100%;
        background: transparent;
      }
      .text-pressure-title.text-pressure-flex {
        display: flex;
        justify-content: space-between;
      }
      .text-pressure-title.stroke span {
        position: relative;
        color: ${textColor};
      }
      .text-pressure-title.stroke span::after {
        content: attr(data-char);
        position: absolute;
        left: 0;
        top: 0;
        color: transparent;
        z-index: -1;
        -webkit-text-stroke-width: 3px;
        -webkit-text-stroke-color: ${strokeColor};
      }
      .text-pressure-title .text-pressure-space {
        min-width: 0.32em;
        width: 0.32em;
      }
    `;
    document.head.appendChild(style);
  }

  container.innerHTML = '';
  const root = document.createElement('div');
  root.className = 'text-pressure-root';

  const title = document.createElement('h1');
  title.className = [
    'text-pressure-title',
    className,
    flex ? 'text-pressure-flex' : '',
    stroke ? 'stroke' : '',
  ].filter(Boolean).join(' ');
  title.style.fontFamily = fontFamily;
  title.style.textTransform = textTransform;
  title.style.margin = '0';
  title.style.textAlign = 'center';
  title.style.userSelect = 'none';
  title.style.whiteSpace = 'nowrap';
  title.style.fontWeight = '100';
  title.style.width = '100%';
  title.style.color = textColor;
  title.style.lineHeight = '1';
  title.style.transformOrigin = 'center top';

  const chars = [...text];
  const spans = [];

  chars.forEach((char, i) => {
    const span = document.createElement('span');
    const isSpace = char === ' ';
    span.textContent = isSpace ? '\u00A0' : char;
    span.dataset.char = char;
    span.style.display = 'inline-block';
    if (isSpace) span.className = 'text-pressure-space';
    if (!stroke) span.style.color = textColor;
    title.appendChild(span);
    spans[i] = span;
  });

  root.appendChild(title);
  container.appendChild(root);

  let cancelled = false;
  let rafId = 0;
  let fontSize = minFontSize;
  let scaleY = 1;
  let lineHeight = 1;

  const mouse = { x: 0, y: 0 };
  const cursor = { x: 0, y: 0 };

  function setSize() {
    if (cancelled || !root.isConnected) return;

    const { width: containerW, height: containerH } = root.getBoundingClientRect();
    if (containerW <= 0) return;

    let newFontSize = (containerW / (chars.length / 2)) * fontScale;
    newFontSize = Math.max(newFontSize, minFontSize);
    fontSize = newFontSize;
    scaleY = 1;
    lineHeight = 1;

    title.style.fontSize = `${fontSize}px`;
    title.style.lineHeight = `${lineHeight}`;
    title.style.transform = `scale(1, ${scaleY})`;

    if (scale) {
      requestAnimationFrame(() => {
        if (cancelled || !title.isConnected) return;
        const textRect = title.getBoundingClientRect();
        if (textRect.height > 0) {
          scaleY = containerH / textRect.height;
          lineHeight = scaleY;
          title.style.lineHeight = `${lineHeight}`;
          title.style.transform = `scale(1, ${scaleY})`;
        }
      });
    }
  }

  const debouncedSetSize = debounce(setSize, 100);

  function onMouseMove(e) {
    cursor.x = e.clientX;
    cursor.y = e.clientY;
  }

  function onTouchMove(e) {
    const t = e.touches[0];
    if (t) {
      cursor.x = t.clientX;
      cursor.y = t.clientY;
    }
  }

  function animate() {
    if (cancelled) return;
    rafId = requestAnimationFrame(animate);

    mouse.x += (cursor.x - mouse.x) / 15;
    mouse.y += (cursor.y - mouse.y) / 15;

    const titleRect = title.getBoundingClientRect();
    const maxDist = Math.max(titleRect.width / 2, 1);

    spans.forEach(span => {
      if (!span || span.classList.contains('text-pressure-space')) return;
      const rect = span.getBoundingClientRect();
      const charCenter = {
        x: rect.x + rect.width / 2,
        y: rect.y + rect.height / 2,
      };
      const d = dist(mouse, charCenter);

      const wdth = width ? Math.floor(getAttr(d, maxDist, 5, 200)) : 100;
      const wght = weight ? Math.floor(getAttr(d, maxDist, weightMin, weightMax - weightMin)) : 400;
      const italVal = italic ? getAttr(d, maxDist, 0, 1).toFixed(2) : 0;
      const alphaVal = alpha ? getAttr(d, maxDist, 0, 1).toFixed(2) : 1;

      const settings = `'wght' ${wght}, 'wdth' ${wdth}, 'ital' ${italVal}`;
      if (span.style.fontVariationSettings !== settings) {
        span.style.fontVariationSettings = settings;
      }
      if (alpha && span.style.opacity !== alphaVal) {
        span.style.opacity = alphaVal;
      }
    });
  }

  async function init() {
    try {
      await document.fonts.load(`100 16px "${fontFamily}"`);
    } catch {
      await document.fonts.ready;
    }
    if (cancelled) return;

    const rect = root.getBoundingClientRect();
    mouse.x = rect.left + rect.width / 2;
    mouse.y = rect.top + rect.height / 2;
    cursor.x = mouse.x;
    cursor.y = mouse.y;

    setSize();
    animate();
  }

  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('touchmove', onTouchMove, { passive: true });
  window.addEventListener('resize', debouncedSetSize);

  const ro = new ResizeObserver(debouncedSetSize);
  ro.observe(root);
  if (container !== root) ro.observe(container);

  init();

  return () => {
    cancelled = true;
    cancelAnimationFrame(rafId);
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('touchmove', onTouchMove);
    window.removeEventListener('resize', debouncedSetSize);
    ro.disconnect();
    container.innerHTML = '';
  };
}
