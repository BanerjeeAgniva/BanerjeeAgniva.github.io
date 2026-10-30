/**
 * skillGraph.js — the "How It Connects" skill map.
 *
 * A two-column SVG: roles, projects and awards on the left, skills on the right,
 * with a curved connector for every "used X here". Hovering (or focusing) a node
 * dims everything except its own trace — the lines and the nodes on the other
 * side light up — and a detail panel below spells out the actual work behind the
 * link (which bullet maps to which skill). Click pins a selection; Esc or a
 * click on empty space clears it. Fully keyboard-navigable (Tab between nodes,
 * Enter/Space to pin).
 *
 * Everything is data-driven: SOURCES carry their achievements (text + the skills
 * each one demonstrates), and the graph's edges are derived from them, so the map
 * and the panel never drift apart. Edit the data, never the geometry.
 */
export function initSkillGraph() {
  const host = document.getElementById('skillGraph');
  if (!host) return;
  const detail = document.getElementById('sgDetail');

  const DEV = 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/';
  const SI  = 'https://cdn.simpleicons.org/';

  /* ── skills (right column), grouped top-to-bottom; icon optional ─────── */
  const SKILLS = [
    { id: 'cpp',       name: 'C++',                 icon: DEV + 'cplusplus/cplusplus-original.svg' },
    { id: 'csharp',    name: 'C# / .NET',           icon: DEV + 'csharp/csharp-original.svg' },
    { id: 'aspnet',    name: 'ASP.NET',             icon: DEV + 'dot-net/dot-net-original.svg' },
    { id: 'sql',       name: 'SQL Server',          icon: DEV + 'microsoftsqlserver/microsoftsqlserver-plain.svg' },
    { id: 'rest',      name: 'REST APIs' },
    { id: 'data',      name: 'Data Modeling' },
    { id: 'sysdesign', name: 'System Design' },
    { id: 'modmono',   name: 'Modular Monoliths' },
    { id: 'distsys',   name: 'Distributed Systems' },
    { id: 'angular',   name: 'Angular',             icon: DEV + 'angularjs/angularjs-original.svg' },
    { id: 'ts',        name: 'TypeScript',          icon: DEV + 'typescript/typescript-original.svg' },
    { id: 'react',     name: 'React',               icon: DEV + 'react/react-original.svg' },
    { id: 'node',      name: 'Node.js',             icon: DEV + 'nodejs/nodejs-original.svg' },
    { id: 'backstage', name: 'Backstage',           icon: SI + 'backstage' },
    { id: 'playwright',name: 'Playwright',          icon: SI + 'playwright' },
    { id: 'cypress',   name: 'Cypress',             icon: DEV + 'cypressio/cypressio-original.svg' },
    { id: 'copilot',   name: 'Copilot / MCP',       icon: SI + 'githubcopilot' },
    { id: 'cicd',      name: 'CI/CD' },
    { id: 'buildkite', name: 'Buildkite',           icon: SI + 'buildkite' },
    { id: 'gcp',       name: 'GCP',                 icon: DEV + 'googlecloud/googlecloud-original.svg' },
  ];
  const SKILL = Object.fromEntries(SKILLS.map(s => [s.id, s]));

  /* ── sources (left column): each achievement names the skills it proves ─ */
  const SOURCES = [
    { id: 'wf', name: 'Wells Fargo', kind: 'job', ach: [
      { t: 'Deliver production features for complex financial workflows — accounts, transactions, assessments, uploads, reporting.', s: ['csharp', 'aspnet'] },
      { t: 'Build backend services and user-facing features with C#, ASP.NET, SQL Server, Angular, and TypeScript.', s: ['csharp', 'aspnet', 'sql', 'angular', 'ts'] },
      { t: 'Designed a modular architecture approach giving business capabilities clearer boundaries, preserving the existing deployment and database model.', s: ['modmono', 'sysdesign'] },
      { t: 'Completed transactional remediation for 92,000+ records while coordinating related database changes.', s: ['sql', 'data'] },
      { t: 'Designed cross-layer solutions spanning the UI, APIs, business logic, and the relational database.', s: ['rest', 'sysdesign', 'sql'] },
      { t: 'Create architecture diagrams and technical documentation that make complex changes easier to understand.', s: ['sysdesign'] },
    ] },
    { id: 'harness', name: 'Harness', kind: 'job', ach: [
      { t: 'Improved developer productivity 25% integrating GitHub Copilot, Wiz, Buildkite and DX tooling into a Backstage portal for 120+ engineers.', s: ['backstage', 'copilot', 'buildkite'] },
      { t: 'Built 5 production-grade Backstage plugins with TypeScript, React and Node.js — owning frontend and backend services.', s: ['ts', 'react', 'node', 'backstage'] },
      { t: 'Delivered self-service CI/CD workflows, cutting onboarding time 50%.', s: ['cicd'] },
      { t: 'Expanded test coverage 35% with Cypress, TestNG and Postman across QA, PROD and EU.', s: ['cypress'] },
      { t: 'Improved post-deployment stability 30% via multi-environment sanity checks and GCP error monitoring.', s: ['gcp'] },
      { t: 'Built a PR review assistant (HackWeek 2025) integrating Jira MCP APIs, cutting review iterations 20%.', s: ['copilot'] },
      { t: 'Designed plugins with clear service boundaries, validation and failure handling for distributed systems.', s: ['distsys', 'sysdesign'] },
    ] },
    { id: 'urjanet', name: 'Urjanet', kind: 'job', ach: [
      { t: 'Analyzed 50,000+ records with Python dashboards and geospatial visualizations to surface regional inefficiencies.', s: ['data'] },
      { t: 'Streamlined legacy analytics workflows, cutting manual reporting effort 40%.', s: ['data'] },
    ] },
    { id: 'graphify', name: 'Graphify', kind: 'proj', ach: [
      { t: 'Built an AST-backed code knowledge graph for dependency analysis and AI context — surfacing relevant relationships without loading the whole repo.', s: ['sysdesign', 'distsys', 'copilot', 'data'] },
    ] },
    { id: 'modarch', name: 'Modular Architecture', kind: 'proj', ach: [
      { t: 'Proof of concept introducing clearer business boundaries inside a large application — better ownership without separate-service overhead.', s: ['modmono', 'sysdesign', 'csharp'] },
    ] },
    { id: 'browser', name: 'Browser Automation', kind: 'proj', ach: [
      { t: 'Migrated UI automation toward C# and Playwright for a maintainable, AI-assisted testing foundation.', s: ['playwright', 'cypress', 'csharp', 'cicd'] },
    ] },
    { id: 'icpc', name: 'ICPC Regionalist', kind: 'award', ach: [
      { t: 'ICPC Regionalist — Kanpur-Mathura (Rank 68), Gwalior-Pune (Rank 318). Competitive programming in C++.', s: ['cpp'] },
    ] },
  ];
  const SOURCE = Object.fromEntries(SOURCES.map(s => [s.id, s]));

  // edges = deduped (source -> skill) pairs flattened from achievements
  const edgeKey = new Set();
  const EDGES = [];
  SOURCES.forEach(src => src.ach.forEach(a => a.s.forEach(sk => {
    const k = src.id + '|' + sk;
    if (!edgeKey.has(k)) { edgeKey.add(k); EDGES.push({ src: src.id, skill: sk }); }
  })));

  /* ── geometry ──────────────────────────────────────────────────────── */
  const W = 1000, NH = 30, TOP = 52;
  const LX = 0,   LW = 210;
  const RW = 210, RX = W - RW;
  const rowPitch = 30;
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
    'aria-label': 'Connection map: roles, projects and an award on the left, linked by lines to the skills used in each, on the right. Hover or focus a node to trace its connections and read the work behind them.',
  });

  const defs = el('defs');
  [['sg-arr'], ['sg-arr-hi']].forEach(m => {
    const mk = el('marker', { id: m[0], viewBox: '0 0 10 10', refX: '9', refY: '5', markerWidth: '7', markerHeight: '7', orient: 'auto-start-reverse' });
    mk.appendChild(el('path', { d: 'M0,0 L10,5 L0,10 z' }));
    defs.appendChild(mk);
  });
  svg.appendChild(defs);

  svg.appendChild(el('text', { x: LX, y: 30, class: 'sg-colhead' }, 'ROLES / PROJECTS'));
  svg.appendChild(el('text', { x: RX + RW, y: 30, class: 'sg-colhead', 'text-anchor': 'end' }, 'SKILLS'));

  const gEdges = el('g'), gNodes = el('g');
  svg.appendChild(gEdges); svg.appendChild(gNodes);

  const edges = []; // {el, src, skill}
  function curve(a, b) {
    const x1 = a.x + a.w, y1 = a.y + NH / 2, x2 = b.x, y2 = b.y + NH / 2, mx = (x1 + x2) / 2;
    return 'M' + x1 + ',' + r1(y1) + ' C' + mx + ',' + r1(y1) + ' ' + mx + ',' + r1(y2) + ' ' + x2 + ',' + r1(y2);
  }
  EDGES.forEach(({ src, skill }) => {
    const p = el('path', { d: curve(pos['r:' + src], pos['s:' + skill]), class: 'sg-edge' });
    gEdges.appendChild(p);
    edges.push({ el: p, src, skill });
  });

  const nodes = {}; // id -> g
  function addNode(id, label, cls, title, icon) {
    const p = pos[id];
    const g = el('g', { class: 'sg-node ' + cls, tabindex: '0', role: 'button', 'data-id': id, 'aria-label': title });
    g.appendChild(el('title', {}, title));
    g.appendChild(el('rect', { x: p.x, y: p.y, width: p.w, height: NH, rx: 7 }));
    if (cls === 'skill') {
      // skills are left-aligned so icon'd and text-only rows line up
      if (icon) g.appendChild(el('image', { href: icon, x: p.x + 12, y: p.y + (NH - 16) / 2, width: 16, height: 16, preserveAspectRatio: 'xMidYMid meet' }));
      g.appendChild(el('text', { x: p.x + (icon ? 36 : 14), y: p.y + NH / 2 + 4.5 }, label));
    } else {
      g.appendChild(el('text', { x: p.x + p.w / 2, y: p.y + NH / 2 + 4.5, 'text-anchor': 'middle' }, label));
    }
    gNodes.appendChild(g); nodes[id] = g; return g;
  }
  const kindLabel = { job: 'role', proj: 'project', award: 'award' };
  SOURCES.forEach(s => addNode('r:' + s.id, s.name, s.kind, s.name + ' — ' + kindLabel[s.kind] + '; hover to trace its skills'));
  SKILLS.forEach(s => addNode('s:' + s.id, s.name, 'skill', s.name + ' — hover to trace where it was used', s.icon));

  host.appendChild(svg);

  /* ── detail panel ──────────────────────────────────────────────────── */
  const esc = str => String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const chips = ids => ids.map(id => '<span class="sg-chip">' + esc(SKILL[id].name) + '</span>').join('');

  function renderRest() {
    if (!detail) return;
    detail.innerHTML =
      '<div class="sg-dhead"><span class="sg-dkind' + (pinned ? ' pinned' : '') + '">' +
      (pinned ? 'Pinned' : 'At rest') + '</span>' +
      '<span class="sg-dname">Point at a role, project or skill</span></div>' +
      '<p class="sg-hint">Hover previews the trace and the work behind it; click to pin so you can read on.</p>';
  }
  function renderPanel(sel) {
    if (!detail) return;
    const isSkill = sel.charAt(0) === 's', id = sel.slice(2);
    const pin = pinned ? 'Pinned · ' : '';
    if (!isSkill) {
      const src = SOURCE[id];
      let body = src.ach.map(a =>
        '<p class="sg-ach">' + esc(a.t) + ' ' + chips(a.s) + '</p>').join('');
      detail.innerHTML =
        '<div class="sg-dhead"><span class="sg-dkind' + (pinned ? ' pinned' : '') + '">' + pin + kindLabel[src.kind] + '</span>' +
        '<span class="sg-dname">' + esc(src.name) + '</span></div>' +
        '<div class="sg-dbody">' + body + '</div>';
    } else {
      const sk = SKILL[id];
      const proofs = [];
      SOURCES.forEach(src => src.ach.forEach(a => {
        if (a.s.includes(id)) proofs.push('<p class="sg-ach"><b>' + esc(src.name) + '</b> — ' + esc(a.t) + '</p>');
      }));
      detail.innerHTML =
        '<div class="sg-dhead"><span class="sg-dkind' + (pinned ? ' pinned' : '') + '">' + pin + 'skill</span>' +
        '<span class="sg-dname">' + esc(sk.name) + '</span></div>' +
        '<div class="sg-dbody">' + proofs.join('') + '</div>';
    }
  }

  /* ── highlight ─────────────────────────────────────────────────────── */
  let pinned = null;

  function clearHi() {
    svg.classList.remove('sg-focus');
    edges.forEach(e => e.el.classList.remove('hi'));
    for (const k in nodes) nodes[k].classList.remove('hi');
  }
  function apply(sel) {
    clearHi();
    if (!sel) { renderRest(); return; }
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
    renderPanel(sel);
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

  renderRest();
}
