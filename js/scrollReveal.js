/**
 * scrollReveal.js — fades elements in as they scroll into view.
 *
 * Any element with the `.reveal` class starts hidden (via CSS) and gets the
 * `.visible` class the first time it enters the viewport. Items that share a
 * parent are staggered slightly so groups cascade in instead of popping at once.
 */
export function initScrollReveal() {
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
}
