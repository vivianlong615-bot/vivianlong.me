/**
 * Handwritten cursive text with animated sparkle glints (canvas)
 */
export function initSparkleText(container, text, opts = {}) {
  const {
    fontFamily = '"Great Vibes", cursive',
    fontSize = 26,
    letterSpacing = 8,
    color = '#ffffff',
    bgColor = '#000000',
    sparkleCount = 14,
  } = opts;

  const canvas = document.createElement('canvas');
  canvas.style.display = 'block';
  canvas.style.maxWidth = '100%';
  container.innerHTML = '';
  container.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  let raf = 0;
  let cancelled = false;
  let logicalW = 0;
  let logicalH = 0;
  let sparkles = [];
  let anchorPoints = [];

  function measureSpacedText(c, str, spacing) {
    const chars = [...str];
    let w = 0;
    chars.forEach((ch, i) => {
      w += c.measureText(ch).width;
      if (i < chars.length - 1) w += spacing;
    });
    return w;
  }

  function fillSpacedText(c, str, startX, y, spacing) {
    c.textAlign = 'left';
    c.textBaseline = 'middle';
    let x = startX;
    const chars = [...str];
    chars.forEach((ch, i) => {
      c.fillText(ch, x, y);
      x += c.measureText(ch).width + (i < chars.length - 1 ? spacing : 0);
    });
  }

  function sampleAnchors(offCtx, offW, offH, padX, padY) {
    const data = offCtx.getImageData(0, 0, offW, offH).data;
    const pts = [];
    for (let y = 0; y < offH; y += 3) {
      for (let x = 0; x < offW; x += 3) {
        const i = (y * offW + x) * 4;
        if (data[i + 3] > 100) pts.push({ x: padX + x, y: padY + y });
      }
    }
    return pts;
  }

  function drawStar(x, y, size, alpha) {
    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.1;
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
    const pad = 8;
    const font = `${fontSize}px ${fontFamily}`;

    const measure = document.createElement('canvas').getContext('2d');
    measure.font = font;
    const textW = Math.ceil(measureSpacedText(measure, text, letterSpacing));
    const textH = Math.ceil(fontSize * 1.2);

    const offW = textW + 16;
    const offH = textH + 16;
    const off = document.createElement('canvas');
    off.width = offW;
    off.height = offH;
    const offCtx = off.getContext('2d');
    offCtx.font = font;
    offCtx.fillStyle = '#fff';
    offCtx.textBaseline = 'middle';
    fillSpacedText(offCtx, text, (offW - textW) / 2, offH / 2, letterSpacing);

    anchorPoints = sampleAnchors(offCtx, offW, offH, pad, pad);

    logicalW = textW + pad * 2;
    logicalH = textH + pad * 2;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = logicalW * dpr;
    canvas.height = logicalH * dpr;
    canvas.style.width = `${logicalW}px`;
    canvas.style.height = `${logicalH}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    sparkles = [];
    for (let i = 0; i < sparkleCount; i++) {
      const pt = anchorPoints[Math.floor(Math.random() * anchorPoints.length)];
      if (pt) {
        sparkles.push({
          x: pt.x,
          y: pt.y,
          life: Math.random(),
          speed: 0.018 + Math.random() * 0.028,
        });
      }
    }
  }

  function drawText() {
    const font = `${fontSize}px ${fontFamily}`;
    ctx.font = font;
    ctx.textBaseline = 'middle';
    const textW = measureSpacedText(ctx, text, letterSpacing);
    const startX = (logicalW - textW) / 2;
    const y = logicalH / 2;

    ctx.shadowColor = 'rgba(255,255,255,0.3)';
    ctx.shadowBlur = 5;
    ctx.fillStyle = color;
    fillSpacedText(ctx, text, startX, y, letterSpacing);

    ctx.shadowBlur = 0;
    ctx.fillStyle = color;
    fillSpacedText(ctx, text, startX, y, letterSpacing);
  }

  function frame() {
    if (cancelled) return;
    raf = requestAnimationFrame(frame);

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, logicalW, logicalH);
    drawText();

    for (const sp of sparkles) {
      sp.life += sp.speed;
      if (sp.life > 1) {
        sp.life = 0;
        const pt = anchorPoints[Math.floor(Math.random() * anchorPoints.length)];
        if (pt) {
          sp.x = pt.x;
          sp.y = pt.y;
        }
      }
      const alpha = Math.sin(sp.life * Math.PI);
      drawStar(sp.x, sp.y, 3.5 + alpha * 3, alpha * 0.9);
    }
  }

  async function init() {
    try {
      await document.fonts.load(`${fontSize}px ${fontFamily}`);
    } catch {
      await document.fonts.ready;
    }
    if (cancelled) return;
    layout();
    cancelAnimationFrame(raf);
    frame();
  }

  const ro = new ResizeObserver(() => layout());
  ro.observe(container);
  init();

  return () => {
    cancelled = true;
    cancelAnimationFrame(raf);
    ro.disconnect();
    container.innerHTML = '';
  };
}
