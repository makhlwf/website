/**
 * Makhlwf - Portfolio & Landing Page
 * Interactive terminal, Arabic audio test demo, and animated background canvas.
 */

// ==========================================================================
// 1. Interactive Terminal Commands
// ==========================================================================
const terminalScreen = document.querySelector('#terminalScreen');
const termButtons = document.querySelectorAll('.term-btn');

const terminalCommands = {
  about: {
    cmd: 'makhlwf --about',
    output: `
<span class="accent">[About]</span> Makhlwf — Developer from Libya 🇱🇾
<span class="muted">Summary:</span> Knowledge in IT, Computer Science, AI, and Python.
<span class="muted">Focus:</span> Helping companies integrate AI into their workflows to maximize efficiency.
<span class="muted">Open Source:</span> Improving accessibility (a11y) & adding Arabic localization (l10n).`
  },
  projects: {
    cmd: 'makhlwf --projects',
    output: `
<span class="accent">[Projects]</span>
1. <span class="term-command">exPlayer (accessible_youtube_downloader_pro)</span>
   GitHub: <a href="https://github.com/makhlwf/accessible_youtube_downloader_pro" target="_blank" style="color:#5eead4;text-decoration:underline;">github.com/makhlwf/accessible_youtube_downloader_pro</a>
   Accessible YouTube browser & downloader designed for screen-reader (NVDA) users.
2. <span class="term-command">Arabic Text-To-Speech (TTS)</span>
   Exploring natural Arabic speech synthesis.
3. <span class="term-command">Kotlin & Flutter App Experiments</span>
4. <span class="term-command">Open Source a11y & Arabic localization</span>`
  },
  learning: {
    cmd: 'makhlwf --learning',
    output: `
<span class="accent">[Currently Learning & Exploring]</span>
• <span class="term-command">Kotlin & Flutter:</span> Building clean, cross-platform mobile apps.
• <span class="term-command">Arabic Speech Synthesis:</span> Working on better Arabic Text-To-Speech models.
• <span class="term-command">Assistive Tech:</span> Making digital tools accessible for screen reader users.`
  }
};

function runTerminalCommand(cmdKey) {
  if (!terminalScreen) return;

  if (cmdKey === 'clear') {
    terminalScreen.innerHTML = `
<pre><code><span class="muted">// Screen cleared. Click a quick command below:</span>
<span class="muted">$</span> <span class="accent" id="consoleDynamicOutput">Ready...</span><span class="cursor" aria-hidden="true">_</span></code></pre>`;
    return;
  }

  const item = terminalCommands[cmdKey];
  if (!item) return;

  const commandBlock = document.createElement('div');
  commandBlock.style.marginTop = '10px';
  commandBlock.innerHTML = `
<pre><code><span class="muted">$</span> <span class="term-command">${item.cmd}</span>
${item.output}
</code></pre>`;

  terminalScreen.appendChild(commandBlock);
  terminalScreen.scrollTop = terminalScreen.scrollHeight;
}

termButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const cmd = btn.getAttribute('data-cmd');
    if (cmd) runTerminalCommand(cmd);
  });
});


// ==========================================================================
// 2. Arabic Web Speech Text-to-Speech (TTS) Demo
// ==========================================================================
const phraseSelect = document.querySelector('#arabicPhrases');
const phraseDisplay = document.querySelector('#phraseDisplay');
const btnSpeakArabic = document.querySelector('#btnSpeakArabic');
const btnStopArabic = document.querySelector('#btnStopArabic');
const ttsStatusMessage = document.querySelector('#ttsStatusMessage');

if (phraseSelect && phraseDisplay) {
  phraseSelect.addEventListener('change', () => {
    phraseDisplay.textContent = phraseSelect.value;
    if (ttsStatusMessage) {
      ttsStatusMessage.textContent = 'Selected phrase updated. Click Speak to test.';
    }
  });
}

if ('speechSynthesis' in window) {
  let currentUtterance = null;

  btnSpeakArabic?.addEventListener('click', () => {
    window.speechSynthesis.cancel();

    const textToSpeak = phraseDisplay ? phraseDisplay.textContent.trim() : phraseSelect?.value;
    if (!textToSpeak) return;

    currentUtterance = new SpeechSynthesisUtterance(textToSpeak);
    currentUtterance.lang = 'ar-SA';
    currentUtterance.rate = 0.95;

    const voices = window.speechSynthesis.getVoices();
    const arabicVoice = voices.find((v) => v.lang.startsWith('ar') || v.lang.includes('AR'));
    if (arabicVoice) {
      currentUtterance.voice = arabicVoice;
    }

    currentUtterance.onstart = () => {
      if (ttsStatusMessage) {
        ttsStatusMessage.textContent = '🔊 Playing Arabic audio preview...';
        ttsStatusMessage.style.color = '#0f9f8f';
      }
    };

    currentUtterance.onend = () => {
      if (ttsStatusMessage) {
        ttsStatusMessage.textContent = '✓ Finished playing.';
        ttsStatusMessage.style.color = 'inherit';
      }
    };

    currentUtterance.onerror = () => {
      if (ttsStatusMessage) {
        ttsStatusMessage.textContent = 'Audio test finished.';
        ttsStatusMessage.style.color = 'inherit';
      }
    };

    window.speechSynthesis.speak(currentUtterance);
  });

  btnStopArabic?.addEventListener('click', () => {
    window.speechSynthesis.cancel();
    if (ttsStatusMessage) {
      ttsStatusMessage.textContent = 'Playback stopped.';
      ttsStatusMessage.style.color = 'inherit';
    }
  });
} else {
  if (ttsStatusMessage) {
    ttsStatusMessage.textContent = 'Web Speech API is not supported in this browser.';
  }
}


// ==========================================================================
// 3. Animated Background Signal Canvas
// ==========================================================================
const canvas = document.querySelector('#signalCanvas');
const context = canvas?.getContext('2d');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const palette = ['#0f9f8f', '#f05f4d', '#d99b18', '#5f5ad8'];
const nodes = [];
let animationFrameId;

function getNodeCount() {
  if (window.innerWidth <= 300) return 0;
  if (prefersReducedMotion) return 18;
  if (window.innerWidth >= 1600) return 55;
  if (window.innerWidth >= 900) return 40;
  return 24;
}

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
  const nodeCount = getNodeCount();

  for (let index = 0; index < nodeCount; index += 1) {
    nodes.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: 3 + Math.random() * 6,
      speed: 0.14 + Math.random() * 0.35,
      color: palette[index % palette.length],
      phase: Math.random() * Math.PI * 2
    });
  }
}

function drawFrame(time = 0) {
  if (!canvas || !context) return;

  context.clearRect(0, 0, window.innerWidth, window.innerHeight);
  if (nodes.length === 0) return;

  nodes.forEach((node, index) => {
    const drift = prefersReducedMotion ? 0 : Math.sin(time * 0.001 + node.phase) * 10;
    const x = node.x + drift;
    const y = node.y;

    context.globalAlpha = 0.16;
    context.fillStyle = node.color;
    context.fillRect(x, y, node.size, node.size);

    for (let nextIndex = index + 1; nextIndex < nodes.length; nextIndex += 1) {
      const next = nodes[nextIndex];
      const distance = Math.hypot(next.x - node.x, next.y - node.y);

      if (distance < 140) {
        context.globalAlpha = 0.04 * (1 - distance / 140);
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


