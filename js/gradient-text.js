/**
 * Vanilla port of React Bits GradientText
 * https://reactbits.dev/text-animations/gradient-text
 */
export function initGradientText(container, text, opts = {}) {
  const {
    colors = ['#5227FF', '#FF9FFC', '#B497CF'],
    animationSpeed = 8,
    showBorder = false,
    className = '',
    tagName = 'p',
    innerClassName = '',
  } = opts;

  const gradientColors = [...colors, colors[0]].join(', ');
  const classes = ['gradient-text', className, showBorder ? 'with-border' : '']
    .filter(Boolean)
    .join(' ');

  container.innerHTML = '';

  const wrap = document.createElement(tagName);
  wrap.className = classes;

  const inner = document.createElement('span');
  inner.className = ['gradient-text-inner', innerClassName].filter(Boolean).join(' ');
  inner.textContent = text;
  inner.style.backgroundImage = `linear-gradient(to right, ${gradientColors})`;
  inner.style.backgroundSize = '300% 100%';
  inner.style.animationDuration = `${animationSpeed}s`;

  wrap.appendChild(inner);
  container.appendChild(wrap);

  return () => {
    container.innerHTML = '';
  };
}
