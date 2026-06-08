/**
 * Vanilla port of react-bits ShinyText (gradient shine sweep on text).
 */
export function initShinyText(element, options = {}) {
  if (!element) return null;

  const {
    speed = 2,
    delay = 0,
    color = '#4E22A8',
    shineColor = '#ffffff',
    spread = 120,
    direction = 'left',
    yoyo = false,
    pauseOnHover = false,
    disabled = false,
  } = options;

  let elapsed = 0;
  let lastTime = null;
  let isPaused = false;
  let rafId = null;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isDisabled = disabled || reducedMotion;
  let destroyed = false;
  const directionMult = direction === 'left' ? 1 : -1;
  const animationDuration = speed * 1000;
  const delayDuration = delay * 1000;

  element.classList.add('shiny-text');
  element.style.backgroundImage = `linear-gradient(${spread}deg, ${color} 0%, ${color} 35%, ${shineColor} 50%, ${color} 65%, ${color} 100%)`;
  element.style.backgroundSize = '200% auto';
  element.style.webkitBackgroundClip = 'text';
  element.style.backgroundClip = 'text';
  element.style.webkitTextFillColor = 'transparent';
  element.style.color = 'transparent';

  function setProgress(p) {
    element.style.backgroundPosition = `${150 - p * 2}% center`;
  }

  if (isDisabled) {
    setProgress(0);
    return () => {
      element.classList.remove('shiny-text');
      element.removeAttribute('style');
    };
  }

  function onMouseEnter() {
    if (pauseOnHover) isPaused = true;
  }

  function onMouseLeave() {
    if (pauseOnHover) isPaused = false;
  }

  function tick(time) {
    if (destroyed) return;

    if (isDisabled || isPaused) {
      lastTime = null;
      rafId = requestAnimationFrame(tick);
      return;
    }

    if (lastTime === null) {
      lastTime = time;
      rafId = requestAnimationFrame(tick);
      return;
    }

    const delta = time - lastTime;
    lastTime = time;
    elapsed += delta;

    if (yoyo) {
      const cycleDuration = animationDuration + delayDuration;
      const fullCycle = cycleDuration * 2;
      const cycleTime = elapsed % fullCycle;

      if (cycleTime < animationDuration) {
        const p = (cycleTime / animationDuration) * 100;
        setProgress(directionMult === 1 ? p : 100 - p);
      } else if (cycleTime < cycleDuration) {
        setProgress(directionMult === 1 ? 100 : 0);
      } else if (cycleTime < cycleDuration + animationDuration) {
        const reverseTime = cycleTime - cycleDuration;
        const p = 100 - (reverseTime / animationDuration) * 100;
        setProgress(directionMult === 1 ? p : 100 - p);
      } else {
        setProgress(directionMult === 1 ? 0 : 100);
      }
    } else {
      const cycleDuration = animationDuration + delayDuration;
      const cycleTime = elapsed % cycleDuration;

      if (cycleTime < animationDuration) {
        const p = (cycleTime / animationDuration) * 100;
        setProgress(directionMult === 1 ? p : 100 - p);
      } else {
        setProgress(directionMult === 1 ? 100 : 0);
      }
    }

    rafId = requestAnimationFrame(tick);
  }

  if (pauseOnHover) {
    element.addEventListener('mouseenter', onMouseEnter);
    element.addEventListener('mouseleave', onMouseLeave);
  }

  rafId = requestAnimationFrame(tick);

  return () => {
    destroyed = true;
    if (rafId) cancelAnimationFrame(rafId);
    if (pauseOnHover) {
      element.removeEventListener('mouseenter', onMouseEnter);
      element.removeEventListener('mouseleave', onMouseLeave);
    }
    element.classList.remove('shiny-text');
    element.removeAttribute('style');
  };
}

export const HERO_INTRO_SHINY_OPTS = {
  speed: 2,
  delay: 0,
  color: '#4E22A8',
  shineColor: '#ffffff',
  spread: 120,
  direction: 'left',
  yoyo: false,
  pauseOnHover: false,
  disabled: false,
};
