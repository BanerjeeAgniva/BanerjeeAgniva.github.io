/**
 * wordGame.js — the vocabulary Wordle.
 *
 * A self-contained mini-game. `initWordGame()` wires up the board, on-screen and
 * physical keyboards, guess validation, the reveal/give-up flow, and the win
 * celebration. The list of words lives in wordBank.js; the styling lives in
 * styles.css under the "WORD GAME" heading.
 *
 * High-level flow:
 *   newGame() → pick a word, build a fresh board → player types guesses →
 *   submit() validates against a dictionary API, colours the tiles, and checks
 *   for a win/loss → showResult() reveals the meaning + usage either way.
 */
import { WORDS } from './wordBank.js';

export function initWordGame() {
  const board    = document.getElementById('gameBoard');
  const keyboard = document.getElementById('gameKeyboard');
  if (!board || !keyboard) return;

  const lenEl     = document.getElementById('gameLen');
  const posEl     = document.getElementById('gamePos');
  const msgEl     = document.getElementById('gameMsg');
  const refreshEl = document.getElementById('gameRefresh');
  const revealEl  = document.getElementById('gameReveal');
  const filterEl  = document.getElementById('gameFilter');
  const resultEl  = document.getElementById('gameResult');
  const grStatus  = document.getElementById('grStatus');
  const grTerm    = document.getElementById('grTerm');
  const grPos     = document.getElementById('grPos');
  const grDef     = document.getElementById('grDef');
  const grUse     = document.getElementById('grUse');
  const grNext    = document.getElementById('grNext');

  const MAX_ROWS = 6;

  const REVEAL_AFTER = 3;        // tries required before "Reveal" is allowed
  const validCache = new Map();  // word -> bool (dictionary-API results)
  let answer = '', meta = null;
  let posFilter = 'all';         // 'all' | 'noun' | 'verb' | 'adjective'
  let row = 0, col = 0, over = false, checking = false;
  let cells = [];          // cells[r][c]
  let rowEls = [];
  const keyEls = {};       // letter -> button
  const keyState = {};     // letter -> 'absent'|'present'|'correct'

  // Words matching the current part-of-speech filter ('all' = the whole bank).
  function wordPool() {
    return posFilter === 'all' ? WORDS : WORDS.filter(x => x.pos === posFilter);
  }

  function pick() {
    const list = wordPool();
    let choice;
    do { choice = list[(Math.random() * list.length) | 0]; } while (choice === meta && list.length > 1);
    meta = choice;
    answer = meta.w.toLowerCase();
  }

  function buildBoard() {
    board.innerHTML = '';
    cells = []; rowEls = [];
    for (let r = 0; r < MAX_ROWS; r++) {
      const rowEl = document.createElement('div');
      rowEl.className = 'game-row';
      const rowCells = [];
      for (let c = 0; c < answer.length; c++) {
        const t = document.createElement('div');
        t.className = 'tile';
        rowEl.appendChild(t);
        rowCells.push(t);
      }
      board.appendChild(rowEl);
      rowEls.push(rowEl);
      cells.push(rowCells);
    }
  }

  const KB_ROWS = ['qwertyuiop', 'asdfghjkl', '↵zxcvbnm⌫']; // ↵ … ⌫
  function buildKeyboard() {
    keyboard.innerHTML = '';
    for (const rowStr of KB_ROWS) {
      const rEl = document.createElement('div');
      rEl.className = 'kb-row';
      for (const ch of rowStr) {
        const k = document.createElement('button');
        k.type = 'button';
        if (ch === '↵') { k.className = 'key wide'; k.textContent = 'Enter'; k.dataset.k = 'enter'; }
        else if (ch === '⌫') { k.className = 'key wide'; k.textContent = '⌫'; k.dataset.k = 'back'; }
        else { k.className = 'key'; k.textContent = ch; k.dataset.k = ch; keyEls[ch] = k; }
        rEl.appendChild(k);
      }
      keyboard.appendChild(rEl);
    }
  }

  function flashMsg(text) {
    msgEl.textContent = text;
    clearTimeout(flashMsg._t);
    flashMsg._t = setTimeout(() => { if (msgEl.textContent === text) msgEl.textContent = ''; }, 1600);
  }

  function addLetter(ch) {
    if (over || col >= answer.length) return;
    const t = cells[row][col];
    t.textContent = ch;
    t.classList.add('filled');
    col++;
  }
  function removeLetter() {
    if (over || col === 0) return;
    col--;
    const t = cells[row][col];
    t.textContent = '';
    t.classList.remove('filled');
  }

  function evaluate(guess) {
    const res = Array(answer.length).fill('absent');
    const counts = {};
    for (const c of answer) counts[c] = (counts[c] || 0) + 1;
    for (let i = 0; i < answer.length; i++) {
      if (guess[i] === answer[i]) { res[i] = 'correct'; counts[guess[i]]--; }
    }
    for (let i = 0; i < answer.length; i++) {
      if (res[i] === 'absent' && counts[guess[i]] > 0) { res[i] = 'present'; counts[guess[i]]--; }
    }
    return res;
  }

  const rank = { absent: 0, present: 1, correct: 2 };
  function paintKey(ch, state) {
    if (rank[state] <= rank[keyState[ch] || 'absent'] && keyState[ch]) return;
    keyState[ch] = state;
    const k = keyEls[ch];
    if (k) { k.classList.remove('absent', 'present', 'correct'); k.classList.add(state); }
  }

  function shakeRow(text) {
    rowEls[row].classList.add('shake');
    flashMsg(text);
    setTimeout(() => rowEls[row].classList.remove('shake'), 420);
  }

  // Validate a guess against the free dictionary API. Answers are always
  // accepted; results are cached; any network/unexpected failure falls back to
  // accepting the guess so an outage never blocks play.
  async function isRealWord(word) {
    if (word === answer) return true;
    if (validCache.has(word)) return validCache.get(word);
    try {
      const r = await fetch('https://api.dictionaryapi.dev/api/v2/entries/en/' + word);
      if (r.status === 404) { validCache.set(word, false); return false; }
      if (r.status === 200) { validCache.set(word, true); return true; }
      return true;
    } catch (e) {
      return true;
    }
  }

  async function submit() {
    if (over || checking) return;
    if (col < answer.length) { shakeRow('Not enough letters'); return; }
    const guess = cells[row].map(t => t.textContent.toLowerCase()).join('');

    checking = true;
    msgEl.textContent = 'Checking…';
    const ok = await isRealWord(guess);
    checking = false;
    if (over) return;                 // state changed mid-check (reveal / new word)
    if (!ok) { shakeRow('Not a word — try another'); return; }
    msgEl.textContent = '';

    const res = evaluate(guess);

    res.forEach((state, i) => {
      const t = cells[row][i];
      setTimeout(() => {
        t.classList.add('reveal-flip');
        setTimeout(() => { t.classList.add(state); paintKey(guess[i], state); }, 250);
      }, i * 220);
    });

    const won = guess === answer;
    const totalDelay = (answer.length - 1) * 220 + 520;
    row++; col = 0;

    if (won) {
      over = true; revealEl.disabled = true;
      setTimeout(() => { celebrate(); showResult(true); }, totalDelay);
    } else if (row >= MAX_ROWS) {
      over = true; revealEl.disabled = true;
      setTimeout(() => showResult(false), totalDelay);
    }
  }

  // Give up: only permitted once the player has made it through 3 tries.
  function reveal() {
    if (over) return;
    if (row < REVEAL_AFTER) {
      const msg = 'You can only reveal after ' + REVEAL_AFTER + ' tries';
      (window.showToast || flashMsg)(msg);
      return;
    }
    over = true; revealEl.disabled = true; checking = false;
    if (row < MAX_ROWS) {                 // spell out the answer in the next row
      answer.split('').forEach((ch, i) => {
        const t = cells[row][i];
        t.textContent = ch;
        t.classList.add('filled');
        setTimeout(() => {
          t.classList.add('reveal-flip');
          setTimeout(() => { t.classList.add('correct'); paintKey(ch, 'correct'); }, 250);
        }, i * 120);
      });
    }
    setTimeout(() => showResult(false, true), answer.length * 120 + 420);
  }

  function showResult(won, revealed) {
    grStatus.textContent = won ? '🚀 Nailed it!'
      : revealed ? 'Revealed — one for your vocabulary'
      : 'Out of tries — but here’s a word for you';
    grTerm.textContent   = meta.w;
    grPos.textContent    = meta.pos;
    grDef.textContent    = meta.def;
    grUse.textContent    = meta.use;
    resultEl.hidden = false;
    resultEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function newGame() {
    pick();
    row = 0; col = 0; over = false; checking = false;
    revealEl.disabled = false;
    for (const k in keyState) delete keyState[k];
    Object.values(keyEls).forEach(k => k.classList.remove('absent', 'present', 'correct'));
    msgEl.textContent = '';
    resultEl.hidden = true;
    lenEl.textContent = answer.length + (answer.length === 1 ? ' letter' : ' letters');
    posEl.textContent = '· ' + meta.pos;
    buildBoard();
  }

  /* Rockets + confetti */
  function celebrate() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const layer = document.createElement('div');
    layer.className = 'celebrate-layer';
    document.body.appendChild(layer);

    const colors = ['#4d9de0', '#3aa76d', '#d4a017', '#e0556b', '#9b6de0', '#ffffff'];
    for (let i = 0; i < 90; i++) {
      const c = document.createElement('div');
      c.className = 'cel-confetti';
      c.style.left = Math.random() * 100 + 'vw';
      c.style.background = colors[(Math.random() * colors.length) | 0];
      c.style.animationDuration = (1.6 + Math.random() * 1.6) + 's';
      c.style.animationDelay = (Math.random() * 0.5) + 's';
      layer.appendChild(c);
    }
    for (let i = 0; i < 6; i++) {
      const r = document.createElement('div');
      r.className = 'cel-rocket';
      r.textContent = '🚀';
      r.style.left = (8 + Math.random() * 84) + 'vw';
      r.style.animationDelay = (Math.random() * 0.6) + 's';
      layer.appendChild(r);
    }
    setTimeout(() => layer.remove(), 3600);
  }

  /* Input wiring */
  keyboard.addEventListener('click', (e) => {
    const k = e.target.closest('.key');
    if (!k) return;
    const v = k.dataset.k;
    if (v === 'enter') submit();
    else if (v === 'back') removeLetter();
    else addLetter(v);
  });

  // Physical keyboard — only while the game is on screen
  let inView = false;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => { inView = entries[0].isIntersecting; }, { threshold: 0.25 })
      .observe(document.getElementById('game'));
  }
  document.addEventListener('keydown', (e) => {
    if (!inView || over) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'Enter') { e.preventDefault(); submit(); }
    else if (e.key === 'Backspace') { e.preventDefault(); removeLetter(); }
    else if (/^[a-zA-Z]$/.test(e.key)) addLetter(e.key.toLowerCase());
  });

  refreshEl.addEventListener('click', newGame);
  revealEl.addEventListener('click', reveal);
  grNext.addEventListener('click', newGame);

  // Word-type filter: switch the pool and start a fresh word in that category.
  filterEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.gf-btn');
    if (!btn) return;
    posFilter = btn.dataset.pos;
    filterEl.querySelectorAll('.gf-btn').forEach(b => b.classList.toggle('active', b === btn));
    newGame();
  });

  buildKeyboard();
  newGame();
}
