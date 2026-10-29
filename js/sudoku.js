/**
 * sudoku.js — a from-scratch Sudoku game.
 *
 * A self-contained mini-game in the spirit of the big online Sudoku sites
 * (sudoku.com, the NYT, etc.). `initSudoku()` wires up board rendering, a
 * number pad, an on-screen tool bar, the physical keyboard, highlighting,
 * mistake/conflict detection, notes (pencil marks), undo, hint, a timer, and a
 * win celebration. The styling lives in styles.css under the "SUDOKU" heading.
 *
 * Every page load generates a brand-new puzzle. Generation is two steps:
 *   1. fillGrid()  — build a complete, valid solution by randomised backtracking.
 *   2. digHoles()  — remove clues in 180°-symmetric pairs, but only when the
 *                    puzzle still has exactly ONE solution. That uniqueness
 *                    guarantee is what separates a real Sudoku from a grid of
 *                    random numbers, and it's the single most important
 *                    best-practice for a generator.
 *
 * Difficulty just changes how many clues we aim to leave behind.
 */

// Target number of given clues per difficulty. Symmetry + the uniqueness check
// mean the real count can land a touch higher; these are lower bounds we aim
// for. (A classic "easy" leaves ~38–45 clues, "hard" ~26–30.)
const DIFFICULTY = {
  easy:   { clues: 44, label: 'Easy'   },
  medium: { clues: 34, label: 'Medium' },
  hard:   { clues: 28, label: 'Hard'   },
};
const DIFF_KEY = 'sudoku-difficulty';

/* ─────────────────────────  Pure puzzle engine  ───────────────────────── */

function shuffled(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Is it legal to write `n` at index `i` given the current grid?
function canPlace(g, i, n) {
  const r = (i / 9) | 0, c = i % 9;
  const br = r - (r % 3), bc = c - (c % 3);
  for (let k = 0; k < 9; k++) {
    if (g[r * 9 + k] === n) return false;             // row
    if (g[k * 9 + c] === n) return false;             // column
    const bi = (br + ((k / 3) | 0)) * 9 + (bc + (k % 3));
    if (g[bi] === n) return false;                    // 3×3 box
  }
  return true;
}

// Fill an empty grid with a complete valid solution (randomised backtracking).
function fillGrid(g) {
  const i = g.indexOf(0);
  if (i === -1) return true;
  for (const n of shuffled([1, 2, 3, 4, 5, 6, 7, 8, 9])) {
    if (canPlace(g, i, n)) {
      g[i] = n;
      if (fillGrid(g)) return true;
      g[i] = 0;
    }
  }
  return false;
}

// The empty cell with the fewest candidates — the standard heuristic that keeps
// the solution-counter fast even on sparse grids.
function bestEmpty(g) {
  let best = -1, bestCount = 10;
  for (let i = 0; i < 81; i++) {
    if (g[i] !== 0) continue;
    let count = 0;
    for (let n = 1; n <= 9; n++) if (canPlace(g, i, n)) count++;
    if (count < bestCount) { bestCount = count; best = i; if (count <= 1) break; }
  }
  return best;
}

// Count solutions, but stop as soon as we reach `limit` (we only ever care
// whether it's 0, 1, or "more than 1", so limit = 2 is all we need).
function countSolutions(g, limit) {
  const i = bestEmpty(g);
  if (i === -1) return 1;                 // no empties left → one full solution
  let total = 0;
  for (let n = 1; n <= 9; n++) {
    if (!canPlace(g, i, n)) continue;
    g[i] = n;
    total += countSolutions(g, limit);
    g[i] = 0;
    if (total >= limit) return total;     // early-out: already not unique
  }
  return total;
}

// Remove clues in 180°-rotational pairs, keeping a unique solution at every
// step. Symmetry is purely aesthetic (it's what makes printed puzzles look
// "designed"); the uniqueness check is what makes the puzzle solvable by logic.
function digHoles(solution, targetClues) {
  const puzzle = solution.slice();
  let clues = 81;
  // Walk pairs {i, 80-i}; index 40 (the centre) is its own pair.
  for (const i of shuffled([...Array(81).keys()])) {
    if (clues <= targetClues) break;
    const j = 80 - i;
    if (puzzle[i] === 0) continue;
    const backupI = puzzle[i], backupJ = puzzle[j];
    puzzle[i] = 0; puzzle[j] = 0;
    // countSolutions mutates, so test on a copy.
    if (countSolutions(puzzle.slice(), 2) === 1) {
      clues -= (i === j) ? 1 : 2;
    } else {
      puzzle[i] = backupI; puzzle[j] = backupJ;   // restore — keeps uniqueness
    }
  }
  return puzzle;
}

function generate(difficulty) {
  const solution = new Array(81).fill(0);
  fillGrid(solution);
  const puzzle = digHoles(solution, DIFFICULTY[difficulty].clues);
  return { puzzle, solution };
}

/* ─────────────────────────────  The game  ─────────────────────────────── */

export function initSudoku() {
  const boardEl = document.getElementById('sudokuBoard');
  const padEl   = document.getElementById('sudokuPad');
  if (!boardEl || !padEl) return;

  const newBtn     = document.getElementById('sudokuNew');
  const diffEl     = document.getElementById('sudokuDiff');
  const timerEl    = document.getElementById('sudokuTimer');
  const mistakeEl  = document.getElementById('sudokuMistakes');
  const toolsEl    = document.getElementById('sudokuTools');
  const notesBtn   = document.getElementById('sudokuNotes');
  const resultEl   = document.getElementById('sudokuResult');
  const resTimeEl  = document.getElementById('srTime');
  const resDiffEl  = document.getElementById('srDiff');
  const resAgainEl = document.getElementById('srAgain');

  // Per-cell state, length 81.
  let solution = [];          // the answer
  let given    = [];          // bool: was this a starting clue?
  let value    = [];          // 0 = empty, else 1–9
  let notes    = [];          // Set of pencil-marked candidates
  let cellEls  = [];          // DOM nodes
  let valEls   = [];          // the big-number span in each cell
  let noteEls  = [];          // array of 9 pencil-mark spans in each cell

  let selected   = -1;        // selected cell index, -1 = none
  let noteMode   = false;     // pencil-mark mode on/off
  let mistakes   = 0;
  let solved     = false;
  const history  = [];        // undo stack of cell snapshots

  let difficulty = localStorage.getItem(DIFF_KEY) || 'easy';
  if (!DIFFICULTY[difficulty]) difficulty = 'easy';

  // Timer
  let seconds = 0, timerId = null;
  function fmt(s) { return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
  function stopTimer() { if (timerId) { clearInterval(timerId); timerId = null; } }
  function startTimer() {
    stopTimer();
    timerId = setInterval(() => { seconds++; timerEl.textContent = fmt(seconds); }, 1000);
  }

  /* ── Board construction ── */
  function buildBoard() {
    boardEl.innerHTML = '';
    cellEls = []; valEls = []; noteEls = [];
    for (let i = 0; i < 81; i++) {
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 's-cell';
      cell.dataset.i = i;
      cell.setAttribute('role', 'gridcell');

      const val = document.createElement('span');
      val.className = 's-val';
      cell.appendChild(val);

      const nWrap = document.createElement('span');
      nWrap.className = 's-notes';
      const nSpans = [];
      for (let n = 1; n <= 9; n++) {
        const ns = document.createElement('span');
        ns.dataset.n = n;
        nWrap.appendChild(ns);
        nSpans.push(ns);
      }
      cell.appendChild(nWrap);

      boardEl.appendChild(cell);
      cellEls.push(cell);
      valEls.push(val);
      noteEls.push(nSpans);
    }
  }

  /* ── Number pad ── */
  function buildPad() {
    padEl.innerHTML = '';
    for (let n = 1; n <= 9; n++) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 's-pad-key';
      b.dataset.n = n;
      b.textContent = n;
      const count = document.createElement('span');
      count.className = 's-pad-count';
      b.appendChild(count);
      padEl.appendChild(b);
    }
  }

  /* ── Rendering ── */
  // True when value[i] duplicates another filled cell in its row/col/box.
  function hasConflict(i) {
    const v = value[i];
    if (!v) return false;
    const r = (i / 9) | 0, c = i % 9;
    const br = r - (r % 3), bc = c - (c % 3);
    for (let k = 0; k < 9; k++) {
      const ri = r * 9 + k, ci = k * 9 + c;
      const bi = (br + ((k / 3) | 0)) * 9 + (bc + (k % 3));
      if (ri !== i && value[ri] === v) return true;
      if (ci !== i && value[ci] === v) return true;
      if (bi !== i && value[bi] === v) return true;
    }
    return false;
  }

  function render() {
    const selVal = selected >= 0 ? value[selected] : 0;
    const selR = selected >= 0 ? (selected / 9) | 0 : -1;
    const selC = selected >= 0 ? selected % 9 : -1;
    const selB = selected >= 0
      ? (((selR - selR % 3)) * 3 + (selC - selC % 3) / 3) : -1; // box id 0..8

    for (let i = 0; i < 81; i++) {
      const cell = cellEls[i];
      const v = value[i];
      cell.className = 's-cell' + (given[i] ? ' given' : '');

      // value vs pencil marks
      valEls[i].textContent = v ? v : '';
      cell.classList.toggle('has-val', !!v);
      for (let n = 1; n <= 9; n++) {
        noteEls[i][n - 1].textContent = (!v && notes[i].has(n)) ? n : '';
      }
    }

    // Second pass for highlight/conflict classes (needs final values in place).
    for (let i = 0; i < 81; i++) {
      const cell = cellEls[i];
      const v = value[i];
      const r = (i / 9) | 0, c = i % 9;
      const b = ((r - r % 3)) * 3 + (c - c % 3) / 3;

      if (i === selected) cell.classList.add('selected');
      else if (selected >= 0 && (r === selR || c === selC || b === selB)) cell.classList.add('peer');

      if (v && selVal && v === selVal) cell.classList.add('same');
      if (!given[i] && v && v !== solution[i]) cell.classList.add('error');
      if (v && hasConflict(i)) cell.classList.add('conflict');
    }

    // Pad: show remaining count per digit, disable when all nine are placed.
    const placed = new Array(10).fill(0);
    for (let i = 0; i < 81; i++) if (value[i]) placed[value[i]]++;
    padEl.querySelectorAll('.s-pad-key').forEach(b => {
      const n = +b.dataset.n;
      const left = 9 - placed[n];
      b.querySelector('.s-pad-count').textContent = left > 0 ? left : '';
      b.classList.toggle('done', left <= 0);
    });

    mistakeEl.textContent = 'Mistakes: ' + mistakes;
  }

  /* ── Actions ── */
  function select(i) {
    if (solved) return;
    selected = i;
    render();
  }

  function snapshot(i) {
    history.push({ i, value: value[i], notes: new Set(notes[i]), mistakes });
  }

  function placeValue(n) {
    if (solved || selected < 0) return;
    const i = selected;
    if (given[i]) return;                 // can't overwrite a clue

    if (noteMode) {
      snapshot(i);
      value[i] = 0;                       // a pencil mark clears any guess
      if (notes[i].has(n)) notes[i].delete(n); else notes[i].add(n);
      render();
      return;
    }

    if (value[i] === n) { erase(); return; }   // tap same digit to clear

    snapshot(i);
    value[i] = n;
    notes[i].clear();
    if (n !== solution[i]) mistakes++;         // auto-check, like the big sites
    render();
    checkWin();
  }

  function erase() {
    if (solved || selected < 0) return;
    const i = selected;
    if (given[i] || (!value[i] && notes[i].size === 0)) return;
    snapshot(i);
    value[i] = 0;
    notes[i].clear();
    render();
  }

  function undo() {
    if (solved || !history.length) return;
    const s = history.pop();
    value[s.i] = s.value;
    notes[s.i] = s.notes;
    mistakes = s.mistakes;
    selected = s.i;
    render();
  }

  function hint() {
    if (solved || selected < 0) return;
    const i = selected;
    if (given[i] || value[i] === solution[i]) return;
    snapshot(i);
    value[i] = solution[i];
    notes[i].clear();
    given[i] = true;                       // a revealed cell becomes locked
    render();
    checkWin();
  }

  function toggleNotes() {
    noteMode = !noteMode;
    notesBtn.classList.toggle('active', noteMode);
    notesBtn.querySelector('.notes-state').textContent = noteMode ? 'On' : 'Off';
  }

  function move(dr, dc) {
    if (selected < 0) { select(0); return; }
    let r = (selected / 9 | 0) + dr, c = selected % 9 + dc;
    r = (r + 9) % 9; c = (c + 9) % 9;
    select(r * 9 + c);
  }

  function checkWin() {
    for (let i = 0; i < 81; i++) if (value[i] !== solution[i]) return;
    solved = true;
    stopTimer();
    showResult();
    celebrate();
  }

  function showResult() {
    resTimeEl.textContent = fmt(seconds);
    resDiffEl.textContent = DIFFICULTY[difficulty].label;
    resultEl.hidden = false;
    resultEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /* ── New game ── */
  function newGame() {
    const { puzzle, solution: sol } = generate(difficulty);
    solution = sol;
    given = puzzle.map(v => v !== 0);
    value = puzzle.slice();
    notes = Array.from({ length: 81 }, () => new Set());
    history.length = 0;
    selected = -1;
    mistakes = 0;
    solved = false;
    seconds = 0;
    timerEl.textContent = '0:00';
    resultEl.hidden = true;
    if (noteMode) toggleNotes();
    render();
    startTimer();
  }

  /* ── Win celebration (reuses the global confetti layer) ── */
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
    setTimeout(() => layer.remove(), 3600);
  }

  /* ── Input wiring ── */
  boardEl.addEventListener('click', (e) => {
    const cell = e.target.closest('.s-cell');
    if (cell) select(+cell.dataset.i);
  });

  padEl.addEventListener('click', (e) => {
    const key = e.target.closest('.s-pad-key');
    if (key) placeValue(+key.dataset.n);
  });

  toolsEl.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-tool]');
    if (!btn) return;
    ({ undo, erase, notes: toggleNotes, hint })[btn.dataset.tool]?.();
  });

  newBtn.addEventListener('click', newGame);
  resAgainEl.addEventListener('click', newGame);

  diffEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.gf-btn');
    if (!btn) return;
    difficulty = btn.dataset.diff;
    localStorage.setItem(DIFF_KEY, difficulty);
    diffEl.querySelectorAll('.gf-btn').forEach(b => b.classList.toggle('active', b === btn));
    newGame();
  });

  // Physical keyboard — only while the game is on screen.
  let inView = false;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((es) => { inView = es[0].isIntersecting; }, { threshold: 0.2 })
      .observe(document.getElementById('sudoku'));
  }
  document.addEventListener('keydown', (e) => {
    if (!inView || solved) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (/^[1-9]$/.test(e.key))               { e.preventDefault(); placeValue(+e.key); }
    else if (e.key === '0' || e.key === 'Backspace' || e.key === 'Delete') { e.preventDefault(); erase(); }
    else if (e.key === 'ArrowUp')    { e.preventDefault(); move(-1, 0); }
    else if (e.key === 'ArrowDown')  { e.preventDefault(); move(1, 0); }
    else if (e.key === 'ArrowLeft')  { e.preventDefault(); move(0, -1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); move(0, 1); }
    else if (e.key === 'n' || e.key === 'N') { e.preventDefault(); toggleNotes(); }
    else if (e.key === 'h' || e.key === 'H') { e.preventDefault(); hint(); }
  });

  // Reflect the stored difficulty in the selector, then start.
  diffEl.querySelectorAll('.gf-btn').forEach(b => b.classList.toggle('active', b.dataset.diff === difficulty));
  buildBoard();
  buildPad();
  newGame();
}
