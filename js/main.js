/**
 * main.js — the entry point. This is where the page starts executing.
 *
 * Loaded from index.html as <script type="module" src="js/main.js">. Being a
 * module, it's deferred automatically, so the HTML is fully parsed before any of
 * this runs — every init function can safely assume its DOM elements exist.
 *
 * Each feature lives in its own module and exposes a single init function. This
 * file just imports them and calls them in order; nothing here contains feature
 * logic itself, so you can read it as a table of contents for the site.
 */
import { initTheme }        from './theme.js';
import { initNavigation }   from './navigation.js';
import { initScrollReveal } from './scrollReveal.js';
import { initCopyEmail }    from './toast.js';
import { initWordGame }     from './wordGame.js';
import { initBackground }   from './background.js';

initTheme();          // light/dark toggle (+ Spotify embed sync)
initNavigation();     // hamburger menu, navbar shadow, active link, progress bar
initScrollReveal();   // fade-in elements as they enter the viewport
initCopyEmail();      // "copy email" button + toast notifications
initWordGame();       // the vocabulary Wordle
initBackground();     // animated canvas behind the page
