const greetings = [
  'Hello, World.',
  'Ahlan, Web.',
  'Bonjour, Browser.',
  'Hola, Internet.',
  'Salaam, Server.'
];

const title = document.querySelector('#pageTitle');
const consoleGreeting = document.querySelector('#consoleGreeting');
const remixButton = document.querySelector('#remixGreeting');

let greetingIndex = 0;

remixButton?.addEventListener('click', () => {
  greetingIndex = (greetingIndex + 1) % greetings.length;
  title.textContent = greetings[greetingIndex];
  consoleGreeting.textContent = greetings[greetingIndex];
});

const canvas = document.querySelector('#signalCanvas');
const context = canvas?.getContext('2d');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const palette = ['#0f9f8f', '#f05f4d', '#d99b18', '#5f5ad8'];
const nodes = [];
const nodeCount = 52;
let animationFrameId;

function resizeCanvas() {
  if (!canvas || !context) return;

  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(window.innerWidth * pixelRatio);
  canvas.height = Math.floor(window.innerHeight * pixelRatio);
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
}

function resetNodes() {
  nodes.length = 0;

  for (let index = 0; index < nodeCount; index += 1) {
    nodes.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: 3 + Math.random() * 7,
      speed: 0.16 + Math.random() * 0.42,
      color: palette[index % palette.length],
      phase: Math.random() * Math.PI * 2
    });
  }
}

function drawFrame(time = 0) {
  if (!canvas || !context) return;

  context.clearRect(0, 0, window.innerWidth, window.innerHeight);

  nodes.forEach((node, index) => {
    const drift = prefersReducedMotion ? 0 : Math.sin(time * 0.001 + node.phase) * 12;
    const x = node.x + drift;
    const y = node.y;

    context.globalAlpha = 0.2;
    context.fillStyle = node.color;
    context.fillRect(x, y, node.size, node.size);

    for (let nextIndex = index + 1; nextIndex < nodes.length; nextIndex += 1) {
      const next = nodes[nextIndex];
      const distance = Math.hypot(next.x - node.x, next.y - node.y);

      if (distance < 150) {
        context.globalAlpha = 0.05 * (1 - distance / 150);
        context.strokeStyle = node.color;
        context.beginPath();
        context.moveTo(x + node.size / 2, y + node.size / 2);
        context.lineTo(next.x + next.size / 2, next.y + next.size / 2);
        context.stroke();
      }
    }

    if (!prefersReducedMotion) {
      node.y += node.speed;

      if (node.y > window.innerHeight + 20) {
        node.y = -20;
        node.x = Math.random() * window.innerWidth;
      }
    }
  });

  context.globalAlpha = 1;

  if (!prefersReducedMotion) {
    animationFrameId = requestAnimationFrame(drawFrame);
  }
}

if (canvas && context) {
  resizeCanvas();
  resetNodes();
  drawFrame();

  window.addEventListener('resize', () => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }

    resizeCanvas();
    resetNodes();
    drawFrame();
  });
}
