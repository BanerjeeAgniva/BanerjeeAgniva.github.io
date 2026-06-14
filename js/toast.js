/**
 * toast.js — the small pop-up notification at the bottom of the screen, plus
 * the "copy email" button that uses it.
 *
 * `showToast` is exported so other modules can reuse it, and is also attached to
 * `window` so the word game can call it without importing (it falls back to its
 * own inline message if the global isn't present).
 */
let toastTimer;

export function showToast(msg, ms = 2200) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), ms);
}

// expose for other modules (e.g. the word game)
window.showToast = showToast;

export function initCopyEmail() {
  const copyEmailBtn = document.getElementById('copyEmailBtn');

  copyEmailBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText('coolagniva12@gmail.com').then(() => {
      showToast('Email copied to clipboard ✓');
    });
  });
}
