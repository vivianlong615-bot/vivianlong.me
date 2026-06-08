/**
 * Rhinestone / bedazzled cursive text (canvas)
 */
export function initRhinestoneText(container, text, opts = {}) {
  const {
    fontFamily = '"Great Vibes", cursive',
    fontSize = null,
    letterSpacing = 0,
    stoneGap = 5,
    stoneRadius = 2.2,
    bgColor = '#000000',
    pad = 40,
    maskStroke = null,
  } = opts;

  const canvas = document.createElement('canvas');
  canvas.style.display = 'block';
  canvas.style.maxWidth = '100%';
  container.innerHTML = '';
  container.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  let stones = [];
  let raf = 0;
  let cancelled = false;
  const sparkles = [];
  let logicalW = 0;
  let logicalH = 0;

  function pickFontSize(width) {
    if (fontSize) return fontSize;
    if (width < 480) return 58;
    if (width < 768) return 76;
    return 118;
  }

  function measureSpacedText(ctx, str, spacing) {
    const chars = [...str];
    let w = 0;
    chars.forEach((ch, i) => {
      w += ctx.measureText(ch).width;
      if (i < chars.length - 1) w += spacing;
    });
    return w;
  }

  function fillSpacedText(ctx, str, startX, y, spacing, strokeWidth = 0) {
    ctx.textAlign = 'left';
    let x = startX;
    const chars = [...str];
    chars.forEach((ch, i) => {
      const isThin = ch === '!' || ch === 'i' || ch === 'l' || ch === "'";
      const sw = isThin ? strokeWidth * 2.4 : strokeWidth;
      if (sw > 0) {
        ctx.lineWidth = sw;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#fff';
        ctx.strokeText(ch, x, y);
      }
      ctx.fillText(ch, x, y);
      if (isThin) {
        ctx.fillText(ch, x + 0.6, y);
        ctx.fillText(ch, x, y + 0.4);
      }
      x += ctx.measureText(ch).width + (i < chars.length - 1 ? spacing : 0);
    });
  }

  function sampleStones(offCtx, offW, offH, padX, padY, gap, radius) {
    const data = offCtx.getImageData(0, 0, offW, offH).data;
    const pts = [];
    for (let y = 0; y < offH; y += gap) {
      for (let x = 0; x < offW; x += gap) {
        const i = (y * offW + x) * 4;
        if (data[i + 3] > 110) {
          const jitter = ((x * 7 + y * 13) % 5) * 0.04;
          pts.push({
            x: padX + x + jitter,
            y: padY + y + jitter,
            r: radius + ((x + y) % 3) * 0.15,
            seed: Math.random() * Math.PI * 2,
          });
        }
      }
    }
    return pts;
  }

  function drawStone(x, y, r) {
    const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.4, '#fafafa');
    g.addColorStop(0.75, '#e8e8e8');
    g.addColorStop(1, '#9a9a9a');
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 0.4;
    ctx.stroke();
  }

  function drawStar(x, y, size, alpha) {
    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.2;
    ctx.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
      ctx.rotate(Math.PI / 4);
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.lineTo(0, size);
      ctx.stroke();
    }
    ctx.restore();
  }

  function layout() {
    if (cancelled) return;
    const wrapW = container.clientWidth || 600;
    const fs = pickFontSize(wrapW);
    const padding = pad;
    const font = `${fs}px ${fontFamily}`;

    const measure = document.createElement('canvas').getContext('2d');
    measure.font = font;
    const spacing = letterSpacing || Math.round(fs * 0.1);
    const textW = Math.ceil(measureSpacedText(measure, text, spacing));
    const textH = Math.ceil(fs * 1.15);

    const offW = textW + 20;
    const offH = textH + 20;
    const off = document.createElement('canvas');
    off.width = offW;
    off.height = offH;
    const offCtx = off.getContext('2d');
    offCtx.font = font;
    offCtx.fillStyle = '#fff';
    offCtx.textBaseline = 'middle';
    const startX = (offW - textW) / 2;
    const strokeW = maskStroke != null ? maskStroke : Math.max(2.5, fs * 0.1);
    fillSpacedText(offCtx, text, startX, offH / 2, spacing, strokeW);

    stones = sampleStones(offCtx, offW, offH, padding, padding, stoneGap, stoneRadius);

    const cw = textW + padding * 2;
    const ch = textH + padding * 2;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    logicalW = cw;
    logicalH = ch;
    canvas.width = cw * dpr;
    canvas.height = ch * dpr;
    canvas.style.width = `${cw}px`;
    canvas.style.height = `${ch}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    sparkles.length = 0;
    for (let i = 0; i < 10; i++) {
      const s = stones[Math.floor(Math.random() * stones.length)];
      if (s) sparkles.push({ ...s, life: Math.random(), speed: 0.02 + Math.random() * 0.03 });
    }
  }

  function frame() {
    if (cancelled) return;
    raf = requestAnimationFrame(frame);

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, logicalW, logicalH);

    for (const s of stones) drawStone(s.x, s.y, s.r);

    for (const sp of sparkles) {
      sp.life += sp.speed;
      if (sp.life > 1) {
        sp.life = 0;
        const pick = stones[Math.floor(Math.random() * stones.length)];
        if (pick) {
          sp.x = pick.x;
          sp.y = pick.y;
        }
      }
      const alpha = Math.sin(sp.life * Math.PI);
      drawStar(sp.x, sp.y, 4 + alpha * 3, alpha * 0.75);
    }
  }

  async function init() {
    try {
      const fs = pickFontSize(container.clientWidth || 600);
      await document.fonts.load(`${fs}px ${fontFamily}`);
    } catch {
      await document.fonts.ready;
    }
    if (cancelled) return;
    layout();
    cancelAnimationFrame(raf);
    frame();
  }

  const ro = new ResizeObserver(() => {
    layout();
  });
  ro.observe(container);
  init();

  return () => {
    cancelled = true;
    cancelAnimationFrame(raf);
    ro.disconnect();
    container.innerHTML = '';
  };
}
