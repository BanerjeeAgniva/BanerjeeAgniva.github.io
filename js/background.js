/**
 * background.js — the animated canvas behind the whole page.
 *
 * Draws glowing "data packets" that ride flowing sine-wave lanes, plus a layer
 * of drifting dust. It's purely decorative:
 *   - colours are read from the live `--accent` CSS variable, so it follows the
 *     light/dark theme (a MutationObserver re-reads them on theme change);
 *   - it pauses when the tab is hidden and respects `prefers-reduced-motion`
 *     (drawing a single static frame instead of animating);
 *   - delta-time is clamped so returning to the tab doesn't cause a jump.
 */
export function initBackground() {
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
}
