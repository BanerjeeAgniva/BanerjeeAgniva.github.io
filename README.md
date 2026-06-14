# Agniva Banerjee — Portfolio

My personal portfolio site, live at **https://banerjeeagniva.github.io/**.

It's a hand-built static site — plain HTML, CSS, and vanilla JavaScript with **no
build step and no frameworks**. The JavaScript is organised into small ES
modules. GitHub Pages serves the files exactly as they are in this repo.

---

## Project structure

```
.
├── index.html          # All the page markup (the single page)
├── styles.css          # All the styling + design tokens (light/dark themes)
├── js/                 # All behaviour, split into one module per feature
│   ├── main.js         # ► ENTRY POINT — imports the modules and starts them
│   ├── theme.js        # Light/dark toggle (+ Spotify embed sync)
│   ├── navigation.js   # Hamburger menu, navbar shadow, active link, progress bar
│   ├── scrollReveal.js # Fade elements in as they scroll into view
│   ├── toast.js        # Bottom pop-up notification + "copy email" button
│   ├── wordGame.js     # The vocabulary Wordle game
│   ├── wordBank.js     # The word list the game draws from (pure data)
│   └── background.js   # The animated canvas behind the whole page
├── agniva_wells.pdf    # Résumé (downloaded by the Resume buttons)
├── myphoto.jpg         # Hero photo
└── README.md           # You are here
```

Each file in `js/` owns exactly one concern and exposes a single `init…()`
function. Nothing runs on its own — `main.js` decides what runs and in what
order. That makes `main.js` readable as a table of contents for the whole site.

---

## How execution flows, top to bottom

### 1. The browser loads `index.html`
It parses the `<head>` (fonts + `styles.css`), then the `<body>` markup:
the background `<canvas>`, the navbar, and each `<section>` (hero, about,
experience, skills, music, **word game**, contact, footer).

### 2. The last line of the body kicks off the JavaScript

```html
<script type="module" src="js/main.js"></script>
```

`type="module"` matters for two reasons:
- **It's deferred automatically.** The script only runs *after* the whole HTML
  document has been parsed, so every `init` function can safely assume the DOM
  elements it needs already exist.
- **It enables `import`/`export`.** Browsers load the module graph for you — no
  bundler required. (One consequence: modules must be served over `http(s)`,
  not opened as a `file://` path. See *Running locally* below.)

### 3. `main.js` runs — this is where the page comes alive

`main.js` imports every feature module and calls their init functions in order:

```js
initTheme();          // 1. apply saved/default theme, wire the toggle
initNavigation();     // 2. hamburger, navbar shadow, active link, progress bar
initScrollReveal();   // 3. observe .reveal elements, fade them in on scroll
initCopyEmail();      // 4. wire the copy-email button + toast helper
initWordGame();       // 5. build and start the word game
initBackground();     // 6. start the animated canvas
```

That's the entire startup sequence. Each call is self-contained; the order is
not critical, but it reads naturally top-to-bottom.

### 4. From then on, everything is event-driven
There's no loop or central controller. Each module has attached its own
listeners/observers and reacts on its own:
- scrolling → navbar shadow, progress bar, reveal-on-scroll, active nav link
- clicking the toggle → theme switch (which also re-tints the canvas)
- clicking keys / typing → the word game
- the canvas → a `requestAnimationFrame` loop that pauses when the tab is hidden

---

## The word game in detail

This is the most involved piece, so here's its flow (all in `js/wordGame.js`):

1. **`initWordGame()`** grabs the DOM elements, builds the on-screen keyboard
   once, then calls `newGame()`.
2. **`newGame()`** picks a random word from `wordBank.js` (never the same one
   twice in a row), resets all state, and builds a fresh board sized to that
   word's length. A "Word type" filter (All / Noun / Verb / Adjective) narrows
   the pool — `wordPool()` returns only the matching entries.
3. The player types — via the on-screen keyboard (click) or the physical
   keyboard (only while the game is scrolled into view). `addLetter` /
   `removeLetter` fill the current row.
4. **`submit()`** runs on Enter. It:
   - checks the row is full;
   - calls **`isRealWord()`**, which validates the guess against the free
     [dictionaryapi.dev](https://dictionaryapi.dev) API (results are cached; the
     answer is always accepted; any network failure falls back to accepting, so
     an outage never blocks play);
   - **`evaluate()`** colours each tile green / amber / grey using the standard
     two-pass Wordle rule (exact matches first, then present-but-misplaced);
   - checks for a win, or a loss after 6 rows.
5. **Reveal / give up** is allowed only after 3 tries (`REVEAL_AFTER`); before
   that it pops a toast. On reveal it spells the answer out, then shows the card.
6. **`showResult()`** ends every round by revealing the word's part of speech,
   definition, and example sentence — win, loss, or reveal. A win also triggers
   **`celebrate()`** (rockets + confetti).

**To change the words:** edit `js/wordBank.js` only. Each entry is
`{ w, pos, def, use }`, where `pos` is `noun`, `verb`, or `adjective` (these feed
the "Word type" filter). No game code needs to change.

---

## Running locally

Because the site uses ES modules, you need to serve it over HTTP (double-clicking
`index.html` will fail with a CORS/module error). Any static server works:

```bash
# from the repo root
python3 -m http.server 8000
# then open http://localhost:8000
```

or with Node:

```bash
npx serve .
```

---

## Deployment

The repo is a GitHub Pages user site (`BanerjeeAgniva.github.io`), so **pushing
to `main` deploys it** — Pages serves the files directly, no CI/build. Changes go
live within about a minute.

> Note: GitHub Pages on the free plan requires the repo to be **public** to stay
> served. If it's made private, the site is unpublished until it's public again.
