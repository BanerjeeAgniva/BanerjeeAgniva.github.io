/* ─── Theme Toggle ─── */
const html          = document.documentElement;
const themeToggle   = document.getElementById('themeToggle');
const STORAGE_KEY   = 'portfolio-theme';

function applyTheme(theme) {
  html.setAttribute('data-theme', theme);
  localStorage.setItem(STORAGE_KEY, theme);
}

// Init: honour saved preference, else default to dark
const saved = localStorage.getItem(STORAGE_KEY);
applyTheme(saved || 'dark');

themeToggle.addEventListener('click', () => {
  const current = html.getAttribute('data-theme');
  applyTheme(current === 'dark' ? 'light' : 'dark');
});

/* ─── Hamburger / Mobile Menu ─── */
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('navLinks');

hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  navLinks.classList.toggle('open');
});

// Close menu on nav-link click
navLinks.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('open');
    navLinks.classList.remove('open');
  });
});

/* ─── Navbar Scroll Shadow ─── */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.style.boxShadow = window.scrollY > 10
    ? '0 2px 24px rgba(0,0,0,0.18)'
    : 'none';
}, { passive: true });

/* ─── Reveal on Scroll (Intersection Observer) ─── */
const reveals = document.querySelectorAll('.reveal');

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        // Staggered delay for grouped elements
        const delay = Array.from(entry.target.parentElement.children)
          .indexOf(entry.target) * 80;
        setTimeout(() => entry.target.classList.add('visible'), delay);
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);

reveals.forEach(el => observer.observe(el));

/* ─── Active nav link highlight on scroll ─── */
const sections = document.querySelectorAll('section[id]');
const navItems = document.querySelectorAll('.nav-link');

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navItems.forEach(link => link.classList.remove('active'));
        const active = document.querySelector(`.nav-link[href="#${entry.target.id}"]`);
        if (active) active.classList.add('active');
      }
    });
  },
  { rootMargin: '-40% 0px -55% 0px' }
);

sections.forEach(s => sectionObserver.observe(s));

// Add active style via CSS
const style = document.createElement('style');
style.textContent = `.nav-link.active { color: var(--accent) !important; background: var(--accent-glow) !important; }`;
document.head.appendChild(style);
