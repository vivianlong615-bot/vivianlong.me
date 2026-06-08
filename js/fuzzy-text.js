/**
 * Vanilla port of React Bits FuzzyText
 * https://reactbits.dev/backgrounds/fuzzy-text
 */
export function initFuzzyText(container, text, opts = {}) {
  const {
    fontSize = 'clamp(2rem, 8vw, 4.5rem)',
    fontWeight = 900,
    fontFamily = 'inherit',
    color = '#FAFAF8',
    enableHover = true,
    baseIntensity = 0.2,
    hoverIntensity = 0.5,
    fuzzRange = 30,
    fps = 60,
    direction = 'horizontal',
    transitionDuration = 0,
    clickEffect = false,
    letterSpacing = 0,
  } = opts;

  const canvas = document.createElement('canvas');
  canvas.style.display = 'block';
  canvas.style.maxWidth = '100%';
  canvas.style.height = 'auto';
  container.innerHTML = '';
  container.appendChild(canvas);

  let animationFrameId = 0;
  let isCancelled = false;
  let cleanupFn = null;

  const init = async () => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const computedFontFamily =
      fontFamily === 'inherit'
        ? window.getComputedStyle(container).fontFamily || 'sans-serif'
        : fontFamily;

    const fontSizeStr = typeof fontSize === 'number' ? `${fontSize}px` : fontSize;
    const fontString = `${fontWeight} ${fontSizeStr} ${computedFontFamily}`;

    try {
      await document.fonts.load(fontString);
    } catch {
      await document.fonts.ready;
    }
    if (isCancelled) return;

    let numericFontSize;
    if (typeof fontSize === 'number') {
      numericFontSize = fontSize;
    } else {
      const temp = document.createElement('span');
      temp.style.fontSize = fontSize;
      document.body.appendChild(temp);
      numericFontSize = parseFloat(window.getComputedStyle(temp).fontSize);
      document.body.removeChild(temp);
    }

    const offscreen = document.createElement('canvas');
    const offCtx = offscreen.getContext('2d');
    if (!offCtx) return;

    offCtx.font = `${fontWeight} ${fontSizeStr} ${computedFontFamily}`;
    offCtx.textBaseline = 'alphabetic';

    let totalWidth = 0;
    if (letterSpacing !== 0) {
      for (const char of text) {
        totalWidth += offCtx.measureText(char).width + letterSpacing;
      }
      totalWidth -= letterSpacing;
    } else {
      totalWidth = offCtx.measureText(text).width;
    }

    const metrics = offCtx.measureText(text);
    const actualLeft = metrics.actualBoundingBoxLeft ?? 0;
    const actualRight = letterSpacing !== 0 ? totalWidth : (metrics.actualBoundingBoxRight ?? metrics.width);
    const actualAscent = metrics.actualBoundingBoxAscent ?? numericFontSize;
    const actualDescent = metrics.actualBoundingBoxDescent ?? numericFontSize * 0.2;

    const textBoundingWidth = Math.ceil(letterSpacing !== 0 ? totalWidth : actualLeft + actualRight);
    const tightHeight = Math.ceil(actualAscent + actualDescent);

    const extraWidthBuffer = 10;
    const offscreenWidth = textBoundingWidth + extraWidthBuffer;

    offscreen.width = offscreenWidth;
    offscreen.height = tightHeight;

    const xOffset = extraWidthBuffer / 2;
    offCtx.font = `${fontWeight} ${fontSizeStr} ${computedFontFamily}`;
    offCtx.textBaseline = 'alphabetic';
    offCtx.fillStyle = color;

    if (letterSpacing !== 0) {
      let xPos = xOffset;
      for (const char of text) {
        offCtx.fillText(char, xPos, actualAscent);
        xPos += offCtx.measureText(char).width + letterSpacing;
      }
    } else {
      offCtx.fillText(text, xOffset - actualLeft, actualAscent);
    }

    const horizontalMargin = fuzzRange + 20;
    const verticalMargin = 0;
    canvas.width = offscreenWidth + horizontalMargin * 2;
    canvas.height = tightHeight + verticalMargin * 2;
    ctx.translate(horizontalMargin, verticalMargin);

    const interactiveLeft = horizontalMargin + xOffset;
    const interactiveTop = verticalMargin;
    const interactiveRight = interactiveLeft + textBoundingWidth;
    const interactiveBottom = interactiveTop + tightHeight;

    let isHovering = false;
    let isClicking = false;
    let currentIntensity = baseIntensity;
    let targetIntensity = baseIntensity;
    let lastFrameTime = 0;
    const frameDuration = 1000 / fps;
    let clickTimeoutId = 0;

    const run = timestamp => {
      if (isCancelled) return;

      if (timestamp - lastFrameTime < frameDuration) {
        animationFrameId = requestAnimationFrame(run);
        return;
      }
      lastFrameTime = timestamp;

      ctx.clearRect(
        -fuzzRange - 20,
        -fuzzRange - 10,
        offscreenWidth + 2 * (fuzzRange + 20),
        tightHeight + 2 * (fuzzRange + 10)
      );

      if (isClicking) {
        targetIntensity = 1;
      } else if (isHovering) {
        targetIntensity = hoverIntensity;
      } else {
        targetIntensity = baseIntensity;
      }

      if (transitionDuration > 0) {
        const step = 1 / (transitionDuration / frameDuration);
        if (currentIntensity < targetIntensity) {
          currentIntensity = Math.min(currentIntensity + step, targetIntensity);
        } else if (currentIntensity > targetIntensity) {
          currentIntensity = Math.max(currentIntensity - step, targetIntensity);
        }
      } else {
        currentIntensity = targetIntensity;
      }

      if (direction === 'horizontal') {
        for (let j = 0; j < tightHeight; j++) {
          const dx = Math.floor(currentIntensity * (Math.random() - 0.5) * fuzzRange);
          ctx.drawImage(offscreen, 0, j, offscreenWidth, 1, dx, j, offscreenWidth, 1);
        }
      } else if (direction === 'vertical') {
        for (let i = 0; i < offscreenWidth; i++) {
          const dy = Math.floor(currentIntensity * (Math.random() - 0.5) * fuzzRange);
          ctx.drawImage(offscreen, i, 0, 1, tightHeight, i, dy, 1, tightHeight);
        }
      }

      animationFrameId = requestAnimationFrame(run);
    };

    animationFrameId = requestAnimationFrame(run);

    const isInsideTextArea = (x, y) =>
      x >= interactiveLeft && x <= interactiveRight && y >= interactiveTop && y <= interactiveBottom;

    const handleMouseMove = e => {
      if (!enableHover) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;
      isHovering = isInsideTextArea(x, y);
    };

    const handleMouseLeave = () => { isHovering = false; };

    const handleClick = () => {
      if (!clickEffect) return;
      isClicking = true;
      clearTimeout(clickTimeoutId);
      clickTimeoutId = setTimeout(() => { isClicking = false; }, 150);
    };

    if (enableHover) {
      canvas.addEventListener('mousemove', handleMouseMove);
      canvas.addEventListener('mouseleave', handleMouseLeave);
    }
    if (clickEffect) canvas.addEventListener('click', handleClick);

    cleanupFn = () => {
      cancelAnimationFrame(animationFrameId);
      clearTimeout(clickTimeoutId);
      if (enableHover) {
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('mouseleave', handleMouseLeave);
      }
      if (clickEffect) canvas.removeEventListener('click', handleClick);
    };
  };

  init();

  return () => {
    isCancelled = true;
    cancelAnimationFrame(animationFrameId);
    cleanupFn?.();
    container.innerHTML = '';
  };
}
