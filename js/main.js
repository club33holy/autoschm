/**
 * AUTO SCHEM - Main Interactive Logic (Minecraft Edition)
 * Fabric 1.21.11 + Fabric API + Baritone
 */

// Sound FX Synthesizer
class CyberAudio {
  constructor() {
    this.enabled = localStorage.getItem('autoschem_sound') !== 'false';
    this.ctx = null;
  }

  init() {
    if (!this.ctx && typeof window.AudioContext !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
  }

  playBlip(freq = 520, duration = 0.06, type = 'sine') {
    if (!this.enabled) return;
    try {
      this.init();
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, this.ctx.currentTime + duration);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      // Audio context policy
    }
  }

  playSuccess() {
    if (!this.enabled) return;
    this.playBlip(440, 0.08);
    setTimeout(() => this.playBlip(880, 0.12), 60);
  }

  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem('autoschem_sound', this.enabled);
    return this.enabled;
  }
}

const audio = new CyberAudio();

// Toast Notification Manager
function showToast(text, icon = '🛡️') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span>${icon}</span> <span>${text}</span>`;
  container.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('show'));
  audio.playSuccess();

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

// Copy to Clipboard
function copyTextToClipboard(text, successMessage = 'Copied to clipboard!') {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showToast(successMessage, '📋');
    });
  } else {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
    showToast(successMessage, '📋');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Mobile Hamburger Toggle
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const navLinks = document.querySelector('.nav-links');
  if (hamburgerBtn && navLinks) {
    hamburgerBtn.addEventListener('click', () => {
      navLinks.classList.toggle('mobile-open');
      audio.playBlip(600, 0.05);
    });
  }

  // Smooth scroll
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        if (navLinks.classList.contains('mobile-open')) {
          navLinks.classList.remove('mobile-open');
        }
        const offset = 80;
        const targetPos = targetEl.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({
          top: targetPos,
          behavior: 'smooth'
        });
        audio.playBlip(500, 0.05);
      }
    });
  });

  // Sound Toggle
  const soundToggleBtn = document.getElementById('soundToggleBtn');
  if (soundToggleBtn) {
    const updateSoundIcon = (enabled) => {
      soundToggleBtn.innerHTML = enabled
        ? `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>`;
      soundToggleBtn.title = enabled ? 'Mute sound effects' : 'Enable sound effects';
    };
    updateSoundIcon(audio.enabled);

    soundToggleBtn.addEventListener('click', () => {
      const newState = audio.toggle();
      updateSoundIcon(newState);
      showToast(newState ? 'Sound effects enabled' : 'Sound effects muted', newState ? '🔊' : '🔇');
    });
  }

  // Download Trigger Handler
  const downloadBtns = document.querySelectorAll('.btn-download-action');
  const dlModal = document.getElementById('downloadSuccessModal');
  const dlModalClose = document.getElementById('dlModalCloseBtn');

  downloadBtns.forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      const filename = this.dataset.filename || 'AutoSchem-Fabric-1.21.11-v1.4.2.jar';
      const targetFilenameEl = document.getElementById('dlModalFilename');
      if (targetFilenameEl) targetFilenameEl.textContent = filename;

      if (dlModal) {
        dlModal.classList.add('active');
      }
      showToast(`Downloading clean: ${filename}`, '⬇️');
      audio.playSuccess();
    });
  });

  if (dlModalClose && dlModal) {
    dlModalClose.addEventListener('click', () => {
      dlModal.classList.remove('active');
      audio.playBlip(400, 0.04);
    });
    dlModal.addEventListener('click', (e) => {
      if (e.target === dlModal) {
        dlModal.classList.remove('active');
      }
    });
  }

  // Documentation Sidebar Navigation
  const docNavBtns = document.querySelectorAll('.docs-nav-btn');
  const docArticles = document.querySelectorAll('.doc-article');

  docNavBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      docNavBtns.forEach(b => b.classList.remove('active'));
      docArticles.forEach(a => a.classList.remove('active'));

      this.classList.add('active');
      const targetDocId = this.dataset.doc;
      const targetArticle = document.getElementById(targetDocId);
      if (targetArticle) {
        targetArticle.classList.add('active');
      }
      audio.playBlip(550, 0.04);
    });
  });

  // Copy Buttons
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const code = this.dataset.copyText;
      if (code) {
        copyTextToClipboard(code, `Copied: ${code}`);
      }
    });
  });

  // Copy Slug
  const copySlugBtn = document.getElementById('copySlugBtn');
  if (copySlugBtn) {
    copySlugBtn.addEventListener('click', () => {
      copyTextToClipboard('autoschem', 'Copied mod identifier: "autoschem"');
    });
  }

  // FAQ Accordion
  const faqQuestions = document.querySelectorAll('.faq-question');
  faqQuestions.forEach(btn => {
    btn.addEventListener('click', function() {
      const parentItem = this.parentElement;
      const isOpen = parentItem.classList.contains('open');

      document.querySelectorAll('.faq-item').forEach(item => item.classList.remove('open'));

      if (!isOpen) {
        parentItem.classList.add('open');
        audio.playBlip(620, 0.04);
      } else {
        audio.playBlip(480, 0.04);
      }
    });
  });

  // Copy SHA Hash
  const copyShaBtn = document.getElementById('copyShaBtn');
  if (copyShaBtn) {
    copyShaBtn.addEventListener('click', () => {
      const shaText = document.getElementById('dlModalSha')?.textContent || '';
      copyTextToClipboard(shaText, 'Copied SHA-256 Checksum!');
    });
  }
});
