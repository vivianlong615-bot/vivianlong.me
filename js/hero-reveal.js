/**
 * Hero scratch-reveal mask — mouse/touch erases solid layer to show photo beneath.
 */
const BRUSH_RADIUS = 90;
const BRUSH_RADIUS_TOUCH = 108;

export function initHeroReveal(heroEl) {
  const canvas = document.getElementById('hero-scratch-mask');
  if (!heroEl || !canvas) return null;

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return null;

  let width = 0;
  let height = 0;
  let dpr = 1;
  let lastX = null;
  let lastY = null;
  let destroyed = false;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function resize() {
    const rect = heroEl.getBoundingClientRect();
    width = Math.max(1, Math.floor(rect.width));
    height = Math.max(1, Math.floor(rect.height));
    dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    fillMask();
    lastX = null;
    lastY = null;
  }

  function fillMask() {
    ctx.globalCompositeOperation = 'source-over';
    if (reducedMotion) {
      ctx.clearRect(0, 0, width, height);
      return;
    }
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
  }

  function eraseDot(x, y, radius) {
    ctx.globalCompositeOperation = 'destination-out';
    const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
    g.addColorStop(0, 'rgba(0,0,0,1)');
    g.addColorStop(0.6, 'rgba(0,0,0,0.6)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  function eraseLine(x0, y0, x1, y1, radius) {
    const dist = Math.hypot(x1 - x0, y1 - y0);
    const steps = Math.max(1, Math.ceil(dist / (radius * 0.32)));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      eraseDot(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, radius);
    }
  }

  function eraseAtClient(clientX, clientY, radius) {
    if (destroyed || reducedMotion) return;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    if (x < -radius || y < -radius || x > width + radius || y > height + radius) return;

    if (lastX !== null && lastY !== null) {
      eraseLine(lastX, lastY, x, y, radius);
    } else {
      eraseDot(x, y, radius);
    }
    lastX = x;
    lastY = y;
  }

  function resetStroke() {
    lastX = null;
    lastY = null;
  }

  function onMouseMove(e) {
    eraseAtClient(e.clientX, e.clientY, BRUSH_RADIUS);
  }

  function onTouchMove(e) {
    if (!e.touches.length) return;
    e.preventDefault();
    eraseAtClient(e.touches[0].clientX, e.touches[0].clientY, BRUSH_RADIUS_TOUCH);
  }

  function onTouchStart(e) {
    if (!e.touches.length) return;
    resetStroke();
    eraseAtClient(e.touches[0].clientX, e.touches[0].clientY, BRUSH_RADIUS_TOUCH);
  }

  resize();

  heroEl.addEventListener('mousemove', onMouseMove);
  heroEl.addEventListener('mouseleave', resetStroke);
  heroEl.addEventListener('touchstart', onTouchStart, { passive: false });
  heroEl.addEventListener('touchmove', onTouchMove, { passive: false });
  heroEl.addEventListener('touchend', resetStroke);

  const ro = new ResizeObserver(resize);
  ro.observe(heroEl);

  return () => {
    destroyed = true;
    ro.disconnect();
    heroEl.removeEventListener('mousemove', onMouseMove);
    heroEl.removeEventListener('mouseleave', resetStroke);
    heroEl.removeEventListener('touchstart', onTouchStart);
    heroEl.removeEventListener('touchmove', onTouchMove);
    heroEl.removeEventListener('touchend', resetStroke);
  };
}
