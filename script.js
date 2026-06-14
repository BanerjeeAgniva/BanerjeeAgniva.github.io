/* ─── Theme Toggle ─── */
const html          = document.documentElement;
const themeToggle   = document.getElementById('themeToggle');
const STORAGE_KEY   = 'portfolio-theme';

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
  html.setAttribute('data-theme', theme);
  localStorage.setItem(STORAGE_KEY, theme);
  syncMusicTheme(theme);
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

/* ─── Scroll Progress Bar ─── */
const scrollProgress = document.getElementById('scrollProgress');
window.addEventListener('scroll', () => {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  scrollProgress.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + '%';
}, { passive: true });

/* ─── Copy Email to Clipboard ─── */
const copyEmailBtn = document.getElementById('copyEmailBtn');
const toast = document.getElementById('toast');
let toastTimer;

function showToast(msg, ms = 2200) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), ms);
}
// expose for other modules (e.g. the word game)
window.showToast = showToast;

copyEmailBtn.addEventListener('click', (e) => {
  e.preventDefault();
  e.stopPropagation();
  navigator.clipboard.writeText('coolagniva12@gmail.com').then(() => {
    showToast('Email copied to clipboard ✓');
  });
});

/* ─── Vocabulary Wordle ─── */
(function () {
  const board    = document.getElementById('gameBoard');
  const keyboard = document.getElementById('gameKeyboard');
  if (!board || !keyboard) return;

  const lenEl     = document.getElementById('gameLen');
  const posEl     = document.getElementById('gamePos');
  const msgEl     = document.getElementById('gameMsg');
  const refreshEl = document.getElementById('gameRefresh');
  const revealEl  = document.getElementById('gameReveal');
  const resultEl  = document.getElementById('gameResult');
  const grStatus  = document.getElementById('grStatus');
  const grTerm    = document.getElementById('grTerm');
  const grPos     = document.getElementById('grPos');
  const grDef     = document.getElementById('grDef');
  const grUse     = document.getElementById('grUse');
  const grNext    = document.getElementById('grNext');

  const MAX_ROWS = 6;

  // Curated bank: uncommon-but-conversational words, each with a short
  // definition and a natural usage sentence. (3–9 letters.)
  const WORDS = [
    { w: 'pithy',    pos: 'adjective', def: 'Brief, forceful, and full of meaning.',                 use: 'His pithy summary said in one line what the report took ten pages to explain.' },
    { w: 'laconic',  pos: 'adjective', def: 'Using very few words; terse.',                          use: 'Her laconic “fine” made it clear she was anything but.' },
    { w: 'candor',   pos: 'noun',      def: 'Honest, open, and sincere expression.',                 use: 'I appreciated his candor when he admitted the plan had flaws.' },
    { w: 'nuance',   pos: 'noun',      def: 'A subtle shade of meaning or difference.',              use: 'Good translators capture the nuance, not just the literal words.' },
    { w: 'astute',   pos: 'adjective', def: 'Sharp, perceptive, and clever.',                        use: 'That was an astute observation about why the project stalled.' },
    { w: 'sanguine', pos: 'adjective', def: 'Cheerfully optimistic, even in tough times.',           use: 'Despite the setback, she stayed sanguine about the launch.' },
    { w: 'eloquent', pos: 'adjective', def: 'Fluent and persuasive in speech or writing.',           use: 'Her eloquent toast left half the table in tears.' },
    { w: 'affable',  pos: 'adjective', def: 'Friendly, warm, and easy to talk to.',                  use: 'The new manager is so affable that people line up to chat.' },
    { w: 'cogent',   pos: 'adjective', def: 'Clear, logical, and convincing.',                       use: 'She made a cogent case for delaying the release.' },
    { w: 'lucid',    pos: 'adjective', def: 'Clear and easy to understand.',                          use: 'Thanks for the lucid explanation — it finally clicked.' },
    { w: 'prudent',  pos: 'adjective', def: 'Careful, sensible, and wise in practice.',              use: 'It is prudent to keep a backup before you deploy.' },
    { w: 'succinct', pos: 'adjective', def: 'Briefly and clearly expressed.',                        use: 'Keep the update succinct; everyone is short on time.' },
    { w: 'adept',    pos: 'adjective', def: 'Highly skilled or proficient.',                          use: 'She is remarkably adept at defusing tense meetings.' },
    { w: 'rapport',  pos: 'noun',      def: 'A relationship of mutual understanding and trust.',     use: 'They built an easy rapport within minutes.' },
    { w: 'poignant', pos: 'adjective', def: 'Deeply moving; keenly touching.',                       use: 'It was a poignant goodbye after ten years together.' },
    { w: 'earnest',  pos: 'adjective', def: 'Sincere and seriously intentioned.',                    use: 'His earnest apology smoothed everything over.' },
    { w: 'blithe',   pos: 'adjective', def: 'Carefree and cheerfully unconcerned.',                  use: 'She gave a blithe wave and carried on.' },
    { w: 'droll',    pos: 'adjective', def: 'Amusing in an odd or whimsical way.',                   use: 'He has a droll way of delivering even bad news.' },
    { w: 'canny',    pos: 'adjective', def: 'Shrewd, especially in money or business.',              use: 'A canny investor, she sold just before the dip.' },
    { w: 'banter',   pos: 'noun',      def: 'Playful, teasing conversation.',                        use: 'The interview ended with some friendly banter.' },
    { w: 'jovial',   pos: 'adjective', def: 'Cheerful and good-humored.',                            use: 'Our host was jovial and kept everyone laughing.' },
    { w: 'ardent',   pos: 'adjective', def: 'Very enthusiastic or passionate.',                      use: 'He is an ardent supporter of open-source.' },
    { w: 'cordial',  pos: 'adjective', def: 'Warm and friendly.',                                    use: 'We reached a cordial agreement over coffee.' },
    { w: 'quip',     pos: 'noun',      def: 'A witty or clever remark.',                             use: 'He lightened the mood with a quick quip.' },
    { w: 'whimsy',   pos: 'noun',      def: 'Playfully quaint or fanciful behavior.',               use: 'The design has a touch of whimsy that users love.' },
    { w: 'diligent', pos: 'adjective', def: 'Hardworking and careful.',                              use: 'A diligent reviewer caught the bug before release.' },
    { w: 'amicable', pos: 'adjective', def: 'Friendly and free of conflict.',                        use: 'They reached an amicable split with no hard feelings.' },
    { w: 'verbose',  pos: 'adjective', def: 'Using more words than needed.',                         use: 'The email was so verbose I just skimmed it.' },
    { w: 'brevity',  pos: 'noun',      def: 'Concise and exact use of words.',                       use: 'Brevity is a kindness in a long meeting.' },
    { w: 'tactful',  pos: 'adjective', def: 'Sensitive and diplomatic with people.',                use: 'A tactful nudge worked better than a blunt order.' },
    { w: 'genial',   pos: 'adjective', def: 'Pleasant, friendly, and good-natured.',                use: 'His genial manner put the nervous candidate at ease.' },
    { w: 'wry',      pos: 'adjective', def: 'Dryly and cleverly humorous.',                          use: 'She raised an eyebrow and made a wry remark.' },
    { w: 'apt',      pos: 'adjective', def: 'Strikingly appropriate or fitting.',                    use: 'That was an apt comparison — it nailed the problem.' },
    { w: 'savvy',    pos: 'noun',      def: 'Practical know-how and shrewdness.',                    use: 'Her marketing savvy doubled our reach.' }
  ];

  const REVEAL_AFTER = 3;        // tries required before "Reveal" is allowed
  const validCache = new Map();  // word -> bool (dictionary-API results)
  let answer = '', meta = null, prevIndex = -1;
  let row = 0, col = 0, over = false, checking = false;
  let cells = [];          // cells[r][c]
  let rowEls = [];
  const keyEls = {};       // letter -> button
  const keyState = {};     // letter -> 'absent'|'present'|'correct'

  function pick() {
    let i;
    do { i = (Math.random() * WORDS.length) | 0; } while (i === prevIndex && WORDS.length > 1);
    prevIndex = i;
    meta = WORDS[i];
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

  buildKeyboard();
  newGame();
})();

/* ─── Hero Flow-Field Animation (data packets riding flowing lanes) ─── */
(function () {
  const canvas = document.getElementById('bgCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let W = 0, H = 0, DPR = 1;
  let lanes = [], packets = [], dust = [];
  let rgb = [77, 157, 224];
  let isLight = false;
  let last = 0, rafId = null;

  const rgba = (a) => `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`;

  function readTheme() {
    const hex = (getComputedStyle(document.documentElement)
      .getPropertyValue('--accent') || '#4d9de0').trim();
    const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    if (m) rgb = [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
    isLight = document.documentElement.getAttribute('data-theme') === 'light';
  }

  // y-position of a lane at horizontal x and time t (two stacked sines = organic flow)
  function laneY(lane, x, t) {
    return lane.y
      + Math.sin(x * lane.freq + lane.phase + t * lane.speed) * lane.amp
      + Math.sin(x * lane.freq2 + t * lane.speed2) * lane.amp2;
  }

  function newPacket() {
    return {
      lane: (Math.random() * lanes.length) | 0,
      x: Math.random() * W,
      speed: 40 + Math.random() * 75,   // px / sec
      size: 1.5 + Math.random() * 2.2,
      glow: 9 + Math.random() * 16
    };
  }

  function build() {
    const laneCount = W < 640 ? 4 : 6;
    lanes = [];
    for (let i = 0; i < laneCount; i++) {
      lanes.push({
        y: H * (0.12 + 0.76 * (i + 0.5) / laneCount),
        amp: 22 + Math.random() * 44,
        amp2: 5 + Math.random() * 13,
        freq: 0.003 + Math.random() * 0.004,
        freq2: 0.009 + Math.random() * 0.011,
        phase: Math.random() * Math.PI * 2,
        speed: 0.14 + Math.random() * 0.24,
        speed2: 0.3 + Math.random() * 0.4,
        width: 0.8 + Math.random() * 1.0
      });
    }
    packets = [];
    const packetCount = W < 640 ? 16 : 30;
    for (let i = 0; i < packetCount; i++) packets.push(newPacket());

    dust = [];
    const dustCount = W < 640 ? 16 : 34;
    for (let i = 0; i < dustCount; i++) {
      dust.push({
        x: Math.random() * W, y: Math.random() * H,
        r: Math.random() * 1.3 + 0.3,
        vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6,
        a: Math.random() * 0.4 + 0.08
      });
    }
  }

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    W = rect.width; H = rect.height;
    if (!W || !H) return;
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    build();
    if (prefersReduced) drawStatic();
  }

  function drawLanes(t) {
    ctx.lineCap = 'round';
    for (const lane of lanes) {
      ctx.beginPath();
      for (let x = 0; x <= W; x += 14) {
        const y = laneY(lane, x, t);
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = rgba(0.08);
      ctx.lineWidth = lane.width;
      ctx.stroke();
    }
  }

  function drawDust(dt) {
    for (const p of dust) {
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.x < 0) p.x += W; else if (p.x > W) p.x -= W;
      if (p.y < 0) p.y += H; else if (p.y > H) p.y -= H;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = rgba(p.a * (isLight ? 0.6 : 1));
      ctx.fill();
    }
  }

  function drawPackets(dt, t) {
    ctx.save();
    if (!isLight) ctx.globalCompositeOperation = 'lighter';
    const tailLen = 48;
    for (const pk of packets) {
      pk.x += pk.speed * dt;
      if (pk.x > W + 24) { pk.x = -24; pk.lane = (Math.random() * lanes.length) | 0; }
      const lane = lanes[pk.lane];
      const y = laneY(lane, pk.x, t);

      // trailing streak that follows the lane curve
      const grad = ctx.createLinearGradient(pk.x - tailLen, 0, pk.x, 0);
      grad.addColorStop(0, rgba(0));
      grad.addColorStop(1, rgba(isLight ? 0.5 : 0.6));
      ctx.beginPath();
      ctx.moveTo(pk.x - tailLen, laneY(lane, pk.x - tailLen, t));
      for (let x = pk.x - tailLen + 8; x <= pk.x; x += 8) ctx.lineTo(x, laneY(lane, x, t));
      ctx.strokeStyle = grad;
      ctx.lineWidth = pk.size * 0.8;
      ctx.stroke();

      // soft glow halo
      const g = ctx.createRadialGradient(pk.x, y, 0, pk.x, y, pk.glow);
      g.addColorStop(0, rgba(isLight ? 0.5 : 0.85));
      g.addColorStop(0.4, rgba(isLight ? 0.16 : 0.26));
      g.addColorStop(1, rgba(0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(pk.x, y, pk.glow, 0, Math.PI * 2);
      ctx.fill();

      // bright core
      ctx.beginPath();
      ctx.arc(pk.x, y, pk.size, 0, Math.PI * 2);
      ctx.fillStyle = isLight ? rgba(0.95) : 'rgba(224,238,255,0.95)';
      ctx.fill();
    }
    ctx.restore();
  }

  function drawStatic() {
    ctx.clearRect(0, 0, W, H);
    drawLanes(0);
    drawDust(0);
  }

  function frame(now) {
    if (!last) last = now;
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.05) dt = 0.05;          // clamp big gaps (e.g. returning to tab)
    const t = now / 1000;
    ctx.clearRect(0, 0, W, H);
    drawLanes(t);
    drawDust(dt);
    drawPackets(dt, t);
    rafId = requestAnimationFrame(frame);
  }

  function start() {
    if (prefersReduced || rafId) return;
    last = 0;
    rafId = requestAnimationFrame(frame);
  }
  function stop() {
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  }

  readTheme();
  resize();
  start();

  let rt;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 180); });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop(); else start();
  });
  new MutationObserver(() => {
    readTheme();
    if (prefersReduced) drawStatic();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
})();
