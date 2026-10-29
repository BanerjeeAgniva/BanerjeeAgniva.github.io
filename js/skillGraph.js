/**
 * skillGraph.js — the "How It Connects" trace map.
 *
 * A two-column SVG: roles & projects on the left, skills on the right, with a
 * curved connector for every "used X here". Hovering (or focusing) a node dims
 * everything except its own trace — the lines and the nodes on the other side
 * light up. Click pins a selection so you can move the mouse away; Esc or a
 * click on empty space clears it. Fully keyboard-navigable (Tab between nodes,
 * Enter/Space to pin).
 *
 * All drawing is data-driven from SOURCES / SKILLS / EDGES below, so the graph
 * is edited by editing data, never geometry.
 */
export function initSkillGraph() {
  const host = document.getElementById('skillGraph');
  if (!host) return;

  /* ── data ──────────────────────────────────────────────────────────── */
  const SOURCES = [
    { id: 'wf',       name: 'Wells Fargo',        kind: 'job' },
    { id: 'harness',  name: 'Harness',            kind: 'job' },
    { id: 'urjanet',  name: 'Urjanet',            kind: 'job' },
    { id: 'graphify', name: 'Graphify',           kind: 'proj' },
    { id: 'modarch',  name: 'Modular Architecture', kind: 'proj' },
    { id: 'browser',  name: 'Browser Automation', kind: 'proj' },
  ];

  // group is just the visual cluster; order here is the top-to-bottom order.
  const SKILLS = [
    { id: 'csharp',     name: 'C# / .NET',        group: 'Backend & Data' },
    { id: 'sql',        name: 'SQL Server',       group: 'Backend & Data' },
    { id: 'rest',       name: 'REST APIs',        group: 'Backend & Data' },
    { id: 'data',       name: 'Data Modeling',    group: 'Backend & Data' },
    { id: 'sysdesign',  name: 'System Design',    group: 'Architecture' },
    { id: 'modmono',    name: 'Modular Monoliths',group: 'Architecture' },
    { id: 'distsys',    name: 'Distributed Systems', group: 'Architecture' },
    { id: 'angular',    name: 'Angular',          group: 'Frontend' },
    { id: 'ts',         name: 'TypeScript',       group: 'Frontend' },
    { id: 'react',      name: 'React',            group: 'Frontend' },
    { id: 'backstage',  name: 'Backstage',        group: 'Dev Productivity' },
    { id: 'playwright', name: 'Playwright',       group: 'Dev Productivity' },
    { id: 'cypress',    name: 'Cypress',          group: 'Dev Productivity' },
    { id: 'copilot',    name: 'Copilot / MCP',    group: 'Dev Productivity' },
    { id: 'cicd',       name: 'CI/CD',            group: 'Dev Productivity' },
    { id: 'gcp',        name: 'GCP',              group: 'Cloud' },
  ];

  const EDGES = [
    ['wf','csharp'],['wf','sql'],['wf','rest'],['wf','data'],
    ['wf','sysdesign'],['wf','modmono'],['wf','angular'],['wf','ts'],
    ['harness','ts'],['harness','react'],['harness','backstage'],['harness','cypress'],
    ['harness','copilot'],['harness','cicd'],['harness','gcp'],['harness','distsys'],
    ['urjanet','data'],['urjanet','sql'],
    ['graphify','sysdesign'],['graphify','distsys'],['graphify','copilot'],['graphify','data'],
    ['modarch','modmono'],['modarch','sysdesign'],['modarch','csharp'],
    ['browser','playwright'],['browser','csharp'],['browser','cypress'],['browser','cicd'],
  ];

  /* ── geometry ──────────────────────────────────────────────────────── */
  const W = 1000, NH = 30, TOP = 52;
  const LX = 0,   LW = 210;          // left column
  const RW = 210, RX = W - RW;       // right column
  const rowPitch = 33;
  const span = rowPitch * (SKILLS.length - 1);
  const H = TOP + span + NH + 16;

  const pos = {};
  SKILLS.forEach((s, i) => { pos['s:' + s.id] = { x: RX, y: TOP + i * rowPitch, w: RW }; });
  SOURCES.forEach((s, i) => { pos['r:' + s.id] = { x: LX, y: TOP + i * (span / (SOURCES.length - 1)), w: LW }; });

  const NS = 'http://www.w3.org/2000/svg';
  const el = (n, a, txt) => {
    const e = document.createElementNS(NS, n);
    for (const k in a) e.setAttribute(k, a[k]);
    if (txt != null) e.textContent = txt;
    return e;
  };
  const r1 = v => Math.round(v * 10) / 10;

  const svg = el('svg', {
    viewBox: '0 0 ' + W + ' ' + H, class: 'sg-map', role: 'img',
    'aria-label': 'Connection map: roles and projects on the left linked by lines to the skills used in each, on the right. Hover or focus a node to trace its connections.',
  });

  const defs = el('defs');
  [['sg-arr'], ['sg-arr-hi']].forEach(m => {
    const mk = el('marker', { id: m[0], viewBox: '0 0 10 10', refX: '9', refY: '5', markerWidth: '7', markerHeight: '7', orient: 'auto-start-reverse' });
    mk.appendChild(el('path', { d: 'M0,0 L10,5 L0,10 z' }));
    defs.appendChild(mk);
  });
  svg.appendChild(defs);

  svg.appendChild(el('text', { x: LX, y: 30, class: 'sg-colhead' }, 'ROLES & PROJECTS'));
  svg.appendChild(el('text', { x: RX + RW, y: 30, class: 'sg-colhead', 'text-anchor': 'end' }, 'SKILLS'));

  const gEdges = el('g'), gNodes = el('g');
  svg.appendChild(gEdges); svg.appendChild(gNodes);

  const edges = []; // {el, src, skill}
  function curve(a, b) {
    const x1 = a.x + a.w, y1 = a.y + NH / 2, x2 = b.x, y2 = b.y + NH / 2, mx = (x1 + x2) / 2;
    return 'M' + x1 + ',' + r1(y1) + ' C' + mx + ',' + r1(y1) + ' ' + mx + ',' + r1(y2) + ' ' + x2 + ',' + r1(y2);
  }
  EDGES.forEach(([src, skill]) => {
    const p = el('path', { d: curve(pos['r:' + src], pos['s:' + skill]), class: 'sg-edge' });
    gEdges.appendChild(p);
    edges.push({ el: p, src, skill });
  });

  const nodes = {}; // id -> g
  function addNode(id, label, cls, title) {
    const p = pos[id];
    const g = el('g', { class: 'sg-node ' + cls, tabindex: '0', role: 'button', 'data-id': id, 'aria-label': title });
    g.appendChild(el('title', {}, title));
    g.appendChild(el('rect', { x: p.x, y: p.y, width: p.w, height: NH, rx: 7 }));
    g.appendChild(el('text', { x: p.x + p.w / 2, y: p.y + NH / 2 + 4.5, 'text-anchor': 'middle' }, label));
    gNodes.appendChild(g); nodes[id] = g; return g;
  }
  SOURCES.forEach(s => addNode('r:' + s.id, s.name, s.kind === 'proj' ? 'proj' : 'job',
    s.name + (s.kind === 'proj' ? ' — project' : ' — role') + '; hover to trace its skills'));
  SKILLS.forEach(s => addNode('s:' + s.id, s.name, 'skill', s.name + ' — hover to trace where it was used'));

  host.appendChild(svg);

  /* ── highlight ─────────────────────────────────────────────────────── */
  let pinned = null;

  function clearHi() {
    svg.classList.remove('sg-focus');
    edges.forEach(e => e.el.classList.remove('hi'));
    for (const k in nodes) nodes[k].classList.remove('hi');
  }
  function apply(sel) {
    clearHi();
    if (!sel) return;
    const isSkill = sel.charAt(0) === 's';
    const id = sel.slice(2);
    svg.classList.add('sg-focus');
    nodes[sel].classList.add('hi');
    edges.forEach(e => {
      if ((isSkill && e.skill === id) || (!isSkill && e.src === id)) {
        e.el.classList.add('hi');
        nodes[(isSkill ? 'r:' + e.src : 's:' + e.skill)].classList.add('hi');
      }
    });
  }
  function setPin(sel) {
    pinned = sel;
    svg.classList.toggle('sg-pinned', !!sel);
    for (const k in nodes) nodes[k].classList.toggle('pin', k === sel);
    apply(sel);
  }

  gNodes.addEventListener('mouseover', ev => { const g = ev.target.closest('.sg-node'); if (g && !pinned) apply(g.dataset.id); });
  gNodes.addEventListener('mouseout',  ev => { const g = ev.target.closest('.sg-node'); if (g && !pinned) apply(null); });
  gNodes.addEventListener('focusin',   ev => { const g = ev.target.closest('.sg-node'); if (g && !pinned) apply(g.dataset.id); });
  gNodes.addEventListener('focusout',  () => { if (!pinned) apply(null); });
  gNodes.addEventListener('click', ev => {
    const g = ev.target.closest('.sg-node'); if (!g) return;
    ev.stopPropagation();
    setPin(pinned === g.dataset.id ? null : g.dataset.id);
  });
  gNodes.addEventListener('keydown', ev => {
    const g = ev.target.closest('.sg-node'); if (!g) return;
    if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); setPin(pinned === g.dataset.id ? null : g.dataset.id); }
  });
  svg.addEventListener('click', () => { if (pinned) setPin(null); });
  document.addEventListener('keydown', ev => { if (ev.key === 'Escape' && pinned) setPin(null); });
}
