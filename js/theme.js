/**
 * theme.js — light/dark theme toggle.
 *
 * Stores the choice in localStorage so it survives reloads, and keeps the
 * Spotify embed in sync (the embed has no native light mode, so we swap its
 * src instead). Defaults to dark on first visit.
 */
const STORAGE_KEY = 'portfolio-theme';

// Spotify embed has no native light mode: theme=0 is dark, omitting it is the
// lighter art-tinted variant. Swap it to match the site theme. Guard against
// reloading the iframe (which would interrupt playback) unless it truly changes.
let lastMusicTheme = 'dark'; // matches the theme=0 hardcoded in the HTML

function syncMusicTheme(theme) {
  if (theme === lastMusicTheme) return;
  const frame = document.getElementById('musicFrame');
  if (!frame) return;
  const base = 'https://open.spotify.com/embed/playlist/2ExObG1V7J2Ykda7eOg74T?utm_source=generator';
  frame.src = theme === 'light' ? base : base + '&theme=0';
  lastMusicTheme = theme;
}

function applyTheme(theme) {
  const html = document.documentElement;
  html.setAttribute('data-theme', theme);
  localStorage.setItem(STORAGE_KEY, theme);
  syncMusicTheme(theme);
}

export function initTheme() {
  const html        = document.documentElement;
  const themeToggle = document.getElementById('themeToggle');

  // Init: honour saved preference, else default to dark
  const saved = localStorage.getItem(STORAGE_KEY);
  applyTheme(saved || 'dark');

  themeToggle.addEventListener('click', () => {
    const current = html.getAttribute('data-theme');
    applyTheme(current === 'dark' ? 'light' : 'dark');
  });
}
