/**
 * Makhlwf - Portfolio & Landing Page
 * Interactive terminal, Arabic TTS voice demo, copy utilities, and animated canvas background.
 */

// ==========================================================================
// 1. Interactive Terminal Commands
// ==========================================================================
const terminalScreen = document.querySelector('#terminalScreen');
const consoleDynamicOutput = document.querySelector('#consoleDynamicOutput');
const termButtons = document.querySelectorAll('.term-btn');

const terminalCommands = {
  about: {
    cmd: 'makhlwf --about',
    output: `
<span class="accent">[Profile]</span> Makhlwf — Software Developer & IT Engineer from Libya 🇱🇾
<span class="muted">Summary:</span> Strong foundation in IT, Computer Science, and AI.
<span class="muted">Mission:</span> Helping organizations streamline operations with custom AI workflows, 
         while engineering universally accessible software and Arabic voice technology.
<span class="muted">Current:</span> Building apps with Kotlin & Flutter, researching Arabic TTS.`
  },
  skills: {
    cmd: 'makhlwf --skills',
    output: `
<span class="accent">[Technical Stack]</span>
• <span class="term-command">Languages:</span> Python (Advanced), Kotlin, Dart/Flutter, JavaScript, Node.js, Shell
• <span class="term-command">AI & ML:</span> AI Workflow Integration, LLM Orchestration, Arabic TTS Voice Synthesis
• <span class="term-command">Domains:</span> WCAG Accessibility (a11y), Arabic Localization (l10n & RTL), IT Infrastructure
• <span class="term-command">Tooling:</span> Git/GitHub, Linux/Windows, REST APIs, PyQt, FFmpeg`
  },
  projects: {
    cmd: 'makhlwf --projects',
    output: `
<span class="accent">[Featured Projects]</span>
1. <span class="term-command">exPlayer (Accessible YouTube Downloader Pro)</span>
   GitHub: <a href="https://github.com/makhlwf/accessible_youtube_downloader_pro" target="_blank" style="color:#5eead4;text-decoration:underline;">github.com/makhlwf/accessible_youtube_downloader_pro</a>
   Built for full assistive-tech & screen reader accessibility.
2. <span class="term-command">Arabic Text-To-Speech (TTS) Engine</span> [Research]
   Neural voice synthesis with Arabic diacritization support.
3. <span class="term-command">Cross-Platform Apps</span> (Flutter & Kotlin)
4. <span class="term-command">Open Source a11y & Arabic l10n</span> Contributions`
  },
  ai: {
    cmd: 'makhlwf --ai-help',
    output: `
<span class="accent">[AI Integration & Consulting]</span>
How I help businesses:
• Audit existing manual workflows and identify automation opportunities.
• Integrate LLMs & custom AI pipelines into existing internal software.
• Maximize operational efficiency and output quality.
• Ensure data accuracy and clean user interfaces for team adoption.`
  },
  arabic: {
    cmd: 'makhlwf --arabic-tts',
    output: `
<span class="accent">[Arabic Voice Tech & Localization]</span>
• Passionate about building high-fidelity Arabic speech synthesis (TTS).
• Helping Arabic assistive technology users experience natural digital voices.
• Contributing Right-to-Left (RTL) fixes & translations to open source.`
  }
};

function runTerminalCommand(cmdKey) {
  if (!terminalScreen) return;

  if (cmdKey === 'clear') {
    terminalScreen.innerHTML = `
<pre><code><span class="muted">// Screen cleared. Click a quick command below:</span>
<span class="muted">$</span> <span class="accent" id="consoleDynamicOutput">Ready for next command...</span><span class="cursor" aria-hidden="true">_</span></code></pre>`;
    return;
  }

  const item = terminalCommands[cmdKey];
  if (!item) return;

  const commandBlock = document.createElement('div');
  commandBlock.style.marginTop = '12px';
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
      ttsStatusMessage.textContent = 'Selected phrase updated. Click Speak to preview.';
    }
  });
}

if ('speechSynthesis' in window) {
  let currentUtterance = null;

  btnSpeakArabic?.addEventListener('click', () => {
    window.speechSynthesis.cancel(); // Stop any ongoing speech

    const textToSpeak = phraseDisplay ? phraseDisplay.textContent.trim() : phraseSelect?.value;
    if (!textToSpeak) return;

    currentUtterance = new SpeechSynthesisUtterance(textToSpeak);
    currentUtterance.lang = 'ar-SA';
    currentUtterance.rate = 0.95; // Natural pace

    // Try to locate native Arabic voice
    const voices = window.speechSynthesis.getVoices();
    const arabicVoice = voices.find((v) => v.lang.startsWith('ar') || v.lang.includes('AR'));
    if (arabicVoice) {
      currentUtterance.voice = arabicVoice;
    }

    currentUtterance.onstart = () => {
      if (ttsStatusMessage) {
        ttsStatusMessage.textContent = '🔊 Speaking Arabic audio preview...';
        ttsStatusMessage.style.color = '#0f9f8f';
      }
    };

    currentUtterance.onend = () => {
      if (ttsStatusMessage) {
        ttsStatusMessage.textContent = '✓ Finished speaking.';
        ttsStatusMessage.style.color = 'inherit';
      }
    };

    currentUtterance.onerror = (e) => {
      if (ttsStatusMessage) {
        ttsStatusMessage.textContent = 'Audio synthesis completed.';
        ttsStatusMessage.style.color = 'inherit';
      }
    };

    window.speechSynthesis.speak(currentUtterance);
  });

  btnStopArabic?.addEventListener('click', () => {
    window.speechSynthesis.cancel();
    if (ttsStatusMessage) {
      ttsStatusMessage.textContent = 'Speech playback stopped.';
      ttsStatusMessage.style.color = 'inherit';
    }
  });

  // Pre-load voices
  window.speechSynthesis.onvoiceschanged = () => {
    // Voices cache primed
  };
} else {
  if (ttsStatusMessage) {
    ttsStatusMessage.textContent = 'Web Speech API is not supported in this browser.';
  }
}


// ==========================================================================
// 3. Copy Contact Details Helper
// ==========================================================================
const btnCopyEmail = document.querySelector('#btnCopyEmail');
const copyEmailText = document.querySelector('#copyEmailText');

btnCopyEmail?.addEventListener('click', async () => {
  const contactInfo = `Makhlwf - Software Developer & AI Integrator\nGitHub: https://github.com/makhlwf\nWebsite: https://makhlwf.duckdns.org`;

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(contactInfo);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = contactInfo;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }

    if (copyEmailText) {
      const originalText = copyEmailText.textContent;
      copyEmailText.textContent = '✓ Details Copied!';
      btnCopyEmail.style.background = '#0f9f8f';
      btnCopyEmail.style.color = '#ffffff';

      setTimeout(() => {
        copyEmailText.textContent = originalText;
        btnCopyEmail.style.background = '';
        btnCopyEmail.style.color = '';
      }, 2500);
    }
  } catch (err) {
    if (copyEmailText) {
      copyEmailText.textContent = 'Visit github.com/makhlwf';
    }
  }
});


// ==========================================================================
// 4. Animated Background Signal Canvas
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
  if (window.innerWidth >= 1600) return 60;
  if (window.innerWidth >= 900) return 44;
  return 28;
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

    context.globalAlpha = 0.18;
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

